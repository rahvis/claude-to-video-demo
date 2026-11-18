"""Compose the film's original score and sound effects from the timeline.

Everything is synthesised here (no samples), so the result is royalty-free. The
arrangement is driven by src/timeline.json (scene starts) and src/events.json
(visual beats), so hits land on the frames the animation uses.

Outputs audio/build/music.wav and audio/build/sfx.wav (48 kHz stereo).
`--variant light` reads src/light/timeline.json and writes audio/build/light/.
`--variant trace` is the Trace Privacy film: its own beats (src/trace/events.json) and arrangement.
`--variant holly` is the Holly OS app film: its own palette (F major / Lydian, 100 BPM) and UI sounds.
`--variant see` is the See launch film: C# minor for the problem, E major from the reveal (100 BPM).
`--variant see-white` is its 90 s white edition, on the same palette.
`--variant see-pitch` is the 120 s investor pitch, on the same palette.
"""

import inspect
import json
import sys
import zlib
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, istft, sosfilt, stft

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SR = 48000
BPM = 96
BEAT = 60 / BPM

VARIANT = sys.argv[sys.argv.index("--variant") + 1] if "--variant" in sys.argv else ""
TL = json.loads((ROOT / "src" / VARIANT / "timeline.json").read_text())
_ev = ROOT / "src" / VARIANT / "events.json"  # a film with its own beats keeps them beside its timeline
EV = json.loads((_ev if VARIANT and _ev.exists() else ROOT / "src/events.json").read_text())
FPS = TL["fps"]
DUR = TL["durationInFrames"] / FPS
N = int(DUR * SR)
rng = np.random.default_rng(7)

SCENES = {s["id"]: s for s in TL["scenes"]}


def scene_t(sid: str) -> float:
    return SCENES[sid]["from"] / FPS


def event_t(sid: str, name: str) -> float:
    s, e = SCENES[sid], EV[sid][name]
    base = 0
    if e["cue"] is not None:
        cue = s["cues"][e["cue"]]
        if "word" in e:
            base = cue["words"][e["word"]]["frame"]
        elif "frac" in e:  # a fraction into the line (languages without spaces)
            base = round(cue["frame"] + e["frac"] * (cue["endFrame"] - cue["frame"]))
        else:
            base = cue["frame"]
    return (s["from"] + base + e["at"]) / FPS


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


class Bus:
    def __init__(self, seconds: float):
        self.x = np.zeros((2, int(seconds * SR) + SR * 6), dtype=np.float64)

    def add(self, t: float, sig: np.ndarray, amp: float = 1.0, pan: float = 0.0):
        """Mono or stereo `sig` at time t (s), equal-power pan in [-1, 1]."""
        i = int(round(t * SR))
        if i >= self.x.shape[1] or i + sig.shape[-1] <= 0:
            return
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            sig = np.stack([np.cos(a) * sig, np.sin(a) * sig])
        if i < 0:
            sig, i = sig[:, -i:], 0
        n = min(sig.shape[1], self.x.shape[1] - i)
        self.x[:, i : i + n] += amp * sig[:, :n]


def tt(sec: float) -> np.ndarray:
    return np.arange(int(sec * SR)) / SR


def env_ar(n: int, attack: float, release: float) -> np.ndarray:
    e = np.ones(n)
    a, r = int(attack * SR), int(release * SR)
    if a:
        e[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if r:
        e[-r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return e


# ── instruments ────────────────────────────────────────────────────────────

def pad(notes, sec, bright=0.0, cutoff=1800.0):
    """Warm detuned additive pad; stereo from opposite detunes."""
    t = tt(sec)
    out = np.zeros((2, len(t)))
    for m in notes:
        f0 = hz(m)
        for ch, cents in ((0, -6.0), (1, 6.0)):
            f = f0 * 2 ** (cents / 1200)
            vib = 1 + 0.0015 * np.sin(2 * np.pi * (0.13 + 0.02 * ch) * t + rng.uniform(0, 6))
            ph = 2 * np.pi * np.cumsum(f * vib) / SR
            for k in range(1, 11):
                if f * k > 9000:
                    break
                out[ch] += np.sin(k * ph + rng.uniform(0, 6)) * (1 / k) ** (1.9 - bright)
    out *= env_ar(len(t), min(1.4, sec / 3), min(1.8, sec / 2.5))
    out = np.stack([lp(out[0], cutoff), lp(out[1], cutoff)])
    return out / (len(notes) * 2.2)


def pluck(m, sec=2.6, decay=0.9, bright=1.0):
    """Felt-piano-ish pluck: slightly inharmonic partials, per-partial decay."""
    t = tt(sec)
    f = hz(m)
    y = np.zeros_like(t)
    for k, (r, a) in enumerate(zip([1, 2, 3.01, 4.03, 5.08], [1, 0.45, 0.2 * bright, 0.09 * bright, 0.04 * bright])):
        y += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (decay / (1 + k * 0.9)))
    y *= env_ar(len(t), 0.004, 0.05)
    return lp(y, min(9000, f * 9))


def kick(amp=1.0):
    t = tt(0.5)
    f = 44 + 80 * np.exp(-t / 0.03)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    y += 0.15 * hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.004)
    return amp * y


def hat():
    t = tt(0.08)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t / 0.018)


def bass(m, sec):
    t = tt(sec)
    y = np.sin(2 * np.pi * hz(m) * t) + 0.25 * np.sin(2 * np.pi * 2 * hz(m) * t)
    return y * env_ar(len(t), 0.02, min(0.4, sec / 2)) * np.exp(-t / 3)


def riser(sec):
    t = tt(sec)
    n = rng.standard_normal(len(t))
    x = t / sec
    lo = lp(n, 900) * (1 - x) ** 1.5
    hi = hp(n, 3000) * x**2.2
    sweep = np.sin(2 * np.pi * np.cumsum(200 * 2 ** (x * 2.6)) / SR) * x**3 * 0.18
    y = (0.5 * lo + hi + sweep) * x**1.6
    return y * env_ar(len(t), 0.2, 0.01)


def impact(big=1.0):
    t = tt(3.0)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 30 * np.exp(-t / 0.08)) / SR) * np.exp(-t / (0.9 * big))
    body = lp(rng.standard_normal(len(t)), 500) * np.exp(-t / 0.25) * 0.8
    air = hp(rng.standard_normal(len(t)), 2000) * np.exp(-t / 0.03) * 0.3
    return boom + body + air


# ── sound effects ──────────────────────────────────────────────────────────

def s_swoosh():
    t = tt(0.6)
    x = t / 0.6
    e = np.where(x < 0.35, (x / 0.35) ** 2, np.exp(-(x - 0.35) / 0.14))
    return bp(rng.standard_normal(len(t)), 400, 5000) * e * 0.5


def s_tick(f=2400):
    t = tt(0.06)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t)) * np.exp(-t / 0.012) * 0.6


def s_type_click():
    t = tt(0.03)
    return (hp(rng.standard_normal(len(t)), 3000) * 0.6 + np.sin(2 * np.pi * 1700 * t) * 0.3) * np.exp(-t / 0.004)


def s_low():
    t = tt(0.9)
    return np.sin(2 * np.pi * np.cumsum(62 + 20 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.3)


def s_strike():
    t = tt(0.25)
    swipe = bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.05) * 0.5
    return swipe + 0.8 * np.pad(s_low(), (0, 0))[: len(t)]


def s_scramble():
    out = np.zeros(int(0.7 * SR))
    for i in range(22):
        c = s_tick(rng.uniform(1800, 4200)) * rng.uniform(0.2, 0.5)
        j = int(i * 0.03 * SR)
        out[j : j + len(c)] += c[: len(out) - j]
    return out


def s_block():
    t = tt(0.3)
    return (np.sign(np.sin(2 * np.pi * 110 * t)) * 0.25 + np.sin(2 * np.pi * 82 * t)) * np.exp(-t / 0.06) * 0.7


def s_stamp():
    return np.concatenate([0.9 * kick()[: int(0.4 * SR)]]) + np.pad(s_tick(1800), (0, int(0.4 * SR) - int(0.06 * SR)))


def s_pop():
    t = tt(0.09)
    return np.sin(2 * np.pi * np.cumsum(900 + 600 * t / 0.09) / SR) * np.exp(-t / 0.03) * 0.6


def s_empty():
    a, b = pluck(76, 1.2, 0.5), pluck(71, 1.4, 0.6)
    out = np.zeros(int(1.8 * SR))
    out[: len(a)] += a
    j = int(0.16 * SR)
    out[j : j + len(b)] += b
    return out * 0.45


def s_count():
    out = np.zeros(int(1.2 * SR))
    for i in range(14):
        c = s_tick(1500 + i * 110) * (0.25 + i * 0.03)
        j = int((i * 0.065) * SR)
        out[j : j + len(c)] += c
    return out


def s_glitch():
    out = np.zeros(int(0.5 * SR))
    for i, d in enumerate([0.0, 0.07, 0.12, 0.2]):
        t = tt(0.045)
        burst = np.round(rng.standard_normal(len(t)) * 3) / 3 * 0.5
        burst += 0.4 * np.sign(np.sin(2 * np.pi * (320 + 140 * i) * t))
        j = int(d * SR)
        out[j : j + len(t)] += burst * np.exp(-t / 0.03)
    return lp(out, 6000)


def s_error():
    t = tt(0.7)
    y = (np.sin(2 * np.pi * hz(55) * t) + np.sin(2 * np.pi * hz(56) * t) * 0.8) * np.exp(-t / 0.22)
    return y * env_ar(len(t), 0.005, 0.1) * 0.6


def s_chime():
    out = np.zeros(int(2.4 * SR))
    for i, m in enumerate([74, 78, 81, 86]):
        p = pluck(m, 2.0, 1.1) * (0.5 - i * 0.06)
        j = int(i * 0.045 * SR)
        out[j : j + len(p)] += p[: len(out) - j]
    return out


def s_shimmer():
    out = np.zeros(int(2.2 * SR))
    for i, m in enumerate([81, 85, 88, 93, 97]):
        p = pluck(m, 1.6, 0.7, bright=0.5) * 0.22
        j = int(i * 0.05 * SR)
        out[j : j + len(p)] += p[: len(out) - j]
    return out


def reverb(x, seconds=2.6, predelay=0.02, damp=4500):
    t = tt(seconds)
    ir = np.stack([rng.standard_normal(len(t)), rng.standard_normal(len(t))]) * np.exp(-t / (seconds / 5.5))
    ir = np.stack([lp(ir[0], damp), lp(ir[1], damp)])
    ir = np.pad(ir, ((0, 0), (int(predelay * SR), 0)))
    ir /= np.sqrt((ir**2).sum(axis=1, keepdims=True))
    return np.stack([fftconvolve(x[0], ir[0])[: x.shape[1]], fftconvolve(x[1], ir[1])[: x.shape[1]]])


# ── arrangement ────────────────────────────────────────────────────────────

CHORDS = {
    "D": ([50, 54, 57, 61, 64], 38),  # Dmaj9
    "Bm": ([47, 50, 54, 57, 61], 35),  # Bm9
    "G": ([43, 47, 50, 54, 57], 31),  # Gmaj9
    "A": ([45, 52, 57, 59, 64], 33),  # Asus2
}
CYCLE = ["D", "Bm", "G", "A"]
ARP = [0, 2, 4, 2, 1, 3, 4, 3]


def compose_music() -> np.ndarray:
    music = Bus(DUR)
    t_s02, t_s04, t_s05 = scene_t("s02_problem"), scene_t("s04_confidential"), scene_t("s05_conformal")
    t_s07, t_s08, t_s10 = scene_t("s07_commit"), scene_t("s08_verify"), scene_t("s10_tagline")
    t_hit = event_t("s03_title", "impact")
    t_l1, t_l2 = event_t("s10_tagline", "line1"), event_t("s10_tagline", "line2")
    t_mark = event_t("s10_tagline", "mark")

    # Intro: hushed, dark pads with a lone pluck under the hook.
    music.add(0.0, pad(CHORDS["D"][0], t_s02 + 1.2, cutoff=700), 0.55)
    for sid, cue in (("s01_hook", 0), ("s01_hook", 1), ("s01_hook", 2)):
        t = (SCENES[sid]["from"] + SCENES[sid]["cues"][cue]["frame"]) / FPS
        music.add(t, pluck(69 + (cue * 2 if cue < 2 else 5), 2.6, 1.2), 0.07, pan=-0.3 + cue * 0.3)
    music.add(t_s02 - 0.2, pad(CHORDS["Bm"][0], t_hit - t_s02 + 1.4, cutoff=900), 0.6)
    music.add(t_hit - 2.4, riser(2.4), 0.22)
    music.add(t_hit, impact(), 0.55)

    # Groove: chord cycle on a beat grid anchored to the title impact.
    t, i = t_hit, 0
    end = t_s10 - 0.02
    while t < end:
        name = CYCLE[i % 4]
        notes, root = CHORDS[name]
        length = min(BEAT * 8, end - t)
        cutoff = 1500 if t < t_s05 else (2200 if t < t_s07 else 3000)
        music.add(t, pad(notes, length + 1.6, bright=0.25 if t >= t_s07 else 0.0, cutoff=cutoff), 0.62)
        if t >= t_s04 - 0.01:
            music.add(t, bass(root + 12, length), 0.16)
        t += BEAT * 8
        i += 1

    k = 0
    while True:
        tb = t_hit + k * BEAT
        if tb >= end - 0.05:
            break
        chord_notes = CHORDS[CYCLE[int((tb - t_hit) // (BEAT * 8)) % 4]][0]
        if tb < t_s04:
            if k % 4 == 0:
                music.add(tb, pluck(chord_notes[0] + 24, 2.4, 1.0), 0.05, pan=0.2)
        else:
            if tb >= t_s05 or k % 2 == 0:
                music.add(tb, kick(), 0.34 if tb < t_s07 else 0.42)
            if tb >= t_s07:
                music.add(tb + BEAT / 2, hat(), 0.05, pan=0.25)
            if tb >= t_s05:
                for h in range(2):
                    idx = ARP[(k * 2 + h) % 8]
                    music.add(tb + h * BEAT / 2, pluck(chord_notes[idx] + 12, 1.6, 0.55), 0.045, pan=-0.35 if h else 0.35)
            if tb >= t_s08:
                if k % 2 == 0:
                    music.add(tb + BEAT / 4, pluck(chord_notes[(k // 2) % 5] + 24, 1.2, 0.4, bright=0.6), 0.03, pan=0.5)
        k += 1

    # The drop: groove stops at the tagline; a faint pad holds, then resolves big on the wordmark.
    music.add(t_l1 - 0.3, pad(CHORDS["G"][0], t_l2 - t_l1 + 0.8, cutoff=800), 0.32)
    music.add(t_l2 - 0.3, pad(CHORDS["A"][0], t_mark - t_l2 + 0.9, cutoff=1000), 0.38)
    music.add(t_mark, pad(CHORDS["D"][0] + [69], DUR - t_mark + 0.2, bright=0.35, cutoff=3200), 0.9)
    music.add(t_mark, bass(38 + 12, DUR - t_mark), 0.2)
    music.add(t_mark, impact(big=1.6), 0.4)
    for j, m in enumerate([62, 69, 74, 78, 81, 86]):
        music.add(t_mark + 0.25 + j * 0.18, pluck(m, 3.0, 1.4), 0.06, pan=-0.5 + j * 0.2)

    x = music.x[:, :N]
    x = x + 0.32 * reverb(x)
    fade = int(1.4 * SR)
    x[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
    return x



def compose_music_trace() -> np.ndarray:
    """Trace Privacy film: same palette and grid, but the groove builds under the trace
    and the attack, pulls back into a riser, and lands on the title before driving on."""
    music = Bus(DUR)
    t_02, t_03, t_04 = scene_t("t02_leak"), scene_t("t03_trace"), scene_t("t04_attack")
    t_05, t_07, t_08 = scene_t("t05_threshold"), scene_t("t07_define"), scene_t("t08_shield")
    t_09, t_10 = scene_t("t09_boundary"), scene_t("t10_tagline")
    t_hit = event_t("t06_title", "impact")
    t_l1, t_l2 = event_t("t10_tagline", "line1"), event_t("t10_tagline", "line2")
    t_mark = event_t("t10_tagline", "mark")
    t_rise = t_hit - 2.4

    # Intro: hushed pad, one pluck per protection as it clicks on.
    music.add(0.0, pad(CHORDS["D"][0], t_02 + 1.2, cutoff=700), 0.55)
    for cue, m in enumerate([69, 71, 74, 76]):
        t = SCENES["t01_hook"]["cues"][cue]["frame"] / FPS
        music.add(t, pluck(m, 2.6, 1.2), 0.07, pan=-0.3 + cue * 0.2)
    # The leak: the floor drops to a darker chord.
    music.add(t_02 - 0.2, pad(CHORDS["Bm"][0], t_03 - t_02 + 1.4, cutoff=800), 0.6)

    def chords(anchor, end, cutoff_at, bright_at, bass_from):
        t, i = anchor, 0
        while t < end - 0.05:
            notes, root = CHORDS[CYCLE[i % 4]]
            length = min(BEAT * 8, end - t)
            music.add(t, pad(notes, length + 1.6, bright=bright_at(t), cutoff=cutoff_at(t)), 0.62)
            if t >= bass_from - 0.01:
                music.add(t, bass(root + 12, length), 0.16)
            t += BEAT * 8
            i += 1

    def beats(anchor, end, step):
        k = 0
        while anchor + k * BEAT < end - 0.05:
            tb = anchor + k * BEAT
            step(k, tb, CHORDS[CYCLE[int((tb - anchor) // (BEAT * 8)) % 4]][0])
            k += 1

    def arp(k, tb, notes, amp=0.045):
        for h in range(2):
            music.add(tb + h * BEAT / 2, pluck(notes[ARP[(k * 2 + h) % 8]] + 12, 1.6, 0.55), amp, pan=-0.35 if h else 0.35)

    # Build: the trace draws, the attack lands; kick arrives with the numbers.
    chords(t_03, t_rise, lambda t: 1300 if t < t_04 else 1700, lambda t: 0.0, t_04)

    def build_step(k, tb, notes):
        if tb < t_04:
            if k % 4 == 0:
                music.add(tb, pluck(notes[0] + 24, 2.4, 1.0), 0.05, pan=0.2)
            return
        if tb >= t_05 or k % 2 == 0:
            music.add(tb, kick(), 0.3 if tb < t_05 else 0.34)
        arp(k, tb, notes, 0.038)

    beats(t_03, t_rise, build_step)
    music.add(t_rise, riser(2.4), 0.24)
    music.add(t_hit, impact(), 0.55)

    # Drive: after the title, full groove; hats with TraceShield, a top line at the boundary.
    chords(t_hit, t_10 - 0.02, lambda t: 2200 if t < t_08 else 3000, lambda t: 0.25 if t >= t_08 else 0.0, t_hit)

    def drive_step(k, tb, notes):
        music.add(tb, kick(), 0.38 if tb < t_08 else 0.42)
        if tb >= t_08:
            music.add(tb + BEAT / 2, hat(), 0.05, pan=0.25)
        if tb >= t_07:
            arp(k, tb, notes)
        if tb >= t_09 and k % 2 == 0:
            music.add(tb + BEAT / 4, pluck(notes[(k // 2) % 5] + 24, 1.2, 0.4, bright=0.6), 0.03, pan=0.5)

    beats(t_hit, t_10 - 0.02, drive_step)

    # The drop, then the resolve on the wordmark (as in the CCI film).
    music.add(t_l1 - 0.3, pad(CHORDS["G"][0], t_l2 - t_l1 + 0.8, cutoff=800), 0.32)
    music.add(t_l2 - 0.3, pad(CHORDS["A"][0], t_mark - t_l2 + 0.9, cutoff=1000), 0.38)
    music.add(t_mark, pad(CHORDS["D"][0] + [69], DUR - t_mark + 0.2, bright=0.35, cutoff=3200), 0.9)
    music.add(t_mark, bass(38 + 12, DUR - t_mark), 0.2)
    music.add(t_mark, impact(big=1.6), 0.4)
    for j, m in enumerate([62, 69, 74, 78, 81, 86]):
        music.add(t_mark + 0.25 + j * 0.18, pluck(m, 3.0, 1.4), 0.06, pan=-0.5 + j * 0.2)

    x = music.x[:, :N]
    x = x + 0.32 * reverb(x)
    fade = int(1.4 * SR)
    x[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
    return x


def compose_music_tahoe() -> np.ndarray:
    """TahoeAI film: same palette and grid. A hushed, cluttered intro resolves on
    the wordmark impact, then a warm, confident groove drives through the feature
    beats (search, github, capture, match, outreach, integrations) before pulling
    back into the closing tagline and the WorkOnward lockup."""
    music = Bus(DUR)
    t_02 = scene_t("s02_shift")
    t_04, t_05, t_06 = scene_t("s04_search"), scene_t("s05_github"), scene_t("s06_capture")
    t_07, t_08, t_09 = scene_t("s07_match"), scene_t("s08_outreach"), scene_t("s09_integrations")
    t_10 = scene_t("s10_promise")
    t_hit = event_t("s03_title", "impact")
    t_l1, t_l2 = event_t("s11_tagline", "line1"), event_t("s11_tagline", "line2")
    t_mark = event_t("s11_tagline", "mark")
    t_rise = t_hit - 2.2

    # Intro: hushed pad under the cluttered hook, one pluck per phrase.
    music.add(0.0, pad(CHORDS["D"][0], t_02 + 1.2, cutoff=700), 0.55)
    for cue, m in enumerate([69, 73, 77]):
        t = SCENES["s01_hook"]["cues"][cue]["frame"] / FPS
        music.add(t, pluck(m, 2.6, 1.2), 0.07, pan=-0.3 + cue * 0.3)
    # The pivot: floor drops to a darker chord, then rises into the title.
    music.add(t_02 - 0.2, pad(CHORDS["Bm"][0], t_rise - t_02 + 1.4, cutoff=850), 0.6)
    music.add(t_rise, riser(2.2), 0.22)
    music.add(t_hit, impact(), 0.55)

    def chords(anchor, end, cutoff_at, bright_at, bass_from):
        t, i = anchor, 0
        while t < end - 0.05:
            notes, root = CHORDS[CYCLE[i % 4]]
            length = min(BEAT * 8, end - t)
            music.add(t, pad(notes, length + 1.6, bright=bright_at(t), cutoff=cutoff_at(t)), 0.62)
            if t >= bass_from - 0.01:
                music.add(t, bass(root + 12, length), 0.16)
            t += BEAT * 8
            i += 1

    def beats(anchor, end, step):
        k = 0
        while anchor + k * BEAT < end - 0.05:
            tb = anchor + k * BEAT
            step(k, tb, CHORDS[CYCLE[int((tb - anchor) // (BEAT * 8)) % 4]][0])
            k += 1

    def arp(k, tb, notes, amp=0.045):
        for h in range(2):
            music.add(tb + h * BEAT / 2, pluck(notes[ARP[(k * 2 + h) % 8]] + 12, 1.6, 0.55), amp, pan=-0.35 if h else 0.35)

    # Drive: full groove from the title impact through every feature beat, brightening
    # as the product proves itself out (search -> github -> capture -> match -> outreach -> integrations).
    chords(t_hit, t_10 - 0.02, lambda t: 1500 if t < t_07 else (2200 if t < t_09 else 3000), lambda t: 0.25 if t >= t_09 else 0.0, t_hit)

    def drive_step(k, tb, notes):
        if tb >= t_05 or k % 2 == 0:
            music.add(tb, kick(), 0.34 if tb < t_08 else 0.42)
        if tb >= t_08:
            music.add(tb + BEAT / 2, hat(), 0.05, pan=0.25)
        if tb >= t_04:
            arp(k, tb, notes)
        if tb >= t_09 and k % 2 == 0:
            music.add(tb + BEAT / 4, pluck(notes[(k // 2) % 5] + 24, 1.2, 0.4, bright=0.6), 0.03, pan=0.5)

    beats(t_hit, t_10 - 0.02, drive_step)

    # The drop, then the resolve on the wordmark and the WorkOnward lockup.
    music.add(t_l1 - 0.3, pad(CHORDS["G"][0], t_l2 - t_l1 + 0.8, cutoff=800), 0.32)
    music.add(t_l2 - 0.3, pad(CHORDS["A"][0], t_mark - t_l2 + 0.9, cutoff=1000), 0.38)
    music.add(t_mark, pad(CHORDS["D"][0] + [69], DUR - t_mark + 0.2, bright=0.35, cutoff=3200), 0.9)
    music.add(t_mark, bass(38 + 12, DUR - t_mark), 0.2)
    music.add(t_mark, impact(big=1.6), 0.4)
    for j, m in enumerate([62, 69, 74, 78, 81, 86]):
        music.add(t_mark + 0.25 + j * 0.18, pluck(m, 3.0, 1.4), 0.06, pan=-0.5 + j * 0.2)

    x = music.x[:, :N]
    x = x + 0.32 * reverb(x)
    fade = int(1.4 * SR)
    x[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
    return x


def compose_music_unparse() -> np.ndarray:
    """Conformal Logit Inference film: same palette and grid. A hushed, single
    intro resolves on the wordmark impact, then a clean, confident groove
    drives through the feature beats (primitives, demo, engines, integrations,
    guarantee) before pulling back into the closing tagline."""
    music = Bus(DUR)
    t_02 = scene_t("s02_problem")
    t_04, t_05, t_06 = scene_t("s04_primitives"), scene_t("s05_demo"), scene_t("s06_engines")
    t_07, t_08, t_09 = scene_t("s07_integrations"), scene_t("s08_guarantee"), scene_t("s09_promise")
    t_hit = event_t("s03_title", "impact")
    t_l1, t_l2 = event_t("s10_tagline", "line1"), event_t("s10_tagline", "line2")
    t_mark = event_t("s10_tagline", "mark")
    t_rise = t_hit - 2.2

    # Intro: hushed pad under the cluttered hook, one pluck per phrase.
    music.add(0.0, pad(CHORDS["D"][0], t_02 + 1.2, cutoff=700), 0.55)
    for cue, m in enumerate([69, 73, 77]):
        t = SCENES["s01_hook"]["cues"][cue]["frame"] / FPS
        music.add(t, pluck(m, 2.6, 1.2), 0.07, pan=-0.3 + cue * 0.3)
    # The pivot: floor drops to a darker chord, then rises into the title.
    music.add(t_02 - 0.2, pad(CHORDS["Bm"][0], t_rise - t_02 + 1.4, cutoff=850), 0.6)
    music.add(t_rise, riser(2.2), 0.22)
    music.add(t_hit, impact(), 0.55)

    def chords(anchor, end, cutoff_at, bright_at, bass_from):
        t, i = anchor, 0
        while t < end - 0.05:
            notes, root = CHORDS[CYCLE[i % 4]]
            length = min(BEAT * 8, end - t)
            music.add(t, pad(notes, length + 1.6, bright=bright_at(t), cutoff=cutoff_at(t)), 0.62)
            if t >= bass_from - 0.01:
                music.add(t, bass(root + 12, length), 0.16)
            t += BEAT * 8
            i += 1

    def beats(anchor, end, step):
        k = 0
        while anchor + k * BEAT < end - 0.05:
            tb = anchor + k * BEAT
            step(k, tb, CHORDS[CYCLE[int((tb - anchor) // (BEAT * 8)) % 4]][0])
            k += 1

    def arp(k, tb, notes, amp=0.045):
        for h in range(2):
            music.add(tb + h * BEAT / 2, pluck(notes[ARP[(k * 2 + h) % 8]] + 12, 1.6, 0.55), amp, pan=-0.35 if h else 0.35)

    # Drive: full groove from the title impact through every feature beat, brightening
    # as the product proves itself out (primitives -> demo -> engines -> integrations -> guarantee).
    chords(t_hit, t_09 - 0.02, lambda t: 1500 if t < t_06 else (2200 if t < t_08 else 3000), lambda t: 0.25 if t >= t_08 else 0.0, t_hit)

    def drive_step(k, tb, notes):
        if tb >= t_05 or k % 2 == 0:
            music.add(tb, kick(), 0.34 if tb < t_07 else 0.42)
        if tb >= t_07:
            music.add(tb + BEAT / 2, hat(), 0.05, pan=0.25)
        if tb >= t_04:
            arp(k, tb, notes)
        if tb >= t_08 and k % 2 == 0:
            music.add(tb + BEAT / 4, pluck(notes[(k // 2) % 5] + 24, 1.2, 0.4, bright=0.6), 0.03, pan=0.5)

    beats(t_hit, t_09 - 0.02, drive_step)

    # The drop, then the resolve on the wordmark and the CTA.
    music.add(t_l1 - 0.3, pad(CHORDS["G"][0], t_l2 - t_l1 + 0.8, cutoff=800), 0.32)
    music.add(t_l2 - 0.3, pad(CHORDS["A"][0], t_mark - t_l2 + 0.9, cutoff=1000), 0.38)
    music.add(t_mark, pad(CHORDS["D"][0] + [69], DUR - t_mark + 0.2, bright=0.35, cutoff=3200), 0.9)
    music.add(t_mark, bass(38 + 12, DUR - t_mark), 0.2)
    music.add(t_mark, impact(big=1.6), 0.4)
    for j, m in enumerate([62, 69, 74, 78, 81, 86]):
        music.add(t_mark + 0.25 + j * 0.18, pluck(m, 3.0, 1.4), 0.06, pan=-0.5 + j * 0.2)

    x = music.x[:, :N]
    x = x + 0.32 * reverb(x)
    fade = int(1.4 * SR)
    x[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
    return x


def compose_music_pitchdeck() -> np.ndarray:
    """Investor pitch deck v2: ambient and percussion free throughout, a
    deliberate change from the driving pop groove used elsewhere in this repo.
    No kick, no hats, no beat grid. Sustained warm pads change once per slide
    instead of on a rhythmic cycle, a gentle swell (not a hard impact) carries
    the wordmark reveals that bookend the film, and a few soft, off-grid
    plucks keep the bed breathing instead of driving."""
    music = Bus(DUR)
    scenes_in_order = TL["scenes"]
    t_hit = event_t("s01_title", "impact")
    t_us = event_t("s08_competition", "us")
    t_l1, t_l2 = event_t("s11_ask", "line1"), event_t("s11_ask", "line2")
    t_mark = event_t("s11_ask", "mark")
    t_rise = t_hit - 3.0

    # Intro: a hushed pad under the opening two beats, one soft pluck each.
    music.add(0.0, pad(CHORDS["D"][0], t_rise + 1.6, bright=-0.1, cutoff=550), 0.5)
    for cue, m in enumerate([69, 73]):
        t = scenes_in_order[0]["cues"][cue]["frame"] / FPS
        music.add(t, pluck(m, 3.0, 1.6, bright=0.2), 0.06, pan=-0.25 + cue * 0.3)

    # A gentle swell into the wordmark, in place of a hard impact hit.
    music.add(t_rise, riser(3.0), 0.13)
    music.add(t_hit, pad(CHORDS["D"][0] + [81], 3.6, bright=0.3, cutoff=2200), 0.5)
    for j, m in enumerate([69, 76, 81]):
        music.add(t_hit + 0.15 + j * 0.22, pluck(m, 2.4, 1.3, bright=0.35), 0.05, pan=-0.3 + j * 0.3)

    # Sustained pad bed: one chord per slide, slow harmonic rhythm, no beat
    # grid. The first and last slides are handled separately above/below.
    for i, sc in enumerate(scenes_in_order):
        if i == 0 or i == len(scenes_in_order) - 1:
            continue
        t0 = sc["from"] / FPS
        t_end = scenes_in_order[i + 1]["from"] / FPS if i + 1 < len(scenes_in_order) else DUR
        notes, root = CHORDS[CYCLE[i % 4]]
        length = max(0.5, t_end - t0)
        bright = 0.15 if t0 >= t_us else 0.0
        music.add(t0, pad(notes, length + 1.8, bright=bright, cutoff=1300 + i * 60), 0.48)
        music.add(t0, bass(root + 12, length), 0.08)
        # one drifting pluck per slide, off any grid, so it never reads as rhythm
        drift = rng.uniform(1.2, max(1.3, length - 1.5))
        note = notes[int(rng.integers(0, len(notes)))]
        music.add(t0 + drift, pluck(note + 12, 2.2, 0.8, bright=0.25), 0.045, pan=float(rng.uniform(-0.4, 0.4)))

    # The competition slide's payoff: one soft chime, not a drum hit.
    music.add(t_us, pluck(86, 2.0, 1.1, bright=0.4), 0.08, pan=0.2)

    # The drop, then the resolve on the wordmark and the closing ask.
    music.add(t_l1 - 0.4, pad(CHORDS["G"][0], t_l2 - t_l1 + 1.0, cutoff=700), 0.28)
    music.add(t_l2 - 0.4, pad(CHORDS["A"][0], t_mark - t_l2 + 1.1, cutoff=850), 0.34)
    music.add(t_mark, pad(CHORDS["D"][0] + [69, 81], DUR - t_mark + 0.3, bright=0.3, cutoff=2600), 0.7)
    music.add(t_mark, bass(38 + 12, DUR - t_mark), 0.15)
    for j, m in enumerate([62, 69, 74, 78, 81, 86]):
        music.add(t_mark + 0.3 + j * 0.22, pluck(m, 3.2, 1.6, bright=0.2), 0.055, pan=-0.5 + j * 0.2)

    x = music.x[:, :N]
    x = x + 0.34 * reverb(x, seconds=3.2)
    fade = int(1.6 * SR)
    x[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
    return x


# ── Holly OS: its own palette, F major / Lydian at 100 BPM ─────────────────
# Used only by `--variant holly`. The films above keep the D-major / 96 BPM
# palette: nothing here touches their instruments, chords, BPM or `rng` stream
# (Holly's sounds draw on their own seeded generators, see _hrng).

H_BPM = 100
H_BEAT = 60 / H_BPM  # 0.6 s
H_BAR = 4 * H_BEAT  # 2.4 s

# chord: (pad voicing, sub-bass root, arpeggio tones; the bells play these an octave up)
H_CHORDS = {
    "F": ([53, 57, 60, 64, 67], 41, [65, 69, 72, 76, 79]),  # Fmaj9         F3 A3 C4 E4 G4 / F2
    "Am": ([52, 57, 60, 64, 67], 33, [64, 69, 72, 76, 79]),  # Am7           E3 A3 C4 E4 G4 / A1
    "Dm": ([50, 53, 57, 60, 64], 38, [62, 65, 69, 72, 76]),  # Dm9           D3 F3 A3 C4 E4 / D2
    "Bb": ([46, 53, 57, 62, 64], 34, [58, 62, 65, 69, 76]),  # Bbmaj7(#11)   Bb2 F3 A3 D4 E4 / Bb1
}
H_CYCLE = ["F", "Am", "Dm", "Bb"]
H_VOX = {"F": [65, 69, 72, 76], "Am": [64, 69, 72, 76], "Dm": [62, 65, 69, 72], "Bb": [62, 65, 70, 74]}  # the 'aah', rooted
H_HOOK = [
    ([50, 57, 60, 64, 65], 38),  # Dm(add9): the 9th (E4) rubs against the 3rd (F4)
    ([50, 58, 62, 65, 69], 36),  # Bbmaj7 over a C pedal: a suspended dominant that wants the F logo
]
H_FLYD = [53, 60, 65, 69, 71, 76]  # Fmaj7(#11) for the close, F doubled (F3 C4 F4 A4 B4 E5); the 'aah' adds the 9th
H_ARP = [0, 1, 2, 3, 4, 3, 2, 1]  # 8ths: rolling up and down through the chord
H_ACCENT = [1.0, 0.55, 0.75, 0.6, 0.9, 0.55, 0.75, 0.6]
H_PENTA = [67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93]  # C-major pentatonic, inside F Lydian
# two-tone notification pairs, all from C D E F G A so they sit on the hook's Dm / Bb pads
H_NOTIFY = [(81, 86), (84, 89), (88, 93), (86, 93), (79, 84), (89, 86),
            (93, 88), (84, 88), (86, 89), (88, 84), (91, 86), (81, 88)]


def _hrng(*key) -> np.random.Generator:
    """A generator seeded from `key` (stable across runs), so each Holly sound is
    repeatable and none of them draws on the shared `rng`."""
    return np.random.default_rng(zlib.crc32(repr(key).encode()))


def _pan(sig: np.ndarray, pan: float) -> np.ndarray:
    a = (pan + 1) * np.pi / 4
    return np.stack([np.cos(a) * sig, np.sin(a) * sig])


def _mixin(out: np.ndarray, t: float, sig: np.ndarray, amp: float = 1.0, pan: float = 0.0):
    """Mix mono (panned) or stereo `sig` into the stereo buffer `out` at t seconds."""
    i = int(round(t * SR))
    if sig.ndim == 1:
        sig = _pan(sig, pan)
    n = min(sig.shape[1], out.shape[1] - i)
    if n > 0:
        out[:, i : i + n] += amp * sig[:, :n]


def _saw(freq, n: int, phase: float = 0.0) -> np.ndarray:
    """Band-limited (PolyBLEP) sawtooth; `freq` in Hz, scalar or one value per sample."""
    dt = np.broadcast_to(np.asarray(freq, dtype=np.float64) / SR, (n,))
    ph = (phase + np.cumsum(dt)) % 1.0
    y = 2.0 * ph - 1.0
    a = ph < dt
    x = ph[a] / dt[a]
    y[a] -= 2 * x - x * x - 1
    b = ph > 1 - dt
    x = (ph[b] - 1) / dt[b]
    y[b] -= x * x + 2 * x + 1
    return y


def _noise_sweep(sec: float, f0: float, f1: float, width: float = 0.8, curve: float = 1.0, seed: int = 0) -> np.ndarray:
    """White noise whose band (Gaussian, `width` octaves) glides from f0 to f1 Hz."""
    n = int(sec * SR)
    x = _hrng("sweep", round(sec, 3), f0, f1, seed).standard_normal(n + 2048)
    f, tf, z = stft(x, SR, nperseg=1024, noverlap=768)
    fc = f0 * (f1 / f0) ** (np.clip(tf / sec, 0, 1) ** curve)
    lf = np.log2(np.maximum(f, 20.0))[:, None]
    mask = np.exp(-0.5 * ((lf - np.log2(fc)[None, :]) / (width / 2)) ** 2)
    _, y = istft(z * mask, SR, nperseg=1024, noverlap=768)
    y = y[:n] / max(float(np.sqrt(np.mean(y[:n] ** 2))), 1e-9)
    return lp(2.5 * np.tanh(y / 2.5), min(15000, 2 * max(f0, f1)), order=4)  # unit RMS, spikes rounded off


def lp_sweep(x: np.ndarray, f0: float, f1: float, curve: np.ndarray) -> np.ndarray:
    """A cheap filter sweep: crossfade `x` low-passed at f0 into `x` low-passed at f1."""
    return (1 - curve) * lp(x, f0) + curve * lp(x, f1)


def warm_pad(notes, sec, cutoff=1800.0, attack=0.5, release=1.0, detune=9.0, sweep=None, seed=0):
    """Soft unison-saw pad: three detuned PolyBLEP saws per note and side with a slow
    pitch drift, low-passed twice for a round top. `sweep=(f_end, power)` opens the
    filter from `cutoff` to f_end across the note (power > 1 opens late)."""
    r = _hrng("pad", tuple(notes), round(sec, 3), seed)
    n = int(sec * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for m in notes:
        for ch in (0, 1):
            for c, g in ((-detune, 0.7), (0.0, 1.0), (detune, 0.7)):
                cents = c + (-2.5 if ch == 0 else 2.5) + r.uniform(-1.5, 1.5)
                drift = 1 + 0.0011 * np.sin(2 * np.pi * r.uniform(0.07, 0.19) * t + r.uniform(0, 2 * np.pi))
                out[ch] += g * _saw(hz(m) * 2 ** (cents / 1200) * drift, n, r.uniform())
    if sweep is None:
        out = lp(lp(out, cutoff), cutoff * 2.2)
    else:
        f_end, power = sweep
        out = lp(lp_sweep(out, cutoff, f_end, (t / sec) ** power), max(cutoff, f_end) * 2.2)
    out *= env_ar(n, attack, release)
    return out / (len(notes) * 2.4)


def vox_pad(notes, sec, attack=1.0, release=1.4, vowel=(800, 1150, 2900), bright=1.0, seed=0):
    """Soft formant 'aah': detuned saws with a late, gentle vibrato and a breath of
    noise, through three band-pass formants (F1, F2, F3) over a low-passed floor of
    the source (so every note's fundamental is heard), like a distant choir."""
    r = _hrng("vox", tuple(notes), round(sec, 3), seed)
    n = int(sec * SR)
    t = np.arange(n) / SR
    src = np.zeros((2, n))
    vib_on = np.clip((t - 0.3) / 1.2, 0, 1)
    for m in notes:
        for ch in (0, 1):
            for c in (-6.0, 6.0):
                vib = 1 + vib_on * 0.004 * np.sin(2 * np.pi * r.uniform(4.6, 5.5) * t + r.uniform(0, 2 * np.pi))
                cents = c + (-3.0 if ch == 0 else 3.0) + r.uniform(-2, 2)
                src[ch] += _saw(hz(m) * 2 ** (cents / 1200) * vib, n, r.uniform())
    src += 0.05 * len(notes) * r.standard_normal((2, n))
    f1, f2, f3 = vowel
    y = (0.3 * lp(src, 700, order=4) + bp(src, f1 * 0.85, f1 * 1.15)
         + 0.55 * bp(src, f2 * 0.88, f2 * 1.12) + 0.22 * bright * bp(src, f3 * 0.92, f3 * 1.08))
    y = lp(y, 5000)
    y *= 0.12 / max(float(np.sqrt(np.mean(y**2))), 1e-9)
    return y * env_ar(n, attack, release)


def bell_fm(m, sec=2.0, decay=1.0, ratio=3.5, index=1.5, idecay=0.25, body=0.35):
    """FM glass bell: a sine carrier phase-modulated at an inharmonic ratio. The index
    falls faster than the tone, so the strike is glassy and the tail turns pure; a
    quieter 1:1 pair underneath adds warmth."""
    n = int(sec * SR)
    t = np.arange(n) / SR
    f = hz(m)
    i_t = index * min(1.0, (1000 / f) ** 0.5) * np.exp(-t / idecay)
    y = np.sin(2 * np.pi * f * t + i_t * np.sin(2 * np.pi * f * ratio * t)) * np.exp(-t / decay)
    y += body * np.sin(2 * np.pi * f * t + 0.6 * i_t * np.sin(2 * np.pi * f * t)) * np.exp(-t / (decay * 0.6))
    y *= env_ar(n, 0.0015, min(0.15, sec / 4))
    return lp(y, min(14000, f * 12)) / (1 + body)


def marimba(m, sec=1.0, decay=None, hard=1.0):
    """Modal marimba: the fundamental plus the bar's ~4th and ~10th partials (each
    damped faster) and a soft mallet knock."""
    n = int(sec * SR)
    t = np.arange(n) / SR
    f = hz(m)
    d = decay or float(np.clip(0.55 * (262 / f) ** 0.7, 0.12, 0.9))
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / d)
    y += 0.28 * hard * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t / (d / 4))
    y += 0.07 * hard * np.sin(2 * np.pi * f * 9.6 * t) * np.exp(-t / (d / 10))
    knock = lp(_hrng("mallet", m).standard_normal(n), 2500) * np.exp(-t / 0.002) * 0.05 * hard
    return (y + knock) * env_ar(n, 0.001, min(0.05, sec / 4))


def soft_kick(f_end=43.65, decay=0.2, click=0.06):
    """Rounded kick: a sine falling from ~160 Hz to its fundamental (F1, the tonic), a
    light beater tap, gently saturated and low-passed so it thumps rather than slaps."""
    t = tt(0.5)
    f = f_end + 100 * np.exp(-t / 0.025) + 18 * np.exp(-t / 0.12)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay)
    tap = lp(_hrng("kick").standard_normal(len(t)), 2200) * np.exp(-t / 0.003) * click
    y = np.tanh(1.4 * (body + tap)) / np.tanh(1.4)
    return lp(y, 4000) * env_ar(len(t), 0.0005, 0.08)


def sub_bass(m, sec, attack=0.015, release=0.1, drive=1.3):
    """Sine sub with light tanh saturation and a touch of octave: the 2nd and 3rd
    harmonics keep it audible on phone speakers, and the steep low-pass removes the
    5th (a major third, which would rub against the minor chords)."""
    t = tt(sec)
    f = hz(m)
    y = np.tanh(drive * np.sin(2 * np.pi * f * t)) / np.tanh(drive)
    y += 0.15 * np.sin(2 * np.pi * 2 * f * t)
    return lp(y, 320, order=4) * env_ar(len(t), attack, min(release, sec / 2))


def shaker(bright=0.5, seed=0):
    """One shaker grain: a high band of noise with a soft 'shh' onset and short tail."""
    t = tt(0.11)
    e = (1 - np.exp(-t / 0.005)) * np.exp(-t / 0.028)
    y = lp(hp(_hrng("shaker", seed).standard_normal(len(t)), 5200, order=3), 8500 + 3500 * bright) * e
    return y * env_ar(len(t), 0.0, 0.02)


def snap(seed=0):
    """Finger snap: a sharp click, a short band of 'crack' noise, a quick skin
    resonance and a few ms of room."""
    r = _hrng("snap", seed)
    t = tt(0.22)
    crack = bp(r.standard_normal(len(t)), 1200, 4800) * np.exp(-t / 0.009)
    click = hp(r.standard_normal(len(t)), 4000) * np.exp(-t / 0.0011) * 0.6
    tone = np.sin(2 * np.pi * 2150 * t) * np.exp(-t / 0.011) * 0.4
    room = lp(hp(r.standard_normal(len(t)), 900), 6000) * np.exp(-t / 0.045) * 0.1
    return lp(crack + click + tone + room, 11000) * env_ar(len(t), 0.0003, 0.03)


def tick_wood(f=1760.0, seed=0):
    """A small muted 'tok' for the hook's clock: two inharmonic modes and a click."""
    t = tt(0.07)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.012) + 0.4 * np.sin(2 * np.pi * f * 2.71 * t) * np.exp(-t / 0.005)
    y += lp(_hrng("tok", seed).standard_normal(len(t)), 6000) * np.exp(-t / 0.0015) * 0.25
    return y * env_ar(len(t), 0.0005, 0.02)


def air_wash(sec=2.0, decay=0.6, lo=5500.0, seed=0):
    """A soft airy wash (a cymbal without the stick) to mark a downbeat."""
    r = _hrng("air", seed)
    t = tt(sec)
    e = (1 - np.exp(-t / 0.06)) * np.exp(-t / decay)
    y = np.stack([lp(hp(r.standard_normal(len(t)), lo, order=3), 10000, order=4) for _ in range(2)]) * e
    return y * env_ar(len(t), 0.0, min(0.3, sec / 3)) * 0.35


def reverse_swell(x: np.ndarray, sec: float, room: float = 2.2) -> np.ndarray:
    """Reverse reverb: the wet tail of `x` played backwards and cropped to `sec`, so
    it sucks up into the moment `x` lands (place it `sec` before x)."""
    if x.ndim == 1:
        x = np.stack([x, x])
    wet = reverb(np.pad(x, ((0, 0), (0, int(room * SR)))), seconds=room, predelay=0.0)
    seg = wet[:, ::-1][:, -int(sec * SR) :]
    return seg * np.linspace(0, 1, seg.shape[1]) ** 2.5 * env_ar(seg.shape[1], 0.0, 0.006)


def add_echo(bus: "Bus", t: float, sig: np.ndarray, amp: float, pan: float = 0.0,
             delay: float = 0.45, fb: float = 0.36, taps: int = 3):
    """Place `sig` plus a few ping-pong repeats, each quieter and darker."""
    bus.add(t, sig, amp, pan=pan)
    for k in range(1, taps + 1):
        sig = lp(sig, 4500)
        bus.add(t + k * delay, sig, amp * fb**k, pan=-0.6 if k % 2 else 0.6)


def sidechain(n: int, hits, release: float = 0.34, attack: float = 0.006) -> np.ndarray:
    """Side-chain style gain curve: at each (time, depth) kick the gain dips by `depth`
    within a few ms, then swells back over `release` (a smoothstep)."""
    g = np.ones(n)
    rn, an = int(release * SR), max(1, int(attack * SR))
    x = np.arange(rn) / rn
    duck = (1 - (3 * x**2 - 2 * x**3)) * np.clip(np.arange(rn) / an, 0, 1)
    for th, depth in hits:
        i = int(round(th * SR))
        j = min(n, i + rn)
        if 0 <= i < j:
            g[i:j] = np.minimum(g[i:j], 1 - depth * duck[: j - i])
    return g


def compose_music_holly() -> np.ndarray:
    """Holly OS (iOS app promo): F major / Lydian at 100 BPM. A filtered, ticking hook
    under the notification pile-up cuts to near silence; a soft bell bloom carries the
    logo; a warm side-chained groove (kick, sub, FM-bell arpeggio) enters on the s03
    cut and builds scene by scene (shaker, then snaps, marimba and an 'aah' pad, then a
    bell top line); the drums drop out for the evening release; a bright Fmaj9(#11)
    blooms on the closing logo and rings out."""
    t03, t04, t05 = scene_t("s03_home"), scene_t("s04_brief"), scene_t("s05_approve")
    t06, t07 = scene_t("s06_grow"), scene_t("s07_calm")
    t_imp = event_t("s02_reveal", "impact")
    t_implode = event_t("s01_hook", "implode") if "implode" in EV["s01_hook"] else t_imp - 1.0  # the ticks run up to it
    t_mark = event_t("s08_end", "mark")
    pings = sorted(event_t("s01_hook", k) for k, e in EV["s01_hook"].items() if e.get("sfx") == "notify")
    checks = [event_t("s07_calm", k) for k, e in EV["s07_calm"].items() if e.get("sfx") == "check"]
    line2 = (SCENES["s01_hook"]["from"] + SCENES["s01_hook"]["cues"][-1]["frame"]) / FPS

    hook = Bus(DUR)  # the intro, in its own short room so the cut before the logo is clean
    pads = Bus(DUR)  # pads and 'aah': side-chained to the kick, long reverb
    low = Bus(DUR)  # sub: side-chained, dry
    bells = Bus(DUR)  # bells and marimba: long reverb
    drums = Bus(DUR)  # kick, shaker, snaps: a touch of room
    air = Bus(DUR)  # swells and washes: long reverb
    hits = []  # (time, depth) for the side-chain

    # ── s01 hook: a restless, filtered pad (Dm(add9), then Bbmaj7 over a C pedal) that
    # opens as the notifications pile up, a low drone, and a clock tick that speeds up
    # with them. It all stops ~0.4 s before the logo, leaving near silence for a short
    # reverse swell; the logo's Fmaj9 then lands as the resolution.
    t_cut = t_imp - 0.42
    t_turn = line2 - 0.2  # the pad turns between the two VO lines
    (dm, dm_root), (sus, sus_root) = H_HOOK
    hook.add(0.0, warm_pad(dm, t_turn + 0.45, cutoff=480, attack=1.2, release=0.45, sweep=(850, 1.0), seed=1), 0.5)
    hook.add(t_turn, warm_pad(sus, t_cut - t_turn, cutoff=800, attack=0.4, release=0.06, sweep=(1900, 1.5), seed=2), 0.6)
    hook.add(0.0, sub_bass(dm_root, t_turn + 0.35, attack=1.5, release=0.4), 0.1)
    hook.add(t_turn, sub_bass(sus_root, t_cut - t_turn, attack=0.35, release=0.06), 0.13)
    t0 = pings[0] if pings else 0.1
    span = max(0.5, t_implode - t0)
    t, k = t0, 0
    while t < t_implode - 0.02:
        x = (t - t0) / span
        hook.add(t, tick_wood(1760.0 if k % 2 == 0 else 1568.0, seed=k), 0.05 + 0.07 * x, pan=-0.3 if k % 2 == 0 else 0.3)
        t += 1 / (2.4 * (10 / 2.4) ** x)  # 2.4 -> 10 ticks a second
        k += 1

    # ── s02 reveal: out of the silence, a short reverse swell, then a soft bell bloom on
    # the logo with a warm Fmaj9 pad, a distant 'aah' and a low F swelling in under it.
    bloom = np.zeros((2, int(4.6 * SR)))
    for j, (m, p) in enumerate(zip([65, 72, 77, 79, 81, 88], [-0.45, 0.35, -0.2, 0.5, -0.5, 0.2])):
        _mixin(bloom, j * 0.03, bell_fm(m, 4.4, decay=1.5, index=1.5, idecay=0.35), 0.5 - 0.03 * j, pan=p)
    air.add(t_cut, reverse_swell(bloom, t_imp - t_cut), 0.35)
    bells.add(t_imp, bloom, 0.45)
    glow = t03 - t_imp
    pads.add(t_imp - 0.05, warm_pad(H_CHORDS["F"][0], glow + 0.45, cutoff=800, attack=1.1, release=0.4, sweep=(2000, 0.6), seed=3), 0.7)
    pads.add(t_imp + 0.2, vox_pad([65, 69, 72, 76], glow + 0.2, attack=1.4, release=0.4, seed=1), 0.45)
    low.add(t_imp, sub_bass(41, glow, attack=0.6, release=0.3), 0.2)
    air.add(t_imp, air_wash(3.0, decay=0.8, seed=1), 0.14)
    pick = np.zeros((2, int(2.5 * SR)))
    for j, m in enumerate([77, 81, 84, 88]):
        _mixin(pick, j * 0.02, bell_fm(m, 2.4, decay=0.9, index=1.2), 0.4, pan=-0.3 + 0.2 * j)
    air.add(t03 - H_BEAT, reverse_swell(pick, H_BEAT), 0.5)  # one beat of suck-up into the groove

    # ── s03–s06: the groove, on a 100 BPM grid that starts exactly on the s03 cut.
    def section(tq):  # 0 = s03 · 1 = s04 · 2 = s05 · 3 = s06
        return int(tq >= t04) + int(tq >= t05) + int(tq >= t06)

    n_bars = int((t07 - t03) // H_BAR)  # whole groove bars before the s07 cut
    t_land = t03 + n_bars * H_BAR  # the bar line just before the s07 cut: the groove's last downbeat
    b06 = int(np.ceil((t06 - t03) / H_BAR - 1e-6))  # first whole bar of s06

    for b in range(n_bars):
        tb = t03 + b * H_BAR
        name = H_CYCLE[b % 4]
        voicing, root, arp = H_CHORDS[name]
        s = section(tb)
        pads.add(tb, warm_pad(voicing, H_BAR + 0.3, cutoff=(1500, 2000, 2600, 3300)[s],
                              attack=0.25 if b == 0 else 0.05, release=0.3, seed=10 + b), 0.8)
        if tb + H_BAR > t05:  # the 'aah' joins on the s05 cut
            st = max(tb, t05)
            pads.add(st, vox_pad(H_VOX[name], tb + H_BAR + 0.3 - st, attack=0.9 if st > tb else 0.15,
                                 release=0.3, bright=1.3 if s == 3 else 1.0, seed=b), 0.4 if s == 3 else 0.3)
        if s == 0:  # sub: a held root in s03, then a syncopated figure (1, 2&, 3, 4& up an octave)
            low.add(tb, sub_bass(root, H_BAR - 0.03, attack=0.02, release=0.1), 0.2)
        else:
            for pos, dur, up in ((0, 2.6, 0), (3, 0.9, 0), (4, 1.8, 0), (7, 0.85, 12)):
                low.add(tb + pos * H_BEAT / 2, sub_bass(root + up, dur * H_BEAT / 2, attack=0.008, release=0.05), 0.13 if up else 0.24)
        for e in range(8):  # FM-bell arpeggio in 8ths; a marimba 3-3-2 (tresillo) figure from s05
            te = tb + e * H_BEAT / 2
            se = section(te)
            bells.add(te, bell_fm(arp[H_ARP[e]] + 12, 1.3, decay=0.45, index=1.1 + 0.25 * se, idecay=0.09),
                      0.34 * H_ACCENT[e] * (0.85 + 0.08 * se), pan=0.35 if e % 2 else -0.35)
            if se >= 2 and e in (0, 3, 6):
                bells.add(te, marimba(arp[(0, 2, 1)[(0, 3, 6).index(e)]], 0.9), 0.3, pan=-0.2)  # root, 5th, 3rd
        if b + 1 == b06:  # a beat of reverse swell into s06, the fullest stretch
            air.add(tb + H_BAR - H_BEAT, reverse_swell(bell_fm(81, 2.0, decay=0.8, index=1.8), H_BEAT), 0.4)
        if b == b06:
            air.add(tb, air_wash(2.4, decay=0.7, seed=3), 0.12)

    kick_amp, depth = (0.45, 0.5, 0.55, 0.6), (0.3, 0.34, 0.38, 0.42)
    for k in range(n_bars * 4 + 1):
        tk = t03 + k * H_BEAT
        s = section(tk)
        if k == n_bars * 4:  # the landing: one last kick on the downbeat, then the drums drop out
            drums.add(tk, soft_kick(), kick_amp[s])
            hits.append((tk, 0.3))
            break
        if s >= 1 or k % 2 == 0:  # s03: kick on 1 and 3; from s04: four on the floor
            drums.add(tk, soft_kick(), kick_amp[s])
            hits.append((tk, depth[s]))
        if s >= 2 and k % 4 in (1, 3):  # snaps on 2 and 4 from s05
            drums.add(tk, snap(seed=k), 0.24 + 0.04 * (s - 2), pan=-0.2)
        for q in range(4):  # shaker 16ths from the s04 cut, accent on the off-beat 8th
            tq = tk + q * H_BEAT / 4
            sq = section(tq)
            if sq >= 1:
                r = _hrng("shake", k, q)
                v = (0.4, 0.2, 0.75, 0.25)[q] * (0.85 + 0.15 * sq) * r.uniform(0.85, 1.1)
                drums.add(tq + r.uniform(-0.003, 0.003), shaker((sq - 1) / 2, seed=4 * k + q), 0.05 * v, pan=0.3)

    # s06 top line: a two-bar bell phrase (over Bb then F) that lands on the last downbeat
    top = [(0, 81, 1.0), (2, 79, 0.8), (3, 77, 0.75), (4, 76, 0.9), (6, 77, 0.7), (7, 79, 0.75),
           (8, 81, 1.0), (10, 84, 0.85), (11, 81, 0.7), (12, 79, 0.9), (14, 76, 0.7), (15, 79, 0.75)]
    for pos, m, v in top:
        te = t03 + b06 * H_BAR + pos * H_BEAT / 2
        if te < t_land - 0.01:
            add_echo(bells, te, bell_fm(m, 2.0, decay=0.8, index=1.8, idecay=0.15), 0.3 * v, pan=0.1)

    # ── s07: the drums drop out. A warm Am7 then Bbmaj7(#11) (its filter opening into the
    # close), the sub held, and a few echoing bell notes kept clear of the check ticks.
    t_turn2 = t_land + H_BAR
    pads.add(t_land, warm_pad(H_CHORDS["Am"][0], t_turn2 - t_land + 0.5, cutoff=1150, attack=0.35, release=0.5, seed=40), 0.85)
    pads.add(t_turn2, warm_pad(H_CHORDS["Bb"][0], t_mark - t_turn2 + 0.25, cutoff=1000, attack=0.5, release=0.2,
                               sweep=(3000, 2.5), seed=41), 0.85)
    pads.add(t_land + 0.3, vox_pad([69, 72, 76], t_turn2 - t_land + 0.1, attack=1.2, release=0.4, seed=40), 0.25)
    pads.add(t_turn2 - 0.2, vox_pad([65, 70, 74], t_mark - t_turn2 + 0.4, attack=0.6, release=0.3, seed=41), 0.25)
    low.add(t_land, sub_bass(33, t_turn2 - t_land, attack=0.01, release=0.3), 0.16)
    low.add(t_turn2, sub_bass(34, t_mark - t_turn2, attack=0.3, release=0.05), 0.15)
    calm = [(0, 81, 1.0), (1.5, 76, 0.5), (2.5, 84, 0.45), (4.5, 74, 0.55), (5.5, 77, 0.5), (7, 81, 0.5)]  # A E C | D F A
    for beat, m, v in calm:
        te = t_land + beat * H_BEAT
        if te < t_mark - 0.3 and all(abs(te - c) > 0.2 for c in checks):
            add_echo(bells, te, bell_fm(m, 2.4, decay=1.0, index=1.2, idecay=0.2), 0.32 * v, pan=-0.1)

    # ── s08: a swell into the closing logo, a bright Fmaj9(#11) with a bell cascade down
    # through it, a soft bell pulse under the tagline that thins out, then the ring-out.
    casc = np.zeros((2, int(4.0 * SR)))
    for j, m in enumerate([95, 91, 88, 84, 81, 79, 76, 72]):  # B6 G6 E6 C6 A5 G5 E5 C5
        _mixin(casc, j * H_BEAT / 4, bell_fm(m, 2.6, decay=1.0, index=1.6, idecay=0.2), 0.3 * (1 - 0.05 * j), pan=0.55 - 0.16 * j)
    air.add(t_mark - 1.2, reverse_swell(casc, 1.2), 0.45)
    bells.add(t_mark, casc, 1.0)
    tail = DUR - t_mark
    pads.add(t_mark, warm_pad(H_FLYD, tail + 0.3, cutoff=2800, attack=0.1, release=3.2, seed=50), 1.3)
    pads.add(t_mark, vox_pad([65, 69, 72, 76, 79], tail + 0.3, attack=0.4, release=3.2, bright=1.3, seed=50), 0.45)
    low.add(t_mark, sub_bass(41, tail - 0.5, attack=0.02, release=2.8), 0.2)
    air.add(t_mark, air_wash(4.5, decay=1.3, seed=2), 0.18)
    t_pulse, t_stop = t_mark + 2 * H_BEAT, DUR - 3.2
    for j in range(int((t_stop - t_pulse) / (H_BEAT / 2))):
        te = t_pulse + j * H_BEAT / 2
        fade = 1 - (te - t_pulse) / (t_stop - t_pulse)
        bells.add(te, bell_fm([77, 81, 84, 88, 91, 88, 84, 81][j % 8], 1.6, decay=0.6, index=1.0, idecay=0.1),
                  0.16 * fade**1.3 * H_ACCENT[j % 8], pan=0.35 if j % 2 else -0.35)

    sc = sidechain(pads.x.shape[1], hits)
    body, lows = pads.x * sc, low.x * sc
    x = hook.x + 0.25 * reverb(hook.x, seconds=1.2, damp=4000)
    i0, i1 = int(t_cut * SR), int((t_cut + 0.1) * SR)  # the cut takes the hook's room with it
    x[:, i0:i1] *= np.cos(np.linspace(0, np.pi / 2, i1 - i0)) ** 2
    x[:, i1:] = 0.0
    x = x + body + lows + bells.x + drums.x + air.x
    x = x + 0.32 * reverb(0.55 * body + bells.x + 0.7 * air.x + 0.1 * drums.x, seconds=2.8, damp=5200)
    x = hp(x[:, :N], 22)  # clear DC and infrasonics
    fade = int(1.5 * SR)
    x[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    return x


# ── See (WorkOnward Foundation launch film): C# minor in the dark act, E major after the reveal ──────

S_BPM = 100
S_BEAT = 60 / S_BPM  # 0.6 s
S_BAR = 4 * S_BEAT  # 2.4 s
# chord: (pad voicing, sub-bass root, arpeggio tones; the bells play these an octave up)
S_CHORDS = {
    "E": ([52, 56, 59, 63, 66], 40, [64, 68, 71, 75, 78]),  # Emaj9      E3 G#3 B3 D#4 F#4 / E2
    "C#m": ([49, 52, 56, 59, 63], 37, [61, 64, 68, 71, 75]),  # C#m9     C#3 E3 G#3 B3 D#4 / C#2
    "A": ([45, 52, 56, 59, 61], 33, [57, 61, 64, 68, 71]),  # Amaj9      A2 E3 G#3 B3 C#4 / A1
    "B": ([47, 54, 57, 61, 64], 35, [59, 63, 66, 69, 71]),  # B9sus      B2 F#3 A3 C#4 E4 / B1
}
S_CYCLE = ["E", "C#m", "A", "B"]
S_VOX = {"E": [64, 68, 71, 75], "C#m": [61, 64, 68, 71], "A": [61, 64, 68, 69], "B": [63, 66, 69, 71]}
S_DARK = [  # the problem: C#m(add9) -> A(add9) -> F#m11 -> B sus pedal (wants the E of the reveal)
    ([49, 56, 61, 63, 64], 37),
    ([45, 52, 57, 59, 64], 33),
    ([42, 49, 54, 57, 64], 30),
    ([47, 54, 59, 61, 64], 35),
]
S_FLYD = [52, 59, 64, 68, 70, 75]  # Emaj7(#11) for the close (E3 B3 E4 G#4 A#4 D#5)


def compose_music_see() -> np.ndarray:
    """See (WorkOnward Foundation): a restless C# minor hook under the problem (filtered pads, a low drone,
    a wood-tick clock that speeds up with the numbers) that thins to a heartbeat on "backwards", tightens
    under the bar race and cuts to silence; out of it, a reverse swell and an E-major bell bloom on the
    reveal; an I-vi-IV-V groove for the app (kick, shaker, snaps, bell arpeggio) that builds scene by
    scene; a stop on the falling "paywall"; and a bright Emaj7(#11) bloom on the end card."""
    t02, t03, t04 = scene_t("s02_noise"), scene_t("s03_paywall"), scene_t("s04_insight")
    t06, t07, t08, t09, t10 = (scene_t(k) for k in ("s06_talk", "s07_referral", "s08_trust", "s09_simple", "s10_end"))
    t_imp = event_t("s05_reveal", "impact")
    t_cut = t_imp - 0.6
    t_back = next((sc["from"] + c["endFrame"]) / FPS for sc in TL["scenes"] for c in sc["cues"] if "backwards" in c["text"])
    t_drop = event_t("s10_end", "drop")
    t_mark = event_t("s10_end", "mark")

    hook, pads, low, bells, drums, air = (Bus(DUR) for _ in range(6))
    hits = []

    # ── s01-s04: the problem. Four dark chords, one per scene, each filter opening as it goes.
    bounds = [0.0, t02, t03, t04, t_cut]
    for k, ((voicing, root), a, b) in enumerate(zip(S_DARK, bounds[:-1], bounds[1:])):
        if k == 3:
            break
        hook.add(a, warm_pad(voicing, b - a + 0.5, cutoff=420 + 120 * k, attack=0.9 if k == 0 else 0.25, release=0.5,
                             sweep=(900 + 300 * k, 1.2), seed=60 + k), 0.5)
        hook.add(a, sub_bass(root, b - a + 0.3, attack=1.0 if k == 0 else 0.2, release=0.4), 0.11)
    # the clock: ticks from the first tap, speeding up (2.4 -> 9 a second) until "backwards", then gone
    t0 = event_t("s01_hook", "tap1")
    span = max(0.5, t_back - t0)
    t, k = t0, 0
    while t < t_back - 0.05:
        x = (t - t0) / span
        hook.add(t, tick_wood(1661.2 if k % 2 == 0 else 1479.98, seed=k), 0.045 + 0.06 * x, pan=-0.3 if k % 2 == 0 else 0.3)
        t += 1 / (2.4 * (9 / 2.4) ** x)
        k += 1
    # "Which is backwards": the room empties to a low drone and a heartbeat; then a B pedal tightens
    # under the bars, opening its filter until the cut.
    voicing, root = S_DARK[3]
    hook.add(t_back, sub_bass(root, t_cut - t_back, attack=0.6, release=0.05), 0.12)
    hook.add(t_back + 0.4, warm_pad(voicing, t_cut - t_back - 0.4, cutoff=380, attack=1.4, release=0.05, sweep=(2600, 2.2), seed=64), 0.55)
    beat = t_back + 0.3
    while beat < t_cut - 0.3:  # lub-dub at 60 BPM
        hook.add(beat, soft_kick(f_end=34.65, decay=0.16, click=0.02), 0.32)
        hook.add(beat + 0.22, soft_kick(f_end=34.65, decay=0.12, click=0.01), 0.18)
        beat += 1.0

    # ── s05: out of the silence, a reverse swell into an E-major bell bloom on the reveal.
    bloom = np.zeros((2, int(4.6 * SR)))
    for j, (m, pn) in enumerate(zip([64, 71, 76, 78, 80, 87], [-0.45, 0.35, -0.2, 0.5, -0.5, 0.2])):
        _mixin(bloom, j * 0.03, bell_fm(m, 4.4, decay=1.5, index=1.5, idecay=0.35), 0.5 - 0.03 * j, pan=pn)
    air.add(t_cut, reverse_swell(bloom, t_imp - t_cut), 0.38)
    bells.add(t_imp, bloom, 0.45)
    glow = t06 - t_imp
    pads.add(t_imp - 0.05, warm_pad(S_CHORDS["E"][0], glow + 0.45, cutoff=800, attack=1.0, release=0.4, sweep=(2100, 0.6), seed=70), 0.7)
    pads.add(t_imp + 0.2, vox_pad(S_VOX["E"], glow + 0.2, attack=1.3, release=0.4, seed=70), 0.42)
    low.add(t_imp, sub_bass(40, glow, attack=0.5, release=0.3), 0.2)
    low.add(t_imp, impact(0.8)[: int(2.0 * SR)] * 0.5, 0.35)
    air.add(t_imp, air_wash(3.0, decay=0.8, seed=11), 0.15)
    pick = np.zeros((2, int(2.5 * SR)))
    for j, m in enumerate([76, 80, 83, 87]):
        _mixin(pick, j * 0.02, bell_fm(m, 2.4, decay=0.9, index=1.2), 0.4, pan=-0.3 + 0.2 * j)
    air.add(t06 - S_BEAT, reverse_swell(pick, S_BEAT), 0.5)

    # ── s06-s09: the groove, on a 100 BPM grid from the s06 cut; it stops for the falling word.
    def section(tq):  # 0 = s06 · 1 = s07 · 2 = s08 · 3 = s09
        return int(tq >= t07) + int(tq >= t08) + int(tq >= t09)

    n_bars = int((t10 - t06) // S_BAR) + 1
    t_stop = t_drop  # the groove ends where "paywall" falls
    for b in range(n_bars):
        tb = t06 + b * S_BAR
        if tb >= t_stop:
            break
        name = S_CYCLE[b % 4]
        voicing, root, arp = S_CHORDS[name]
        sec = section(tb)
        bar_len = min(S_BAR, t_stop - tb)
        pads.add(tb, warm_pad(voicing, bar_len + 0.3, cutoff=(1500, 2000, 2600, 3200)[sec], attack=0.25 if b == 0 else 0.05, release=0.3, seed=80 + b), 0.8)
        if sec >= 2:
            pads.add(tb, vox_pad(S_VOX[name], bar_len + 0.3, attack=0.2, release=0.3, bright=1.2 if sec == 3 else 1.0, seed=b), 0.32)
        if sec == 0:
            low.add(tb, sub_bass(root, bar_len - 0.03, attack=0.02, release=0.1), 0.2)
        else:
            for pos, dur, up in ((0, 2.6, 0), (3, 0.9, 0), (4, 1.8, 0), (7, 0.85, 12)):
                tn = tb + pos * S_BEAT / 2
                if tn < t_stop - 0.05:
                    low.add(tn, sub_bass(root + up, dur * S_BEAT / 2, attack=0.008, release=0.05), 0.13 if up else 0.24)
        for e in range(8):
            te = tb + e * S_BEAT / 2
            if te >= t_stop - 0.02:
                break
            se = section(te)
            bells.add(te, bell_fm(arp[H_ARP[e]] + 12, 1.3, decay=0.45, index=1.1 + 0.25 * se, idecay=0.09),
                      0.32 * H_ACCENT[e] * (0.85 + 0.08 * se), pan=0.35 if e % 2 else -0.35)
            if se >= 2 and e in (0, 3, 6):
                bells.add(te, marimba(arp[(0, 2, 1)[(0, 3, 6).index(e)]], 0.9), 0.28, pan=-0.2)
    kick_amp, depth = (0.42, 0.5, 0.55, 0.6), (0.28, 0.34, 0.38, 0.42)
    k = 0
    while True:
        tk = t06 + k * S_BEAT
        if tk >= t_stop - 0.02:
            break
        sec = section(tk)
        if sec >= 1 or k % 2 == 0:
            drums.add(tk, soft_kick(f_end=41.2), kick_amp[sec])
            hits.append((tk, depth[sec]))
        if sec >= 1 and k % 4 in (1, 3):
            drums.add(tk, snap(seed=k), 0.22 + 0.03 * sec, pan=-0.2)
        for q in range(4):
            tq = tk + q * S_BEAT / 4
            if tq >= t_stop - 0.02:
                break
            sq = section(tq)
            r = _hrng("see-shake", k, q)
            v = (0.4, 0.2, 0.75, 0.25)[q] * (0.85 + 0.15 * sq) * r.uniform(0.85, 1.1)
            drums.add(tq + r.uniform(-0.003, 0.003), shaker(sq / 3, seed=4 * k + q), 0.05 * v, pan=0.3)
        k += 1
    # a two-bar bell top line through s09
    b09 = int(np.ceil((t09 - t06) / S_BAR - 1e-6))
    top = [(0, 80, 1.0), (2, 78, 0.8), (3, 76, 0.75), (4, 75, 0.9), (6, 76, 0.7), (7, 78, 0.75),
           (8, 80, 1.0), (10, 83, 0.85), (11, 80, 0.7), (12, 78, 0.9), (14, 75, 0.7), (15, 78, 0.75)]
    for pos, m, v in top:
        te = t06 + b09 * S_BAR + pos * S_BEAT / 2
        if te < t_stop - 0.05:
            add_echo(bells, te, bell_fm(m, 2.0, decay=0.8, index=1.8, idecay=0.15), 0.28 * v, pan=0.1)

    # ── s10: the drums stop as "paywall" falls (a held B pad under it), then the end-card bloom.
    pads.add(t_stop, warm_pad(S_CHORDS["B"][0], t_mark - t_stop + 0.3, cutoff=900, attack=0.05, release=0.2, sweep=(2800, 2.0), seed=90), 0.75)
    low.add(t_stop, sub_bass(35, t_mark - t_stop, attack=0.01, release=0.05), 0.16)
    casc = np.zeros((2, int(4.0 * SR)))
    for j, m in enumerate([94, 90, 87, 83, 80, 78, 75, 71]):  # A#6 F#6 D#6 B5 G#5 F#5 D#5 B4
        _mixin(casc, j * S_BEAT / 4, bell_fm(m, 2.6, decay=1.0, index=1.6, idecay=0.2), 0.3 * (1 - 0.05 * j), pan=0.55 - 0.16 * j)
    air.add(t_mark - 1.0, reverse_swell(casc, 1.0), 0.45)
    bells.add(t_mark, casc, 1.0)
    tail = DUR - t_mark
    pads.add(t_mark, warm_pad(S_FLYD, tail + 0.3, cutoff=2800, attack=0.1, release=3.0, seed=91), 1.25)
    pads.add(t_mark, vox_pad([64, 68, 71, 75, 78], tail + 0.3, attack=0.4, release=3.0, bright=1.3, seed=91), 0.42)
    low.add(t_mark, sub_bass(40, tail - 0.4, attack=0.02, release=2.6), 0.2)
    air.add(t_mark, air_wash(4.5, decay=1.3, seed=12), 0.18)

    sc = sidechain(pads.x.shape[1], hits)
    body, lows = pads.x * sc, low.x * sc
    x = 1.6 * (hook.x + 0.25 * reverb(hook.x, seconds=1.2, damp=4000))  # the sparse dark act, lifted ~4 dB
    i0, i1 = int(t_cut * SR), int((t_cut + 0.1) * SR)  # the cut takes the hook's room with it
    x[:, i0:i1] *= np.cos(np.linspace(0, np.pi / 2, i1 - i0)) ** 2
    x[:, i1:] = 0.0
    x = x + body + lows + bells.x + drums.x + air.x
    x = x + 0.3 * reverb(0.55 * body + bells.x + 0.7 * air.x + 0.1 * drums.x, seconds=2.8, damp=5200)
    x = hp(x[:, :N], 22)
    fade = int(1.2 * SR)
    x[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    return x



def compose_music_see_white() -> np.ndarray:
    """See, 90 s white edition: the same palette and arc as compose_music_see, mapped onto its own scenes.
    The C# minor hook (pads one per problem beat, a wood-tick clock that speeds up) runs under the hook,
    recruiters, ghost jobs and toll booths; it thins to a heartbeat on "backwards", tightens under the
    five tools and cuts to silence as they're pulled into the orb; an E-major bloom on the reveal; the
    groove builds at the tracker, the trust beat and the feature grid; a stop on the falling "paywall"
    and the end-card bloom."""
    t02, t03, t04 = scene_t("w02_recruiters"), scene_t("w04_paywall"), scene_t("w05_insight")
    t06, t07, t08, t09, t10 = (scene_t(k) for k in ("w08_talk", "w10_track", "w13_trust", "w15_bento", "w16_end"))
    t_imp = event_t("w07_reveal", "impact")
    t_cut = t_imp - 0.6
    t_back = next((sc["from"] + c["endFrame"]) / FPS for sc in TL["scenes"] for c in sc["cues"] if "backwards" in c["text"])
    t_drop = event_t("w16_end", "drop")
    t_mark = event_t("w16_end", "mark")

    hook, pads, low, bells, drums, air = (Bus(DUR) for _ in range(6))
    hits = []

    # ── s01-s04: the problem. Four dark chords, one per scene, each filter opening as it goes.
    bounds = [0.0, t02, t03, t04, t_cut]
    for k, ((voicing, root), a, b) in enumerate(zip(S_DARK, bounds[:-1], bounds[1:])):
        if k == 3:
            break
        hook.add(a, warm_pad(voicing, b - a + 0.5, cutoff=420 + 120 * k, attack=0.9 if k == 0 else 0.25, release=0.5,
                             sweep=(900 + 300 * k, 1.2), seed=60 + k), 0.5)
        hook.add(a, sub_bass(root, b - a + 0.3, attack=1.0 if k == 0 else 0.2, release=0.4), 0.11)
    # the clock: ticks from the first tap, speeding up (2.4 -> 9 a second) until "backwards", then gone
    t0 = event_t("w01_hook", "logo")
    span = max(0.5, t_back - t0)
    t, k = t0, 0
    while t < t_back - 0.05:
        x = (t - t0) / span
        hook.add(t, tick_wood(1661.2 if k % 2 == 0 else 1479.98, seed=k), 0.045 + 0.06 * x, pan=-0.3 if k % 2 == 0 else 0.3)
        t += 1 / (2.4 * (9 / 2.4) ** x)
        k += 1
    # "Which is backwards": the room empties to a low drone and a heartbeat; then a B pedal tightens
    # under the bars, opening its filter until the cut.
    voicing, root = S_DARK[3]
    hook.add(t_back, sub_bass(root, t_cut - t_back, attack=0.6, release=0.05), 0.12)
    hook.add(t_back + 0.4, warm_pad(voicing, t_cut - t_back - 0.4, cutoff=380, attack=1.4, release=0.05, sweep=(2600, 2.2), seed=64), 0.55)
    beat = t_back + 0.3
    while beat < t_cut - 0.3:  # lub-dub at 60 BPM
        hook.add(beat, soft_kick(f_end=34.65, decay=0.16, click=0.02), 0.32)
        hook.add(beat + 0.22, soft_kick(f_end=34.65, decay=0.12, click=0.01), 0.18)
        beat += 1.0

    # ── s05: out of the silence, a reverse swell into an E-major bell bloom on the reveal.
    bloom = np.zeros((2, int(4.6 * SR)))
    for j, (m, pn) in enumerate(zip([64, 71, 76, 78, 80, 87], [-0.45, 0.35, -0.2, 0.5, -0.5, 0.2])):
        _mixin(bloom, j * 0.03, bell_fm(m, 4.4, decay=1.5, index=1.5, idecay=0.35), 0.5 - 0.03 * j, pan=pn)
    air.add(t_cut, reverse_swell(bloom, t_imp - t_cut), 0.38)
    bells.add(t_imp, bloom, 0.45)
    glow = t06 - t_imp
    pads.add(t_imp - 0.05, warm_pad(S_CHORDS["E"][0], glow + 0.45, cutoff=800, attack=1.0, release=0.4, sweep=(2100, 0.6), seed=70), 0.7)
    pads.add(t_imp + 0.2, vox_pad(S_VOX["E"], glow + 0.2, attack=1.3, release=0.4, seed=70), 0.42)
    low.add(t_imp, sub_bass(40, glow, attack=0.5, release=0.3), 0.2)
    low.add(t_imp, impact(0.8)[: int(2.0 * SR)] * 0.5, 0.35)
    air.add(t_imp, air_wash(3.0, decay=0.8, seed=11), 0.15)
    pick = np.zeros((2, int(2.5 * SR)))
    for j, m in enumerate([76, 80, 83, 87]):
        _mixin(pick, j * 0.02, bell_fm(m, 2.4, decay=0.9, index=1.2), 0.4, pan=-0.3 + 0.2 * j)
    air.add(t06 - S_BEAT, reverse_swell(pick, S_BEAT), 0.5)

    # ── s06-s09: the groove, on a 100 BPM grid from the s06 cut; it stops for the falling word.
    def section(tq):  # 0 = s06 · 1 = s07 · 2 = s08 · 3 = s09
        return int(tq >= t07) + int(tq >= t08) + int(tq >= t09)

    n_bars = int((t10 - t06) // S_BAR) + 1
    t_stop = t_drop  # the groove ends where "paywall" falls
    for b in range(n_bars):
        tb = t06 + b * S_BAR
        if tb >= t_stop:
            break
        name = S_CYCLE[b % 4]
        voicing, root, arp = S_CHORDS[name]
        sec = section(tb)
        bar_len = min(S_BAR, t_stop - tb)
        pads.add(tb, warm_pad(voicing, bar_len + 0.3, cutoff=(1500, 2000, 2600, 3200)[sec], attack=0.25 if b == 0 else 0.05, release=0.3, seed=80 + b), 0.8)
        if sec >= 2:
            pads.add(tb, vox_pad(S_VOX[name], bar_len + 0.3, attack=0.2, release=0.3, bright=1.2 if sec == 3 else 1.0, seed=b), 0.32)
        if sec == 0:
            low.add(tb, sub_bass(root, bar_len - 0.03, attack=0.02, release=0.1), 0.2)
        else:
            for pos, dur, up in ((0, 2.6, 0), (3, 0.9, 0), (4, 1.8, 0), (7, 0.85, 12)):
                tn = tb + pos * S_BEAT / 2
                if tn < t_stop - 0.05:
                    low.add(tn, sub_bass(root + up, dur * S_BEAT / 2, attack=0.008, release=0.05), 0.13 if up else 0.24)
        for e in range(8):
            te = tb + e * S_BEAT / 2
            if te >= t_stop - 0.02:
                break
            se = section(te)
            bells.add(te, bell_fm(arp[H_ARP[e]] + 12, 1.3, decay=0.45, index=1.1 + 0.25 * se, idecay=0.09),
                      0.32 * H_ACCENT[e] * (0.85 + 0.08 * se), pan=0.35 if e % 2 else -0.35)
            if se >= 2 and e in (0, 3, 6):
                bells.add(te, marimba(arp[(0, 2, 1)[(0, 3, 6).index(e)]], 0.9), 0.28, pan=-0.2)
    kick_amp, depth = (0.42, 0.5, 0.55, 0.6), (0.28, 0.34, 0.38, 0.42)
    k = 0
    while True:
        tk = t06 + k * S_BEAT
        if tk >= t_stop - 0.02:
            break
        sec = section(tk)
        if sec >= 1 or k % 2 == 0:
            drums.add(tk, soft_kick(f_end=41.2), kick_amp[sec])
            hits.append((tk, depth[sec]))
        if sec >= 1 and k % 4 in (1, 3):
            drums.add(tk, snap(seed=k), 0.22 + 0.03 * sec, pan=-0.2)
        for q in range(4):
            tq = tk + q * S_BEAT / 4
            if tq >= t_stop - 0.02:
                break
            sq = section(tq)
            r = _hrng("see-white-shake", k, q)
            v = (0.4, 0.2, 0.75, 0.25)[q] * (0.85 + 0.15 * sq) * r.uniform(0.85, 1.1)
            drums.add(tq + r.uniform(-0.003, 0.003), shaker(sq / 3, seed=4 * k + q), 0.05 * v, pan=0.3)
        k += 1
    # a two-bar bell top line through s09
    b09 = int(np.ceil((t09 - t06) / S_BAR - 1e-6))
    top = [(0, 80, 1.0), (2, 78, 0.8), (3, 76, 0.75), (4, 75, 0.9), (6, 76, 0.7), (7, 78, 0.75),
           (8, 80, 1.0), (10, 83, 0.85), (11, 80, 0.7), (12, 78, 0.9), (14, 75, 0.7), (15, 78, 0.75)]
    for pos, m, v in top:
        te = t06 + b09 * S_BAR + pos * S_BEAT / 2
        if te < t_stop - 0.05:
            add_echo(bells, te, bell_fm(m, 2.0, decay=0.8, index=1.8, idecay=0.15), 0.28 * v, pan=0.1)

    # ── s10: the drums stop as "paywall" falls (a held B pad under it), then the end-card bloom.
    pads.add(t_stop, warm_pad(S_CHORDS["B"][0], t_mark - t_stop + 0.3, cutoff=900, attack=0.05, release=0.2, sweep=(2800, 2.0), seed=90), 0.75)
    low.add(t_stop, sub_bass(35, t_mark - t_stop, attack=0.01, release=0.05), 0.16)
    casc = np.zeros((2, int(4.0 * SR)))
    for j, m in enumerate([94, 90, 87, 83, 80, 78, 75, 71]):  # A#6 F#6 D#6 B5 G#5 F#5 D#5 B4
        _mixin(casc, j * S_BEAT / 4, bell_fm(m, 2.6, decay=1.0, index=1.6, idecay=0.2), 0.3 * (1 - 0.05 * j), pan=0.55 - 0.16 * j)
    air.add(t_mark - 1.0, reverse_swell(casc, 1.0), 0.45)
    bells.add(t_mark, casc, 1.0)
    tail = DUR - t_mark
    pads.add(t_mark, warm_pad(S_FLYD, tail + 0.3, cutoff=2800, attack=0.1, release=3.0, seed=91), 1.25)
    pads.add(t_mark, vox_pad([64, 68, 71, 75, 78], tail + 0.3, attack=0.4, release=3.0, bright=1.3, seed=91), 0.42)
    low.add(t_mark, sub_bass(40, tail - 0.4, attack=0.02, release=2.6), 0.2)
    air.add(t_mark, air_wash(4.5, decay=1.3, seed=12), 0.18)

    sc = sidechain(pads.x.shape[1], hits)
    body, lows = pads.x * sc, low.x * sc
    x = 1.6 * (hook.x + 0.25 * reverb(hook.x, seconds=1.2, damp=4000))  # the sparse dark act, lifted ~4 dB
    i0, i1 = int(t_cut * SR), int((t_cut + 0.1) * SR)  # the cut takes the hook's room with it
    x[:, i0:i1] *= np.cos(np.linspace(0, np.pi / 2, i1 - i0)) ** 2
    x[:, i1:] = 0.0
    x = x + body + lows + bells.x + drums.x + air.x
    x = x + 0.3 * reverb(0.55 * body + bells.x + 0.7 * air.x + 0.1 * drums.x, seconds=2.8, damp=5200)
    x = hp(x[:, :N], 22)
    fade = int(1.2 * SR)
    x[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    return x



def compose_music_see_pitch() -> np.ndarray:
    """See, 120 s investor pitch: the See palette carrying a story. C# minor under the story and both
    sides of the problem, a warmer A(add9) under "We know what works", then the B pedal and heartbeat from
    "And it's getting worse" to the cut; the E-major bloom on the reveal; a groove that builds through how
    it works, the payoff, competition, market and go-to-market; it stops for the close, and the end-card
    bloom lands on the WorkOnward Foundation logo."""
    t02, t03, t04 = scene_t("p02_seekers"), scene_t("p03_employers"), scene_t("p04_insight")
    t06, t07, t08, t09, t10 = (scene_t(k) for k in ("p07_how", "p09_compete", "p10_market", "p11_gtm", "p13_close"))
    t_imp = event_t("p06_reveal", "impact")
    t_cut = t_imp - 0.6
    t_back = next((sc["from"] + c["endFrame"]) / FPS for sc in TL["scenes"] for c in sc["cues"] if "getting worse" in c["text"])
    t_drop = event_t("p13_close", "drop")
    t_mark = event_t("p13_close", "logo")

    hook, pads, low, bells, drums, air = (Bus(DUR) for _ in range(6))
    hits = []

    # ── s01-s04: the problem. Four dark chords, one per scene, each filter opening as it goes.
    t05 = scene_t("p05_whynow")
    hope = ([45, 52, 57, 59, 64], 33)  # A(add9): "We know what works"
    bounds = [0.0, t02, t03, t04, t05]
    for k, ((voicing, root), a, b) in enumerate(zip(S_DARK[:3] + [hope], bounds[:-1], bounds[1:])):
        hook.add(a, warm_pad(voicing, b - a + 0.5, cutoff=420 + 120 * k, attack=0.9 if k == 0 else 0.25, release=0.5,
                             sweep=(900 + 300 * k, 1.2), seed=60 + k), 0.5)
        hook.add(a, sub_bass(root, b - a + 0.3, attack=1.0 if k == 0 else 0.2, release=0.4), 0.11)
    # the clock: ticks from the first tap, speeding up (2.4 -> 9 a second) until "backwards", then gone
    t0 = event_t("p01_story", "grad")
    span = max(0.5, t_back - t0)
    t, k = t0, 0
    while t < t_back - 0.05:
        x = (t - t0) / span
        hook.add(t, tick_wood(1661.2 if k % 2 == 0 else 1479.98, seed=k), 0.045 + 0.06 * x, pan=-0.3 if k % 2 == 0 else 0.3)
        t += 1 / (2.4 * (9 / 2.4) ** x)
        k += 1
    # "Which is backwards": the room empties to a low drone and a heartbeat; then a B pedal tightens
    # under the bars, opening its filter until the cut.
    voicing, root = S_DARK[3]
    hook.add(t_back, sub_bass(root, t_cut - t_back, attack=0.6, release=0.05), 0.12)
    hook.add(t_back + 0.4, warm_pad(voicing, t_cut - t_back - 0.4, cutoff=380, attack=1.4, release=0.05, sweep=(2600, 2.2), seed=64), 0.55)
    beat = t_back + 0.3
    while beat < t_cut - 0.3:  # lub-dub at 60 BPM
        hook.add(beat, soft_kick(f_end=34.65, decay=0.16, click=0.02), 0.32)
        hook.add(beat + 0.22, soft_kick(f_end=34.65, decay=0.12, click=0.01), 0.18)
        beat += 1.0

    # ── s05: out of the silence, a reverse swell into an E-major bell bloom on the reveal.
    bloom = np.zeros((2, int(4.6 * SR)))
    for j, (m, pn) in enumerate(zip([64, 71, 76, 78, 80, 87], [-0.45, 0.35, -0.2, 0.5, -0.5, 0.2])):
        _mixin(bloom, j * 0.03, bell_fm(m, 4.4, decay=1.5, index=1.5, idecay=0.35), 0.5 - 0.03 * j, pan=pn)
    air.add(t_cut, reverse_swell(bloom, t_imp - t_cut), 0.38)
    bells.add(t_imp, bloom, 0.45)
    glow = t06 - t_imp
    pads.add(t_imp - 0.05, warm_pad(S_CHORDS["E"][0], glow + 0.45, cutoff=800, attack=1.0, release=0.4, sweep=(2100, 0.6), seed=70), 0.7)
    pads.add(t_imp + 0.2, vox_pad(S_VOX["E"], glow + 0.2, attack=1.3, release=0.4, seed=70), 0.42)
    low.add(t_imp, sub_bass(40, glow, attack=0.5, release=0.3), 0.2)
    low.add(t_imp, impact(0.8)[: int(2.0 * SR)] * 0.5, 0.35)
    air.add(t_imp, air_wash(3.0, decay=0.8, seed=11), 0.15)
    pick = np.zeros((2, int(2.5 * SR)))
    for j, m in enumerate([76, 80, 83, 87]):
        _mixin(pick, j * 0.02, bell_fm(m, 2.4, decay=0.9, index=1.2), 0.4, pan=-0.3 + 0.2 * j)
    air.add(t06 - S_BEAT, reverse_swell(pick, S_BEAT), 0.5)

    # ── s06-s09: the groove, on a 100 BPM grid from the s06 cut; it stops for the falling word.
    def section(tq):  # 0 = s06 · 1 = s07 · 2 = s08 · 3 = s09
        return int(tq >= t07) + int(tq >= t08) + int(tq >= t09)

    n_bars = int((t10 - t06) // S_BAR) + 1
    t_stop = t_drop  # the groove ends where "paywall" falls
    for b in range(n_bars):
        tb = t06 + b * S_BAR
        if tb >= t_stop:
            break
        name = S_CYCLE[b % 4]
        voicing, root, arp = S_CHORDS[name]
        sec = section(tb)
        bar_len = min(S_BAR, t_stop - tb)
        pads.add(tb, warm_pad(voicing, bar_len + 0.3, cutoff=(1500, 2000, 2600, 3200)[sec], attack=0.25 if b == 0 else 0.05, release=0.3, seed=80 + b), 0.8)
        if sec >= 2:
            pads.add(tb, vox_pad(S_VOX[name], bar_len + 0.3, attack=0.2, release=0.3, bright=1.2 if sec == 3 else 1.0, seed=b), 0.32)
        if sec == 0:
            low.add(tb, sub_bass(root, bar_len - 0.03, attack=0.02, release=0.1), 0.2)
        else:
            for pos, dur, up in ((0, 2.6, 0), (3, 0.9, 0), (4, 1.8, 0), (7, 0.85, 12)):
                tn = tb + pos * S_BEAT / 2
                if tn < t_stop - 0.05:
                    low.add(tn, sub_bass(root + up, dur * S_BEAT / 2, attack=0.008, release=0.05), 0.13 if up else 0.24)
        for e in range(8):
            te = tb + e * S_BEAT / 2
            if te >= t_stop - 0.02:
                break
            se = section(te)
            bells.add(te, bell_fm(arp[H_ARP[e]] + 12, 1.3, decay=0.45, index=1.1 + 0.25 * se, idecay=0.09),
                      0.32 * H_ACCENT[e] * (0.85 + 0.08 * se), pan=0.35 if e % 2 else -0.35)
            if se >= 2 and e in (0, 3, 6):
                bells.add(te, marimba(arp[(0, 2, 1)[(0, 3, 6).index(e)]], 0.9), 0.28, pan=-0.2)
    kick_amp, depth = (0.42, 0.5, 0.55, 0.6), (0.28, 0.34, 0.38, 0.42)
    k = 0
    while True:
        tk = t06 + k * S_BEAT
        if tk >= t_stop - 0.02:
            break
        sec = section(tk)
        if sec >= 1 or k % 2 == 0:
            drums.add(tk, soft_kick(f_end=41.2), kick_amp[sec])
            hits.append((tk, depth[sec]))
        if sec >= 1 and k % 4 in (1, 3):
            drums.add(tk, snap(seed=k), 0.22 + 0.03 * sec, pan=-0.2)
        for q in range(4):
            tq = tk + q * S_BEAT / 4
            if tq >= t_stop - 0.02:
                break
            sq = section(tq)
            r = _hrng("see-pitch-shake", k, q)
            v = (0.4, 0.2, 0.75, 0.25)[q] * (0.85 + 0.15 * sq) * r.uniform(0.85, 1.1)
            drums.add(tq + r.uniform(-0.003, 0.003), shaker(sq / 3, seed=4 * k + q), 0.05 * v, pan=0.3)
        k += 1
    # a two-bar bell top line through s09
    b09 = int(np.ceil((t09 - t06) / S_BAR - 1e-6))
    top = [(0, 80, 1.0), (2, 78, 0.8), (3, 76, 0.75), (4, 75, 0.9), (6, 76, 0.7), (7, 78, 0.75),
           (8, 80, 1.0), (10, 83, 0.85), (11, 80, 0.7), (12, 78, 0.9), (14, 75, 0.7), (15, 78, 0.75)]
    for pos, m, v in top:
        te = t06 + b09 * S_BAR + pos * S_BEAT / 2
        if te < t_stop - 0.05:
            add_echo(bells, te, bell_fm(m, 2.0, decay=0.8, index=1.8, idecay=0.15), 0.28 * v, pan=0.1)

    # ── s10: the drums stop as "paywall" falls (a held B pad under it), then the end-card bloom.
    pads.add(t_stop, warm_pad(S_CHORDS["B"][0], t_mark - t_stop + 0.3, cutoff=900, attack=0.05, release=0.2, sweep=(2800, 2.0), seed=90), 0.75)
    low.add(t_stop, sub_bass(35, t_mark - t_stop, attack=0.01, release=0.05), 0.16)
    casc = np.zeros((2, int(4.0 * SR)))
    for j, m in enumerate([94, 90, 87, 83, 80, 78, 75, 71]):  # A#6 F#6 D#6 B5 G#5 F#5 D#5 B4
        _mixin(casc, j * S_BEAT / 4, bell_fm(m, 2.6, decay=1.0, index=1.6, idecay=0.2), 0.3 * (1 - 0.05 * j), pan=0.55 - 0.16 * j)
    air.add(t_mark - 1.0, reverse_swell(casc, 1.0), 0.45)
    bells.add(t_mark, casc, 1.0)
    tail = DUR - t_mark
    pads.add(t_mark, warm_pad(S_FLYD, tail + 0.3, cutoff=2800, attack=0.1, release=3.0, seed=91), 1.25)
    pads.add(t_mark, vox_pad([64, 68, 71, 75, 78], tail + 0.3, attack=0.4, release=3.0, bright=1.3, seed=91), 0.42)
    low.add(t_mark, sub_bass(40, tail - 0.4, attack=0.02, release=2.6), 0.2)
    air.add(t_mark, air_wash(4.5, decay=1.3, seed=12), 0.18)

    sc = sidechain(pads.x.shape[1], hits)
    body, lows = pads.x * sc, low.x * sc
    x = 1.6 * (hook.x + 0.25 * reverb(hook.x, seconds=1.2, damp=4000))  # the sparse dark act, lifted ~4 dB
    i0, i1 = int(t_cut * SR), int((t_cut + 0.1) * SR)  # the cut takes the hook's room with it
    x[:, i0:i1] *= np.cos(np.linspace(0, np.pi / 2, i1 - i0)) ** 2
    x[:, i1:] = 0.0
    x = x + body + lows + bells.x + drums.x + air.x
    x = x + 0.3 * reverb(0.55 * body + bells.x + 0.7 * air.x + 0.1 * drums.x, seconds=2.8, damp=5200)
    x = hp(x[:, :N], 22)
    fade = int(1.2 * SR)
    x[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    return x


def compose_music_see_tech() -> np.ndarray:
    """See, the 3-minute tech-stack video: the See palette kept quiet under an explainer. An E-major bell
    bloom on the orb, then the E C#m A B groove at 100 BPM: a light kick, shaker and bell arpeggio through
    the product demo; pads, sub and a slower bell line through the architecture (no shaker, kick on the
    one); warmer voices for the team; the end-card cascade lands on the WorkOnward Foundation logo."""
    t_orb = event_t("k01_open", "orb")
    t_prod, t_arch, t_team = scene_t("k02_jobs"), scene_t("k08_overview"), scene_t("k15_team")
    t_mark = event_t("k16_close", "logo")
    pads, low, bells, drums, air = (Bus(DUR) for _ in range(5))
    hits = []

    # the open: a bloom on the orb, then a held E pad until the groove
    bloom = np.zeros((2, int(4.6 * SR)))
    for j, (m, pn) in enumerate(zip([64, 71, 76, 78, 80, 87], [-0.45, 0.35, -0.2, 0.5, -0.5, 0.2])):
        _mixin(bloom, j * 0.03, bell_fm(m, 4.4, decay=1.5, index=1.5, idecay=0.35), 0.5 - 0.03 * j, pan=pn)
    bells.add(t_orb, bloom, 0.38)
    air.add(max(0.0, t_orb - 0.8), air_wash(2.4, decay=0.8, seed=21), 0.12)
    pads.add(t_orb, warm_pad(S_CHORDS["E"][0], t_prod - t_orb + 0.4, cutoff=900, attack=1.2, release=0.4, sweep=(1600, 1.0), seed=200), 0.6)
    pads.add(t_orb + 0.3, vox_pad(S_VOX["E"], t_prod - t_orb, attack=1.4, release=0.4, seed=200), 0.3)

    def section(tq):  # 0 product, 1 architecture, 2 team
        return int(tq >= t_arch) + int(tq >= t_team)

    t_stop = t_mark - 0.6
    b = 0
    while True:
        tb = t_prod + b * S_BAR
        if tb >= t_stop:
            break
        name = S_CYCLE[b % 4]
        voicing, root, arp = S_CHORDS[name]
        sec = section(tb)
        bar_len = min(S_BAR, t_stop - tb)
        pads.add(tb, warm_pad(voicing, bar_len + 0.3, cutoff=(1700, 1300, 2200)[sec], attack=0.3 if b == 0 else 0.06, release=0.3, seed=210 + b), 0.75)
        if sec == 2:
            pads.add(tb, vox_pad(S_VOX[name], bar_len + 0.3, attack=0.3, release=0.3, seed=b), 0.3)
        low.add(tb, sub_bass(root, bar_len - 0.03, attack=0.03, release=0.12), 0.18)
        step = 1 if sec != 1 else 2  # the architecture gets a slower bell line
        for e in range(0, 8, step):
            te = tb + e * S_BEAT / 2
            if te >= t_stop - 0.02:
                break
            bells.add(te, bell_fm(arp[H_ARP[e]] + 12, 1.2, decay=0.42, index=1.1, idecay=0.09), 0.2 * H_ACCENT[e], pan=0.35 if e % 2 else -0.35)
        for k in range(4):
            tk = tb + k * S_BEAT
            if tk >= t_stop - 0.02:
                break
            if k == 0 or (sec != 1 and k == 2):
                drums.add(tk, soft_kick(f_end=41.2), 0.32)
                hits.append((tk, 0.22))
            if sec == 0:
                for q in range(4):
                    tq = tk + q * S_BEAT / 4
                    r = _hrng("see-tech-shake", b * 4 + k, q)
                    drums.add(tq, shaker(0.3, seed=16 * b + 4 * k + q), 0.035 * (0.4, 0.2, 0.75, 0.25)[q] * r.uniform(0.85, 1.1), pan=0.3)
        b += 1

    # the close: a falling bell cascade into an Emaj7(#11) bloom on the logo
    casc = np.zeros((2, int(4.0 * SR)))
    for j, m in enumerate([94, 90, 87, 83, 80, 78, 75, 71]):
        _mixin(casc, j * S_BEAT / 4, bell_fm(m, 2.6, decay=1.0, index=1.6, idecay=0.2), 0.3 * (1 - 0.05 * j), pan=0.55 - 0.16 * j)
    air.add(t_mark - 1.0, reverse_swell(casc, 1.0), 0.4)
    bells.add(t_mark, casc, 0.9)
    tail = DUR - t_mark
    pads.add(t_mark - 0.6, warm_pad(S_FLYD, tail + 0.9, cutoff=2600, attack=0.4, release=2.5, seed=230), 1.1)
    pads.add(t_mark, vox_pad([64, 68, 71, 75, 78], tail, attack=0.5, release=2.5, bright=1.2, seed=231), 0.38)
    low.add(t_mark, sub_bass(40, tail - 0.4, attack=0.02, release=2.0), 0.18)

    sc = sidechain(pads.x.shape[1], hits)
    body = pads.x * sc
    x = body + low.x * sc + bells.x + drums.x + air.x
    x = x + 0.3 * reverb(0.55 * body + bells.x + 0.7 * air.x + 0.1 * drums.x, seconds=2.6, damp=5200)
    x = hp(x[:, :N], 22)
    fade = int(1.2 * SR)
    x[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    return x


# Holly's UI sounds. compose_sfx hands a generator the event's `name` / `t` only if
# its signature asks for them, so repeated events (12 pings, 3 checks) can differ.

_SEQ: dict = {}


# ── Tahoe on Product Hunt: a questioning B minor intro, a D major bloom on the logo, then an optimistic
#    I-V-vi-IV groove (D A Bm G) at 104 BPM that builds through the product and blooms again on the close ──

T_BPM = 104
T_BEAT = 60 / T_BPM  # 0.577 s
T_BAR = 4 * T_BEAT  # 2.31 s
T_CHORDS = {
    "D": ([50, 54, 57, 61, 64], 38, [62, 66, 69, 73, 76]),  # Dmaj9    D3 F#3 A3 C#4 E4 / D2
    "A": ([45, 52, 57, 59, 64], 33, [57, 61, 64, 69, 71]),  # Asus2    A2 E3 A3 B3 E4 / A1
    "Bm": ([47, 50, 54, 57, 61], 35, [59, 62, 66, 69, 73]),  # Bm9     B2 D3 F#3 A3 C#4 / B1
    "G": ([43, 50, 54, 57, 59], 31, [55, 59, 62, 66, 69]),  # Gmaj9    G2 D3 F#3 A3 B3 / G1
}
T_CYCLE = ["D", "A", "Bm", "G"]
T_VOX = {"D": [62, 66, 69, 73], "A": [61, 64, 69, 71], "Bm": [62, 66, 69, 73], "G": [62, 66, 67, 71]}
T_HOOK = [  # the question: Bm(add9) -> Gmaj7 -> Em9 -> A sus, which wants the D of the logo
    ([47, 54, 59, 61, 62], 35),
    ([43, 50, 55, 59, 62], 31),
    ([40, 47, 50, 54, 55], 28),
    ([45, 50, 52, 57, 59], 33),
]
T_FLYD = [50, 57, 62, 66, 68, 73]  # Dmaj7(#11) for the close (D3 A3 D4 F#4 G#4 C#5)

# Scene roles per Tahoe film: intro scenes, the logo scene (event "impact"), where the groove starts, the
# scenes that lift it a step at a time, the breath before the end, and the end scene (event "mark").
T_ROLES = {
    "tahoe-ph1": {"intro": ["t01_hook", "t02_sea"], "logo": "t03_reveal", "groove": "t04_byok",
                  "steps": ["t05_search", "t07_reveal", "t09_more"], "breath": "t10_mcp", "end": "t11_end"},
    # v2/v3 add a lift into the first app shot: a short riser and a soft downbeat as the window opens
    "tahoe-ph2": {"intro": ["t01_hook", "t02_sea"], "logo": "t03_reveal", "groove": "t04_byok",
                  "steps": ["t05_search", "t07_reveal", "t09_more"], "breath": "t10_mcp", "end": "t11_end", "lift": True},
    # v3 also answers the intro's question motif: it resolves to D after the logo bloom and again on the end card
    "tahoe-ph3": {"intro": ["t01_hook", "t02_sea"], "logo": "t03_reveal", "groove": "t04_byok",
                  "steps": ["t05_search", "t07_reveal", "t09_more"], "breath": "t10_mcp", "end": "t11_end", "lift": True, "answer": True},
}


def compose_music_tahoe_ph() -> np.ndarray:
    """Tahoe, 60 s Product Hunt film. Under the hook, four hushed chords with a felt-bell motif asking the
    question; a riser and a beat of silence; a D major bell bloom on the logo; a gentle bed under the
    data provider key; then the I-V-vi-IV groove on a 104 BPM grid, one step brighter at each role in `steps`
    (drums enter, then four on the floor with snaps, then the vocal pad and a bell top line for the feature
    grid); the drums drop out for the breath; and an end-card bloom that rings out."""
    R = T_ROLES[VARIANT]
    t_intro = [scene_t(k) for k in R["intro"]]
    t_imp = event_t(R["logo"], "impact")
    t_cut = t_imp - 0.45
    t_g = scene_t(R["groove"])
    steps = [scene_t(k) for k in R["steps"]]
    t_breath = scene_t(R["breath"])
    t_end = scene_t(R["end"])
    t_mark = event_t(R["end"], "mark")

    hook, pads, low, bells, drums, air = (Bus(DUR) for _ in range(6))
    hits = []

    # ── intro: four soft chords across the hook scenes, filters opening a little each time
    spans = []
    for a, b in zip(t_intro, t_intro[1:] + [t_cut]):
        mid = (a + b) / 2
        spans += [(a, mid), (mid, b)]
    for k, ((voicing, root), (a, b)) in enumerate(zip(T_HOOK, spans)):
        hook.add(a, warm_pad(voicing, b - a + 0.6, cutoff=520 + 160 * k, attack=1.1 if k == 0 else 0.35, release=0.6,
                             sweep=(900 + 260 * k, 1.4), seed=200 + k), 0.55)
        hook.add(a, sub_bass(root, b - a + 0.3, attack=0.8 if k == 0 else 0.25, release=0.4), 0.1)
    # a felt-bell question motif, one phrase per chord, rising on the last
    motif = [(0.0, 74), (0.42, 73), (0.84, 69), (1.5, 71)]
    for k, (a, b) in enumerate(spans):
        for dt, m in motif:
            if a + dt < b - 0.1:
                add_echo(bells, a + 0.25 + dt, bell_fm(m + (2 if k == 3 and dt > 1 else 0), 1.6, decay=0.7, index=1.0, idecay=0.12), 0.16 + 0.03 * k, pan=-0.2 + 0.13 * k)
    # the riser into the logo, then a clean cut
    air.add(t_cut - 2.2, _noise_sweep(2.2, 300, 5200, width=0.9, curve=1.6, seed=31) * env_ar(int(2.2 * SR), 1.8, 0.05), 0.09)

    # ── logo: reverse swell into a D major bell bloom
    bloom = np.zeros((2, int(4.8 * SR)))
    for j, (m, pn) in enumerate(zip([62, 69, 74, 76, 78, 85], [-0.45, 0.35, -0.2, 0.5, -0.5, 0.2])):
        _mixin(bloom, j * 0.03, bell_fm(m, 4.6, decay=1.5, index=1.5, idecay=0.35), 0.5 - 0.03 * j, pan=pn)
    air.add(t_cut, reverse_swell(bloom, t_imp - t_cut), 0.36)
    bells.add(t_imp, bloom, 0.46)
    glow = t_g - t_imp
    pads.add(t_imp - 0.05, warm_pad(T_CHORDS["D"][0], glow + 0.5, cutoff=900, attack=0.8, release=0.5, sweep=(2300, 0.6), seed=210), 0.7)
    pads.add(t_imp + 0.2, vox_pad(T_VOX["D"], glow + 0.3, attack=1.1, release=0.5, seed=210), 0.38)
    low.add(t_imp, sub_bass(38, glow, attack=0.4, release=0.3), 0.2)
    low.add(t_imp, impact(0.8)[: int(2.0 * SR)] * 0.5, 0.33)
    air.add(t_imp, air_wash(3.0, decay=0.8, seed=21), 0.14)

    if R.get("answer"):
        # the question (D C# A ... B) answered: D C# A D, after the bloom and again over the end card
        end_sc = SCENES[R["end"]]
        t_last = (end_sc["from"] + end_sc["cues"][-1]["endFrame"]) / FPS  # after the last spoken line
        for t0, gapx, amp in ((t_imp + 0.9, 0.24, 0.2), (t_last + 0.3, 0.34, 0.26)):
            for j, m in enumerate([86, 85, 81, 86]):
                add_echo(bells, t0 + j * gapx + (0.12 if j == 3 else 0), bell_fm(m, 2.2, decay=0.9, index=1.2, idecay=0.14), amp * (1.15 if j == 3 else 1), pan=-0.25 + 0.17 * j)

    # ── the groove, on a 104 BPM grid from the groove scene; it drops for the breath
    def section(tq):  # 0 = bed only, then one step up at each role in `steps`
        return sum(int(tq >= x) for x in steps)

    n_bars = int((t_end - t_g) // T_BAR) + 2
    for b in range(n_bars):
        tb = t_g + b * T_BAR
        if tb >= t_mark:
            break
        name = T_CYCLE[b % 4]
        voicing, root, arp = T_CHORDS[name]
        sec = section(tb)
        breath = tb >= t_breath - 0.05
        bar_len = min(T_BAR, t_mark - tb)
        pads.add(tb, warm_pad(voicing, bar_len + 0.3, cutoff=(1300, 1800, 2400, 3100)[sec] * (0.6 if breath else 1), attack=0.3 if b == 0 else 0.05,
                              release=0.3, seed=220 + b), 0.8)
        if sec >= 3 and not breath:
            pads.add(tb, vox_pad(T_VOX[name], bar_len + 0.3, attack=0.25, release=0.3, bright=1.2, seed=b), 0.3)
        if sec == 0 or breath:
            low.add(tb, sub_bass(root, bar_len - 0.03, attack=0.05, release=0.1), 0.18)
        else:
            for pos, dur, up in ((0, 2.6, 0), (3, 0.9, 0), (4, 1.8, 0), (7, 0.85, 12)):
                tn = tb + pos * T_BEAT / 2
                if tn < min(t_breath, t_mark) - 0.05:
                    low.add(tn, sub_bass(root + up, dur * T_BEAT / 2, attack=0.008, release=0.05), 0.13 if up else 0.24)
        for e in range(8):
            te = tb + e * T_BEAT / 2
            if te >= t_mark - 0.02:
                break
            se = section(te)
            amp = 0.3 * H_ACCENT[e] * (0.8 + 0.08 * se) * (0.6 if te >= t_breath else 1)
            bells.add(te, bell_fm(arp[H_ARP[e]] + 12, 1.3, decay=0.45, index=1.0 + 0.2 * se, idecay=0.09), amp, pan=0.35 if e % 2 else -0.35)
            if se >= 1 and e in (0, 3, 6) and te < t_breath:
                bells.add(te, marimba(arp[(0, 2, 1)[(0, 3, 6).index(e)]], 0.9), 0.26, pan=-0.2)
    kick_amp, depth = (0.0, 0.42, 0.52, 0.58), (0.0, 0.3, 0.36, 0.42)
    k = 0
    while True:
        tk = t_g + k * T_BEAT
        if tk >= t_breath - 0.02:
            break
        sec = section(tk)
        if sec >= 2 or (sec == 1 and k % 2 == 0):
            drums.add(tk, soft_kick(f_end=36.7), kick_amp[sec])
            hits.append((tk, depth[sec]))
        if sec >= 2 and k % 4 in (1, 3):
            drums.add(tk, snap(seed=k), 0.2 + 0.03 * sec, pan=-0.2)
        if sec >= 1:
            for q in range(4):
                tq = tk + q * T_BEAT / 4
                if tq >= t_breath - 0.02:
                    break
                r = _hrng("tahoe-shake", k, q)
                v = (0.4, 0.2, 0.75, 0.25)[q] * (0.85 + 0.15 * section(tq)) * r.uniform(0.85, 1.1)
                drums.add(tq + r.uniform(-0.003, 0.003), shaker(section(tq) / 3, seed=4 * k + q), 0.05 * v, pan=0.3)
        k += 1
    if R.get("lift"):
        t_up = steps[0]
        air.add(t_up - 1.1, _noise_sweep(1.1, 400, 6400, width=0.9, curve=1.4, seed=41) * env_ar(int(1.1 * SR), 0.9, 0.05), 0.07)
        low.add(t_up, impact(0.6)[: int(1.4 * SR)] * 0.5, 0.26)
        air.add(t_up, air_wash(2.2, decay=0.6, seed=42), 0.1)
    # a bell top line over the feature grid
    tb3 = t_g + int(np.ceil((steps[-1] - t_g) / T_BAR - 1e-6)) * T_BAR
    top = [(0, 78, 1.0), (2, 76, 0.8), (3, 74, 0.75), (4, 73, 0.9), (6, 74, 0.7), (7, 76, 0.75),
           (8, 78, 1.0), (10, 81, 0.85), (11, 78, 0.7), (12, 76, 0.9), (14, 73, 0.7), (15, 76, 0.75)]
    for pos, m, v in top:
        te = tb3 + pos * T_BEAT / 2
        if te < t_breath - 0.05:
            add_echo(bells, te, bell_fm(m, 2.0, decay=0.8, index=1.8, idecay=0.15), 0.26 * v, pan=0.1)
    air.add(t_breath - 0.9, _noise_sweep(0.9, 5200, 900, width=0.8, curve=0.8, seed=33) * env_ar(int(0.9 * SR), 0.05, 0.3), 0.05)

    # ── end card: a bell cascade lands on the mark, a Dmaj7(#11) bloom rings out
    casc = np.zeros((2, int(4.0 * SR)))
    for j, m in enumerate([90, 86, 85, 81, 78, 76, 73, 69]):
        _mixin(casc, j * T_BEAT / 4, bell_fm(m, 2.6, decay=1.0, index=1.6, idecay=0.2), 0.3 * (1 - 0.05 * j), pan=0.55 - 0.16 * j)
    air.add(t_mark - 1.0, reverse_swell(casc, 1.0), 0.42)
    bells.add(t_mark, casc, 1.0)
    tail = DUR - t_mark
    pads.add(t_mark, warm_pad(T_FLYD, tail + 0.3, cutoff=2800, attack=0.1, release=3.0, seed=231), 1.2)
    pads.add(t_mark, vox_pad([62, 66, 69, 73, 76], tail + 0.3, attack=0.4, release=3.0, bright=1.3, seed=231), 0.4)
    low.add(t_mark, sub_bass(38, tail - 0.4, attack=0.02, release=2.6), 0.2)
    air.add(t_mark, air_wash(4.5, decay=1.3, seed=22), 0.16)

    sc = sidechain(pads.x.shape[1], hits)
    body, lows = pads.x * sc, low.x * sc
    x = 1.5 * (hook.x + 0.25 * reverb(hook.x, seconds=1.4, damp=4200))
    i0, i1 = int(t_cut * SR), int((t_cut + 0.08) * SR)
    x[:, i0:i1] *= np.cos(np.linspace(0, np.pi / 2, i1 - i0)) ** 2
    x[:, i1:] = 0.0
    x = x + body + lows + bells.x + drums.x + air.x
    x = x + 0.3 * reverb(0.55 * body + bells.x + 0.7 * air.x + 0.1 * drums.x, seconds=2.6, damp=5200)
    x = hp(x[:, :N], 22)
    fade = int(1.2 * SR)
    x[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    return x


# ─────────────────────────────────────────────────────────────────── Tahoe for job seekers (seeker, seeker-ko)
# B-flat major. The problem is wry, not sad (a ticking clock, a two-note "still waiting" pluck, a felt piano);
# a hush; two warm chords for "you're not bad at this"; the theme drops on the logo and steps up through the demo;
# a breakdown on "fewer applications", the lift on "better ones", and the only peak on the end card.
J_CHORDS = {  # name: (pad voicing, bass root, arpeggio notes)
    "Bb": ([58, 62, 65, 69], 34, [70, 74, 77, 81, 82]),
    "F": ([57, 60, 65, 69], 41, [69, 72, 77, 79, 81]),
    "Gm": ([58, 62, 67, 69], 43, [70, 74, 77, 79, 82]),
    "Eb": ([58, 63, 67, 70], 39, [70, 75, 79, 82, 84]),
}
J_CYCLE = ["Bb", "F", "Gm", "Eb"]
J_PROBLEM = [([55, 58, 62, 65], 43), ([51, 58, 62, 67], 39), ([50, 58, 62, 65], 46), ([53, 58, 60, 65], 41)]  # Gm7 Ebmaj7 Bb/D Fsus
J_FLYD = [46, 53, 58, 62, 64, 69]  # Bbmaj7(#11) for the close (Bb2 F3 Bb3 D4 E4 A4)


def felt_piano(m, sec=2.4, vel=0.7, sustain=None):
    """Felt piano: two slightly detuned strings per note, ten stretched partials (each dying faster than the one
    below), a soft hammer, a felt-muted top and a damper that stops the note at `sustain` seconds."""
    n = int(sec * SR)
    t = np.arange(n) / SR
    f = hz(m)
    B = 0.00035
    t1 = float(np.clip(3.2 * (220 / f) ** 0.55, 0.6, 5.0))
    y = np.zeros(n)
    for k in range(1, 11):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 9000:
            break
        a = (1 / k**1.35) * (0.55 + 0.45 * vel) ** (k - 1)
        for c in (-0.9, 0.9):
            y += a * np.sin(2 * np.pi * fk * 2 ** (c / 1200) * t + k * 0.7) * np.exp(-t / (t1 / (1 + 0.55 * (k - 1))))
    thump = lp(_hrng("felt", m).standard_normal(n), 900) * np.exp(-t / 0.012) * 0.18
    y = lp(y * 0.5 + thump, 2400 + 2600 * vel, order=2)
    if sustain is not None and sustain < sec:
        d = int(sustain * SR)
        y[d:] *= np.exp(-(t[d:] - sustain) / 0.08)
    return y * env_ar(n, 0.004, 0.06)


def clap(seed=0):
    """Hand clap: three quick noise bursts (several hands, a few ms apart), then a short band-passed tail."""
    r = _hrng("clap", seed)
    t = tt(0.32)
    y = np.zeros(len(t))
    for j, dt in enumerate((0.0, 0.009, 0.019)):
        i = int(dt * SR)
        burst = r.standard_normal(len(t) - i) * np.exp(-np.arange(len(t) - i) / SR / 0.0045)
        y[i:] += burst * (0.8 if j < 2 else 1.0)
    i = int(0.019 * SR)
    y[i:] += r.standard_normal(len(t) - i) * np.exp(-np.arange(len(t) - i) / SR / 0.07) * 0.55
    y = bp(y, 850, 3600)
    return lp(y, 9000) * env_ar(len(t), 0.0004, 0.05)


def compose_music_seeker() -> np.ndarray:
    """60 s, B-flat major. Everything hangs on the film's own beats: the hook's click, the reveal's logo, the
    payoff's two lines and the end card."""
    sc = lambda k: scene_t(k)  # noqa: E731
    t_hook, t_stakes, t_turn = sc("s01_hook"), sc("s02_stakes"), sc("s03_turn")
    s3 = SCENES["s03_turn"]
    t_turn_c0 = (s3["from"] + s3["cues"][0]["frame"]) / FPS
    t_turn_c1 = (s3["from"] + s3["cues"][1]["frame"]) / FPS
    t_logo = event_t("s04_reveal", "mark")
    steps = [sc("s05_search"), sc("s06_real"), sc("s07_map"), sc("s08_match")]
    t_fewer, t_better = event_t("s09_payoff", "fewer"), event_t("s09_payoff", "better")
    t_mark = event_t("s10_end", "mark")
    t_hush = t_turn_c0 - 1.2

    # Tempo: near 100 BPM, nudged so a whole number of bars runs from the logo to the end card's mark.
    span = t_mark - t_logo
    bars = max(1, round(span * 100 / 60 / 4))
    bpm = 60 * 4 * bars / span
    beat = 60 / bpm
    bar = 4 * beat

    hook, piano, pads, low, bells, drums, air = (Bus(DUR) for _ in range(7))
    hits = []

    # ── the problem: a deadpan clock and a two-note "still waiting" pluck, Gm7 -> Ebmaj7 -> Bb/D -> Fsus
    k = 0
    while True:
        tk = t_hook + 0.35 + k * beat
        if tk >= t_hush - 0.05:
            break
        stakes = tk >= t_stakes
        hook.add(tk, tick_wood(1760 if k % 2 == 0 else 1320, seed=k), 0.16 if k % 2 == 0 else 0.1, pan=0.25 if k % 2 else -0.15)
        if k % 4 == 0:
            j = (k // 4) % 4
            voicing, root = J_PROBLEM[j]
            dur = min(bar, t_hush - tk) + 0.4
            pads.add(tk, warm_pad(voicing, dur, cutoff=650 + (250 if stakes else 0), attack=0.4, release=0.5, seed=300 + j), 0.42)
            for dt, m in ((0.0, 77), (beat * 1.5, 74)):  # F, D: a shrug
                if tk + dt < t_hush - 0.1:
                    bells.add(tk + dt, marimba(m, 0.7, hard=0.6), 0.2, pan=-0.3 + 0.6 * (k // 4 % 2))
            if stakes:
                for i, m in enumerate(voicing):
                    piano.add(tk + 0.015 * i, felt_piano(m + 12, 2.6, vel=0.45, sustain=bar * 0.95), 0.2, pan=-0.3 + 0.2 * i)
                low.add(tk, sub_bass(root, min(bar, t_hush - tk) - 0.05, attack=0.05, release=0.12), 0.16)
        if stakes and k % 2 == 1:
            low.add(tk, soft_kick(f_end=38.9, decay=0.14, click=0.02), 0.2)
        k += 1
    air.add(t_hush - 0.7, _noise_sweep(0.7, 4800, 700, width=0.8, curve=0.8, seed=51) * env_ar(int(0.7 * SR), 0.05, 0.25), 0.05)

    # ── the turn: two warm chords, nothing else
    for t0, voicing, root, dur in ((t_turn_c0, [63, 67, 70, 74, 77], 39, t_turn_c1 - t_turn_c0 + 0.6), (t_turn_c1, [65, 70, 72, 77], 41, t_logo - t_turn_c1 - 0.2)):
        for i, m in enumerate(voicing):  # intimate: soft hands, low in the mix
            piano.add(t0 + 0.025 * i, felt_piano(m, dur + 1.5, vel=0.42, sustain=dur), 0.17, pan=-0.35 + 0.17 * i)
        pads.add(t0, warm_pad(voicing[:4], dur + 0.4, cutoff=620, attack=0.8, release=0.6, seed=320), 0.15)
        low.add(t0, sub_bass(root, dur, attack=0.5, release=0.4), 0.07)

    # ── the logo: a reverse swell into a B-flat bell bloom; the groove starts on it
    t_cut = t_logo - 0.5
    bloom = np.zeros((2, int(4.4 * SR)))
    for j, (m, pn) in enumerate(zip([58, 65, 70, 74, 77, 82], [-0.45, 0.35, -0.2, 0.5, -0.5, 0.2])):
        _mixin(bloom, j * 0.03, bell_fm(m, 4.2, decay=1.4, index=1.4, idecay=0.3), 0.5 - 0.03 * j, pan=pn)
    air.add(t_cut, reverse_swell(bloom, t_logo - t_cut), 0.34)
    bells.add(t_logo, bloom, 0.42)
    low.add(t_logo, impact(0.7)[: int(1.8 * SR)] * 0.5, 0.3)
    air.add(t_logo, air_wash(2.6, decay=0.7, seed=52), 0.13)

    def level(tq):  # 0 on the logo, then one step up at each demo scene
        return sum(int(tq >= x) for x in steps)

    breakdown = lambda tq: t_fewer - 0.05 <= tq < t_better - 0.05  # noqa: E731
    n_bars = int(np.ceil(span / bar))
    for b in range(n_bars):
        tb = t_logo + b * bar
        name = J_CYCLE[b % 4]
        voicing, root, arp = J_CHORDS[name]
        lv = level(tb)
        bl = min(bar, t_mark - tb)
        if bl <= 0.05:
            break
        quiet = breakdown(tb + bar / 2)
        pads.add(tb, warm_pad(voicing, bl + 0.3, cutoff=(1100, 1500, 1900, 2400, 2800)[lv] * (0.7 if quiet else 1), attack=0.25 if b == 0 else 0.05, release=0.3, seed=330 + b), 0.7)
        if lv >= 3 and not quiet:
            pads.add(tb, vox_pad([m + 12 for m in voicing[:3]], bl + 0.3, attack=0.25, release=0.3, bright=1.1, seed=b), 0.24)
        for i, m in enumerate(voicing):
            piano.add(tb + 0.012 * i, felt_piano(m + 12, 2.2, vel=0.55, sustain=bl * 0.9), 0.14 if not quiet else 0.24, pan=-0.3 + 0.2 * i)
        for pos, d, up in ((0, 2.6, 0), (3, 0.9, 0), (4, 1.8, 0), (7, 0.85, 12)):
            tn = tb + pos * beat / 2
            if tn < t_mark - 0.05 and not (quiet and pos > 0):
                low.add(tn, sub_bass(root + up, d * beat / 2, attack=0.008, release=0.05), (0.12 if up else 0.22) * (0.7 if lv == 0 else 1))
        for e in range(8):
            te = tb + e * beat / 2
            if te >= t_mark - 0.02 or breakdown(te):
                continue
            bells.add(te, pluck(arp[[0, 2, 1, 3, 4, 3, 2, 1][e]], 0.9, decay=0.35, bright=0.8), 0.13 * H_ACCENT[e] * (0.8 + 0.1 * level(te)), pan=0.35 if e % 2 else -0.35)
    k = 0
    while True:
        tk = t_logo + k * beat
        if tk >= t_mark - 0.02:
            break
        lv = level(tk)
        if not breakdown(tk):
            if lv >= 2 or (lv >= 0 and k % 2 == 0):
                drums.add(tk, soft_kick(f_end=34.65), (0.36, 0.42, 0.5, 0.54, 0.56)[lv])
                hits.append((tk, (0.25, 0.3, 0.36, 0.4, 0.42)[lv]))
            if lv >= 1 and k % 4 in (1, 3):
                drums.add(tk, clap(seed=k), 0.24 + 0.03 * lv, pan=0.1)
            if lv >= 1:
                for q in range(4):
                    tq = tk + q * beat / 4
                    r = _hrng("seek-shake", k, q)
                    drums.add(tq + r.uniform(-0.003, 0.003), shaker(level(tq) / 4, seed=4 * k + q), 0.05 * (0.4, 0.2, 0.75, 0.25)[q] * r.uniform(0.85, 1.1), pan=0.3)
        k += 1
    # a bell top line from the map on
    t3 = steps[2]
    tb3 = t_logo + int(np.ceil((t3 - t_logo) / bar - 1e-6)) * bar
    for pos, m, v in [(0, 82, 1.0), (2, 81, 0.8), (3, 77, 0.75), (4, 79, 0.9), (6, 77, 0.7), (7, 74, 0.75), (8, 77, 1.0), (10, 79, 0.85), (12, 82, 0.9), (14, 81, 0.7)]:
        te = tb3 + pos * beat / 2
        if te < t_fewer - 0.1:
            add_echo(bells, te, bell_fm(m, 1.8, decay=0.7, index=1.6, idecay=0.14), 0.2 * v, pan=0.1)
    # the lift on "better ones"
    air.add(t_better - 1.0, _noise_sweep(1.0, 500, 6400, width=0.9, curve=1.4, seed=53) * env_ar(int(1.0 * SR), 0.9, 0.05), 0.07)
    air.add(t_better, air_wash(2.2, decay=0.6, seed=54), 0.12)
    low.add(t_better, impact(0.5)[: int(1.2 * SR)] * 0.5, 0.22)

    # ── end card: bell cascade into the mark, a three-note sound logo, a Bbmaj7(#11) bloom that rings out
    casc = np.zeros((2, int(3.6 * SR)))
    for j, m in enumerate([89, 86, 82, 81, 77, 74, 70]):
        _mixin(casc, j * beat / 4, bell_fm(m, 2.4, decay=0.9, index=1.5, idecay=0.18), 0.28 * (1 - 0.05 * j), pan=0.55 - 0.18 * j)
    air.add(t_mark - 0.9, reverse_swell(casc, 0.9), 0.4)
    bells.add(t_mark, casc, 0.9)
    for j, m in enumerate([77, 82, 86]):  # F, B-flat, D: the sound logo
        add_echo(bells, t_mark + 1.1 + j * beat / 2, bell_fm(m, 2.6, decay=1.1, index=1.3, idecay=0.16), 0.3 * (1.15 if j == 2 else 1), pan=-0.25 + 0.25 * j)
    tail = DUR - t_mark
    pads.add(t_mark, warm_pad(J_FLYD, tail + 0.3, cutoff=2600, attack=0.1, release=3.0, seed=341), 1.1)
    pads.add(t_mark, vox_pad([58, 62, 65, 69, 72], tail + 0.3, attack=0.4, release=3.0, bright=1.2, seed=341), 0.36)
    for i, m in enumerate([58, 65, 70, 74, 76]):
        piano.add(t_mark + 0.02 * i, felt_piano(m, tail + 0.5, vel=0.6), 0.22, pan=-0.3 + 0.15 * i)
    low.add(t_mark, sub_bass(34, tail - 0.4, attack=0.02, release=2.4), 0.2)
    low.add(t_mark, impact(0.6)[: int(1.6 * SR)] * 0.5, 0.2)
    air.add(t_mark, air_wash(4.2, decay=1.2, seed=55), 0.15)

    sc_curve = sidechain(pads.x.shape[1], hits)
    x = 1.3 * (hook.x + 0.2 * reverb(hook.x, seconds=1.2, damp=4200))
    x = x + piano.x + pads.x * sc_curve + low.x * sc_curve + bells.x + drums.x + air.x
    x = x + 0.3 * reverb(0.5 * pads.x + piano.x + bells.x + 0.6 * air.x + 0.08 * drums.x, seconds=2.6, damp=5200)
    x = hp(x[:, :N], 22)
    # the hush before the turn: everything but the falling air dips away
    i0, i1 = int((t_hush - 0.3) * SR), int(t_hush * SR)
    j0, j1 = int((t_turn_c0 - 0.05) * SR), int(t_turn_c0 * SR)
    g = np.ones(x.shape[1])
    g[i0:i1] = np.linspace(1, 0.08, i1 - i0)
    g[i1:j0] = 0.08
    g[j0:j1] = np.linspace(0.08, 1, j1 - j0)
    x = x * g
    fade = int(1.2 * SR)
    x[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    print(f"seeker score: {bpm:.2f} BPM, {bars} bars from the logo ({t_logo:.2f}s) to the end mark ({t_mark:.2f}s)")
    return x


def _seq_index(kind: str, name: str, start: int = 0) -> int:
    """The event's place in its series: the trailing number of its name (ping7 -> 7,
    check2 -> 2) or, failing that, the order in which it is reached."""
    tail = name[len(name.rstrip("0123456789")) :]
    if tail:
        return int(tail)
    _SEQ[kind] = _SEQ.get(kind, start - 1) + 1
    return _SEQ[kind]


def _ding(m, decay=0.25, ratio=3.0, index=1.0, sec=None, partial=0.15):
    """A short glassy UI tone: FM sine whose index falls fast (bright strike, pure tail)."""
    sec = sec or min(1.6, decay * 5)
    n = int(sec * SR)
    t = np.arange(n) / SR
    f = hz(m)
    i_t = index * np.exp(-t / 0.035)
    y = np.sin(2 * np.pi * f * t + i_t * np.sin(2 * np.pi * f * ratio * t)) * np.exp(-t / decay)
    y += partial * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / (decay * 0.4))
    return lp(y * env_ar(n, 0.0015, min(0.05, sec / 4)), 9500)


def s_notify(name: str = "", t: float = 0.0) -> np.ndarray:
    """iOS-style notification: a quick, glassy two-tone ding. Each ping takes its own
    note pair (by its index), brightness, spacing and place in the stereo field, so a
    pile-up reads as many different apps rather than one sound repeated."""
    i = _seq_index("notify", name)
    r = _hrng("notify", name, round(t, 3))
    a, b = H_NOTIFY[i % len(H_NOTIFY)]
    ratio = (3.5, 2.0, 3.0, 4.0)[i % 4]
    index = r.uniform(0.5, 1.2)
    gap = r.uniform(0.075, 0.105)
    pan = float(((i * 0.47) % 1.3) - 0.65)
    out = np.zeros((2, int(1.4 * SR)))
    _mixin(out, 0.0, _ding(a, r.uniform(0.11, 0.17), ratio, index), 0.7, pan)
    _mixin(out, gap, _ding(b, r.uniform(0.2, 0.3), ratio, index), 1.0, pan)
    return out


def s_tap(t: float = 0.0) -> np.ndarray:
    """Soft UI tap: a tiny rounded click over a small, low haptic thump."""
    r = _hrng("tap", round(t, 3))
    n = int(0.14 * SR)
    x = np.arange(n) / SR
    click = bp(r.standard_normal(n), 2000, 6500) * np.exp(-x / 0.003) * 0.35
    click += np.sin(2 * np.pi * 1550 * x) * np.exp(-x / 0.018) * 0.4 + np.sin(2 * np.pi * 3100 * x) * np.exp(-x / 0.008) * 0.12
    click += bp(r.standard_normal(n), 6000, 11000) * np.exp(-x / 0.0015) * 0.3  # a crisp edge that reads over the VO
    thump = np.sin(2 * np.pi * np.cumsum(70 + 70 * np.exp(-x / 0.012)) / SR) * np.exp(-x / 0.035) * 0.4
    return lp(click + thump, 13000) * env_ar(n, 0.0003, 0.04)


def s_sheet() -> np.ndarray:
    """Bottom sheet sliding up: a soft, airy upward whoosh."""
    sec = 0.5
    y = np.stack([_noise_sweep(sec, 450, 3800, width=0.9, curve=0.8, seed=s) for s in (1, 2)])
    x = np.arange(y.shape[1]) / y.shape[1]
    e = np.where(x < 0.6, (x / 0.6) ** 1.6, np.exp(-(x - 0.6) / 0.12))
    return y * e * env_ar(y.shape[1], 0.005, 0.03)


def s_sent() -> np.ndarray:
    """Message sent: a light rising whoosh that lands on a bright two-note chime (A5, E6)."""
    out = np.zeros((2, int(1.6 * SR)))
    w = np.stack([_noise_sweep(0.26, 600, 6000, width=0.8, curve=1.2, seed=s) for s in (3, 4)])
    w *= (np.arange(w.shape[1]) / w.shape[1]) ** 1.7 * env_ar(w.shape[1], 0.0, 0.025)
    _mixin(out, 0.0, w, 0.5)
    _mixin(out, 0.22, _ding(81, 0.3, 3.5, 0.9), 0.6, pan=-0.12)
    _mixin(out, 0.31, _ding(88, 0.5, 3.5, 0.9), 0.75, pan=0.12)
    return out


def s_confetti(t: float = 0.0) -> np.ndarray:
    """Confetti burst: a soft puff, then many tiny high tings (C-major pentatonic) and
    crackles that thin out over ~0.8 s, scattered across the stereo field."""
    r = _hrng("confetti", round(t, 3))
    out = np.zeros((2, int(1.3 * SR)))
    puff = _noise_sweep(0.14, 2400, 900, width=1.4, seed=5)
    _mixin(out, 0.0, puff * env_ar(len(puff), 0.004, 0.1), 0.25)
    notes = [84, 86, 88, 91, 93, 96, 98, 100, 103, 105]
    for _ in range(46):
        when = min(0.8, r.exponential(0.22))
        ting = _ding(int(r.choice(notes)), r.uniform(0.03, 0.09), 2.0, r.uniform(0.2, 0.6), sec=0.3, partial=0.05)
        _mixin(out, 0.02 + when, ting, r.uniform(0.15, 0.35) * (1 - when), pan=r.uniform(-0.85, 0.85))
    for _ in range(30):
        when = 0.8 * r.uniform() ** 1.5
        c = bp(r.standard_normal(int(0.006 * SR)), 3000, 9000) * np.exp(-np.arange(int(0.006 * SR)) / SR / 0.0007)
        _mixin(out, when, c, r.uniform(0.04, 0.12), pan=r.uniform(-0.9, 0.9))
    return lp(out, 12000)


def s_ring() -> np.ndarray:
    """Progress ring filling: a soft tone gliding up an octave (F4 to F5) and swelling,
    then resolving into a warm F-major chime."""
    out = np.zeros((2, int(1.9 * SR)))
    rise = 0.62
    n = int(rise * SR)
    x = np.arange(n) / n
    ph = 2 * np.pi * np.cumsum(hz(65) * 2 ** (x**1.4)) / SR
    tone = (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)) * (0.15 + 0.85 * x**1.5)
    tone *= (1 + 0.08 * np.sin(2 * np.pi * 7 * x * rise)) * env_ar(n, 0.04, 0.05)
    _mixin(out, 0.0, tone, 0.3)
    for j, (m, p) in enumerate(((77, -0.2), (81, 0.2), (84, 0.0))):
        _mixin(out, rise - 0.02 + j * 0.022, bell_fm(m, 1.25, decay=0.45, index=1.0, idecay=0.08), 0.35, pan=p)
    return out


def s_sparkle() -> np.ndarray:
    """Four tiny rising tings, 80 ms apart, one per sparkle on the logo (A6 C7 E7 G7)."""
    out = np.zeros((2, int(0.9 * SR)))
    for j, m in enumerate((93, 96, 100, 103)):
        _mixin(out, j * 0.08, _ding(m, 0.12 + 0.02 * j, 2.0, 0.4, sec=0.5), 0.35 + 0.05 * j, pan=-0.45 + 0.3 * j)
    return out


def s_check(name: str = "") -> np.ndarray:
    """A single pleasant tick; check1, check2, check3 ... climb the pentatonic (G5 A5 C6 ...)."""
    k = _seq_index("check", name, start=1)
    m = H_PENTA[min(len(H_PENTA) - 1, H_PENTA.index(79) + max(0, k - 1))]
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = hz(m)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.11) + 0.3 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t / 0.02)
    y += bp(_hrng("check", k).standard_normal(n), 2500, 8000) * np.exp(-t / 0.001) * 0.2
    return y * env_ar(n, 0.001, 0.05)


def s_shimmer_holly() -> np.ndarray:
    """The shimmer in Holly's key: the same rising pluck run as s_shimmer, but on
    Fmaj9(#11)'s upper tones (A C E G B), since its A-major run (C#) clashes with F."""
    out = np.zeros(int(2.2 * SR))
    for i, m in enumerate([81, 84, 88, 91, 95]):
        p = pluck(m, 1.6, 0.7, bright=0.5) * 0.22
        j = int(i * 0.05 * SR)
        out[j : j + len(p)] += p[: len(out) - j]
    return out


# See's sounds (shared generators, its own key: E major)

def s_suck() -> np.ndarray:
    """A word pulled out of the frame: a falling whoosh (3 kHz to 250 Hz) over a dropping low sine."""
    sec = 0.55
    y = np.stack([_noise_sweep(sec, 3000, 250, width=1.0, curve=0.7, seed=s) for s in (21, 22)])
    n = y.shape[1]
    x = np.arange(n) / n
    y *= np.where(x < 0.3, (x / 0.3) ** 1.5, np.exp(-(x - 0.3) / 0.25)) * 0.45
    t = np.arange(n) / SR
    drop = np.sin(2 * np.pi * np.cumsum(180 * 2 ** (-2.2 * x)) / SR) * np.exp(-t / 0.35) * 0.35
    out = y + _pan(drop, 0.0)
    return out * env_ar(n, 0.002, 0.05)


def s_glass() -> np.ndarray:
    """The orb catching the light: a quick five-note glass cluster in E (E5 G#5 B5 D#6 E6)."""
    out = np.zeros((2, int(2.2 * SR)))
    for j, (m, pn) in enumerate(zip([76, 80, 83, 87, 88], [-0.4, 0.3, -0.15, 0.45, 0.0])):
        _mixin(out, j * 0.035, bell_fm(m, 2.0, decay=0.9, index=1.3, idecay=0.12), 0.32 - 0.03 * j, pan=pn)
    return out


def s_tag(name: str = "") -> np.ndarray:
    """A price tag landing (or turning over): a paper flick, a soft thock and a short tone that climbs
    through E major across the three tags."""
    i = _seq_index("tag", name)
    r = _hrng("tag", name)
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    flick = bp(r.standard_normal(n), 1800, 7000) * np.exp(-t / 0.012) * 0.35
    thock = np.sin(2 * np.pi * np.cumsum(140 + 160 * np.exp(-t / 0.01)) / SR) * np.exp(-t / 0.05) * 0.45
    tone = _ding([76, 80, 83][i % 3] + (12 if name.startswith("flip") else 0), 0.16, 3.0, 0.8, sec=0.5) * 0.5
    y = flick + thock
    y[: len(tone)] += tone[:n]
    return y * env_ar(n, 0.0005, 0.05)


def s_rise(name: str = "") -> np.ndarray:
    """A bar growing: a soft tone gliding up and swelling. The tall bar climbs an octave and a fifth;
    the short one barely moves."""
    big = "cold" not in name
    sec = 1.6 if big else 0.6
    n = int(sec * SR)
    x = np.arange(n) / n
    span = 19 if big else 3
    ph = 2 * np.pi * np.cumsum(hz(64) * 2 ** (span / 12 * x ** 1.3)) / SR
    y = (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)) * (0.2 + 0.8 * x ** 1.2)
    y *= env_ar(n, 0.03, 0.12) * (0.32 if big else 0.22)
    out = np.zeros((2, n + int(1.2 * SR)))
    _mixin(out, 0.0, y, 1.0)
    if big:
        _mixin(out, sec - 0.03, bell_fm(83, 1.2, decay=0.5, index=1.0, idecay=0.08), 0.3, pan=0.15)
    return out


def s_ghost() -> np.ndarray:
    """A job ad turning into a ghost: a breathy, detuned flicker that drifts down and fades."""
    sec = 1.1
    n = int(sec * SR)
    t = np.arange(n) / SR
    glide = 2 ** (-0.35 * t / sec)
    a = np.sin(2 * np.pi * np.cumsum(hz(81) * glide) / SR)
    b = np.sin(2 * np.pi * np.cumsum(hz(81) * 1.012 * glide) / SR)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 9 * t) ** 2
    breath = lp(hp(_hrng("ghost").standard_normal(n), 1500), 6000) * 0.25
    y = (0.5 * (a + b) * trem + breath) * np.exp(-t / 0.45) * env_ar(n, 0.04, 0.2)
    return np.stack([y, np.roll(y, int(0.012 * SR))]) * 0.4



SFX = {
    "swoosh": (s_swoosh, 0.35),
    "tick": (s_tick, 0.28),
    "tick2": (lambda: np.concatenate([s_tick(2000), s_tick(2700)]), 0.28),
    "low": (s_low, 0.5),
    "strike": (s_strike, 0.5),
    "scramble": (s_scramble, 0.35),
    "block": (s_block, 0.4),
    "stamp": (s_stamp, 0.5),
    "pop": (s_pop, 0.35),
    "empty": (s_empty, 0.6),
    "count": (s_count, 0.35),
    "glitch": (s_glitch, 0.45),
    "error": (s_error, 0.55),
    "chime": (s_chime, 0.5),
    "shimmer": (s_shimmer, 0.5),
    "impact": (None, 0.0),  # handled in the music bus
    # Holly OS UI sounds
    "notify": (s_notify, 0.17),
    "tap": (s_tap, 0.5),
    "sheet": (s_sheet, 0.16),
    "sent": (s_sent, 0.27),
    "confetti": (s_confetti, 0.31),
    "ring": (s_ring, 0.45),
    "sparkle": (s_sparkle, 0.28),
    "check": (s_check, 0.27),
    # See
    "suck": (s_suck, 0.45),
    "glass": (s_glass, 0.4),
    "tag": (s_tag, 0.42),
    "rise": (s_rise, 0.5),
    "ghost": (s_ghost, 0.5),
}

# Per-film replacements for a shared kind (other films get SFX unchanged). Holly's
# shimmer is retuned to its key; its swoosh / pop are only levelled for its bus.
SFX_VARIANT = {
    "holly": {"shimmer": (s_shimmer_holly, 0.42), "swoosh": (s_swoosh, 0.5), "pop": (s_pop, 0.55)},
    "see": {"swoosh": (s_swoosh, 0.42), "pop": (s_pop, 0.45), "count": (s_count, 0.26), "low": (s_low, 0.5), "tick": (s_tick, 0.22)},
    "see-white": {"swoosh": (s_swoosh, 0.4), "pop": (s_pop, 0.45), "count": (s_count, 0.26), "scramble": (s_scramble, 0.22), "tick": (s_tick, 0.22)},
    "see-tech": {"swoosh": (s_swoosh, 0.26), "pop": (s_pop, 0.32), "count": (s_count, 0.2), "tick": (s_tick, 0.16), "chime": (s_chime, 0.28)},
    "see-pitch": {"swoosh": (s_swoosh, 0.36), "pop": (s_pop, 0.42), "count": (s_count, 0.24), "tick": (s_tick, 0.22), "low": (s_low, 0.45), "chime": (s_chime, 0.32), "confetti": (s_confetti, 0.24)},
}
for _v in ("seeker", "seeker-ko", "seeker-es", "seeker-zh", "seeker-ja", "seeker-vi"):
    SFX_VARIANT[_v] = {"swoosh": (s_swoosh, 0.26), "pop": (s_pop, 0.3), "count": (s_count, 0.18), "tick": (s_tick, 0.16), "tap": (s_tap, 0.34),
                       "sparkle": (s_sparkle, 0.2), "chime": (s_chime, 0.24), "sent": (s_sent, 0.22), "rise": (s_rise, 0.3)}
for _v in ("tahoe-ph1", "tahoe-ph2", "tahoe-ph3"):
    SFX_VARIANT[_v] = {"swoosh": (s_swoosh, 0.34), "pop": (s_pop, 0.4), "count": (s_count, 0.24), "tick": (s_tick, 0.2), "tap": (s_tap, 0.42),
                       "sparkle": (s_sparkle, 0.24), "check": (s_check, 0.25), "chime": (s_chime, 0.3), "sent": (s_sent, 0.24), "rise": (s_rise, 0.4)}



def compose_music_traceshield() -> np.ndarray:
    """The TraceShield talk film (15 min): a quiet bed under the narration that follows the story.
    D minor for the vault and the tells (a slow wood-tick clock while the host watches), a soft heartbeat under
    the heist, a lift to F major for the poker face, a hard cut to a low drone on "Almost." with a slow pulse
    through the twist, a sparse bed under the price, and a D-major bloom on "Bring the dealer to your table"
    that carries the resolution, the receipts and the close."""
    def cue(sid, k):
        sc = SCENES[sid]
        return (sc["from"] + sc["cues"][k]["frame"]) / FPS

    pads, low, bells, drums, air = (Bus(DUR) for _ in range(5))
    V = {"Dm": ([50, 57, 62, 65, 69], 38), "Bb": ([46, 53, 58, 62, 65], 34), "Gm": ([43, 50, 55, 58, 62], 31),
         "A": ([45, 52, 57, 61, 64], 33), "Asus": ([45, 52, 57, 62, 64], 33), "F": ([41, 48, 53, 57, 60], 29),
         "C": ([48, 52, 55, 60, 64], 36), "D": ([50, 57, 62, 66, 69], 38), "G": ([43, 50, 55, 59, 62], 31),
         "Bm": ([47, 54, 59, 62, 66], 35), "Dlow": ([38, 45, 50, 53], 26)}

    def chords(t0, t1, cycle, bar, cutoff, amp=0.62, vox=0.0, seed=0, bass=0.13, tail=1.4, sweep=None):
        t, k = t0, 0
        while t < t1 - 0.4:
            notes, root = V[cycle[k % len(cycle)]]
            ln = min(bar, t1 - t)
            last = t + bar >= t1 - 0.4
            pads.add(t, warm_pad(notes, ln + (tail if not last or tail else 0.05), cutoff=cutoff, attack=1.6 if k else 2.4,
                                 release=1.5 if tail else 0.08, sweep=sweep, seed=seed + k), amp)
            if vox:
                pads.add(t, vox_pad(notes[1:], ln + (tail if tail else 0.05), attack=1.8, release=1.5 if tail else 0.08, seed=seed + k), vox)
            low.add(t, sub_bass(root, ln + (0.6 if tail else 0.02), attack=0.9, release=1.0 if tail else 0.02), bass)
            t += bar
            k += 1

    a2, a3, a4 = scene_t("v06_poker"), scene_t("v10_attack"), scene_t("v14_face")
    t_almost = cue("v18_twist", 0)
    t_cut = t_almost - 0.25
    a6 = scene_t("v22_cost")
    t_bloom = cue("v24_dealer", 2)
    t_end = cue("v27_end", 2)

    # Act I and II: the vault, the tells. Dark pads, a bell at each scene's first line.
    chords(0.0, a3, ["Dm", "Bb", "Gm", "Asus"], 9.6, 620, seed=10)
    for sid in [k for k in SCENES if k < "v10"]:
        bells.add(cue(sid, 0), bell_fm(74 if sid < "v06" else 69, 3.0, decay=1.4, index=1.0, idecay=0.3), 0.10, pan=-0.2)
    # the host watching: a slow wood clock through the tells
    t, k = a2 + 0.5, 0
    while t < a3 - 0.5:
        bells.add(t, tick_wood(1661.2 if k % 2 == 0 else 1479.98, seed=k), 0.028, pan=-0.3 if k % 2 == 0 else 0.3)
        t += 1.25
        k += 1
    # Act III: the heist. Same key, a little brighter, a soft heartbeat.
    chords(a3, a4, ["Dm", "Gm", "Bb", "A"], 9.6, 900, seed=30, vox=0.10)
    beat = a3 + 0.4
    while beat < a4 - 0.6:
        drums.add(beat, soft_kick(f_end=36.7, decay=0.16, click=0.02), 0.20)
        drums.add(beat + 0.24, soft_kick(f_end=36.7, decay=0.12, click=0.01), 0.11)
        beat += 60 / 62
    # Act IV: the poker face. Relative major, bells rolling up each bar; it ends dead on the cut.
    chords(a4, t_cut, ["F", "C", "Dm", "Bb"], 7.2, 1500, seed=50, vox=0.18, tail=0)
    arp = {"F": [65, 69, 72, 77], "C": [64, 67, 72, 76], "Dm": [62, 65, 69, 74], "Bb": [62, 65, 70, 74]}
    t, k = a4, 0
    while t < t_cut - 0.6:
        name = ["F", "C", "Dm", "Bb"][k % 4]
        for j, m in enumerate(arp[name]):
            tn = t + j * 0.6
            if tn < t_cut - 0.3:
                bells.add(tn, bell_fm(m + 12, 1.6, decay=0.6, index=1.1, idecay=0.1), 0.07, pan=0.3 if j % 2 else -0.3)
        t += 7.2
        k += 1
    # Act V: "Almost." The room empties to a drone and a slow pulse until the price.
    drone_end = a6
    pads.add(t_almost + 0.35, warm_pad(V["Dlow"][0], drone_end - t_almost, cutoff=360, attack=2.5, release=2.0, sweep=(700, 2.0), seed=70), 0.55)
    low.add(t_almost + 0.35, sub_bass(26, drone_end - t_almost - 0.3, attack=1.5, release=1.8), 0.16)
    beat = t_almost + 2.0
    while beat < drone_end - 1.0:
        drums.add(beat, soft_kick(f_end=34.6, decay=0.18, click=0.015), 0.22)
        drums.add(beat + 0.26, soft_kick(f_end=34.6, decay=0.12, click=0.01), 0.12)
        beat += 60 / 52
    bells.add(cue("v19_outside", 1), bell_fm(63, 4.0, decay=1.8, index=2.0, idecay=0.4), 0.09, pan=0.2)  # the OPEN reveal
    # Act VI: the price. Sparse and low.
    chords(a6, t_bloom - 1.0, ["Gm", "Asus", "Dm", "Asus"], 9.6, 500, seed=80, amp=0.5, bass=0.1)
    # Act VII: the dealer comes to the table. A reverse swell into a D-major bloom, then a warm groove to the end.
    bloom = np.zeros((2, int(5.0 * SR)))
    for j, (m, pn) in enumerate(zip([62, 69, 74, 78, 81, 86], [-0.45, 0.35, -0.2, 0.5, -0.5, 0.2])):
        _mixin(bloom, j * 0.035, bell_fm(m, 4.8, decay=1.6, index=1.4, idecay=0.35), 0.42 - 0.03 * j, pan=pn)
    air.add(t_bloom - 1.0, reverse_swell(bloom, 1.0), 0.38)
    bells.add(t_bloom, bloom, 0.42)
    low.add(t_bloom, impact(0.6)[: int(2.0 * SR)] * 0.5, 0.25)
    air.add(t_bloom, air_wash(3.5, decay=0.9, seed=21), 0.12)
    chords(t_bloom, t_end, ["D", "Bm", "G", "A"], 7.2, 1800, seed=90, vox=0.22, amp=0.6)
    kick = t_bloom + 7.2
    while kick < t_end - 1.0:
        drums.add(kick, soft_kick(f_end=36.7), 0.16)
        kick += 1.5
    t, k = t_bloom + 7.2, 0
    top = [74, 78, 81, 78, 76, 74, 73, 76]
    while t < t_end - 2.0:
        bells.add(t, bell_fm(top[k % 8] + 12, 1.8, decay=0.7, index=1.2, idecay=0.12), 0.06, pan=0.25 if k % 2 else -0.25)
        t += 1.8
        k += 1
    # the close: a long D major chord with its ninth, ringing out under "thank you"
    tail = DUR - t_end
    pads.add(t_end, warm_pad([50, 57, 62, 66, 69, 76], tail + 0.3, cutoff=2400, attack=1.2, release=tail * 0.6, seed=99), 0.8)
    pads.add(t_end, vox_pad([62, 66, 69, 76], tail + 0.3, attack=1.5, release=tail * 0.6, bright=1.2, seed=99), 0.3)
    low.add(t_end, sub_bass(38, tail - 0.5, attack=0.4, release=tail * 0.5), 0.16)
    casc = np.zeros((2, int(4.0 * SR)))
    for j, m in enumerate([86, 81, 78, 74, 69, 66, 62]):
        _mixin(casc, j * 0.16, bell_fm(m, 3.0, decay=1.1, index=1.4, idecay=0.2), 0.26 * (1 - 0.06 * j), pan=0.5 - 0.15 * j)
    bells.add(t_end + 0.3, casc, 0.8)

    x = pads.x + low.x + bells.x + drums.x + air.x
    x = x + 0.3 * reverb(0.5 * pads.x + bells.x + 0.7 * air.x + 0.08 * drums.x, seconds=2.8, damp=5200)
    x = hp(x[:, :N], 22)
    # the hard cut on "Almost.": everything stops for a breath before the drone comes in
    i0, i1, i2 = int(t_cut * SR), int((t_cut + 0.12) * SR), int((t_almost + 0.35) * SR)
    x[:, i0:i1] *= np.cos(np.linspace(0, np.pi / 2, i1 - i0)) ** 2
    x[:, i1:i2] = 0.0
    fade = int(2.5 * SR)
    x[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    return x


def compose_music_azdive() -> np.ndarray:
    """The 30-minute architecture film: a soft, drum-free bed under the narration. D major throughout, with each
    chapter in its own chord colour (Bm9, Gmaj7, Em9, F#m7 around Dmaj9), warm pads, a faint choir, a quiet sub and
    sparse bells; a soft rising bell figure as each chapter dives into the map, and a long D-major chord with a bell
    cascade under the close. Built chapter by chapter (reverb per segment, float32 output) so 30 minutes fits in
    memory on a 16 GB laptop."""
    V = {"D9": ([50, 57, 62, 66, 69, 76], 38), "Bm9": ([47, 54, 59, 62, 66, 73], 35), "G7": ([43, 50, 55, 59, 62, 66], 31),
         "Asus": ([45, 52, 57, 59, 64], 33), "Em9": ([40, 47, 52, 55, 59, 66], 28), "Fm7": ([42, 49, 54, 57, 61], 30)}
    plan = [("c0_open", ["D9", "Asus", "Bm9", "G7"], 820, 0.06), ("c1_context", ["G7", "D9", "Asus", "Bm9"], 1000, 0.08),
            ("c2_sources", ["Bm9", "G7", "D9", "Asus"], 900, 0.07), ("c3_why_logical", ["Em9", "G7", "D9", "Asus"], 860, 0.07),
            ("c4_surface", ["D9", "Fm7", "G7", "Asus"], 1100, 0.09), ("c5_embed", ["G7", "Asus", "Fm7", "Bm9"], 950, 0.08),
            ("c6_approach", ["Bm9", "G7", "D9", "Asus"], 900, 0.08), ("c6_ips", ["D9", "Asus", "Em9", "G7"], 1050, 0.09),
            ("c7_security", ["G7", "D9", "Em9", "Asus"], 950, 0.08), ("c8_next", ["D9", "Bm9", "G7", "Asus"], 1200, 0.1)]
    sc = SCENES["c8_end"]
    t_end = (sc["from"] + sc["cues"][4]["frame"]) / FPS
    starts = [scene_t(p[0]) for p in plan]
    ends = starts[1:] + [t_end]
    out = np.zeros((2, N + SR * 10), dtype=np.float32)

    def put(t0, x):
        i0 = int(round(t0 * SR))
        n = min(x.shape[1], out.shape[1] - i0)
        out[:, i0:i0 + n] += x[:, :n].astype(np.float32)

    for k, (sid, cycle, cutoff, vox) in enumerate(plan):
        seg = ends[k] - starts[k]
        pads, bells = Bus(seg + 4), Bus(seg + 4)
        t, j, bar = 0.0, 0, 9.6
        while t < seg - 0.4:
            notes, root = V[cycle[j % len(cycle)]]
            ln = min(bar, seg - t)
            pads.add(t, warm_pad(notes, ln + 1.6, cutoff=cutoff, attack=2.2 if j == 0 else 1.6, release=1.6, seed=100 * k + j), 0.55)
            pads.add(t, vox_pad(notes[1:], ln + 1.6, attack=2.0, release=1.6, seed=100 * k + j), vox)
            pads.add(t, sub_bass(root, ln + 0.8, attack=1.0, release=1.2), 0.1)
            if j % 2 == 1 and t + 4.8 < seg - 1.0:
                bells.add(t + 4.8, bell_fm(notes[-1] + 12, 3.0, decay=1.4, index=1.0, idecay=0.3), 0.035, pan=0.25 if j % 4 == 1 else -0.25)
            t += bar
            j += 1
        if k > 0:  # the dive into the map: a soft rising figure on the chapter's first chord
            first = V[cycle[0]][0]
            for q, m in enumerate(first[-3:]):
                bells.add(0.9 + q * 0.32, bell_fm(m + 12, 2.6, decay=1.2, index=1.1, idecay=0.25), 0.06, pan=-0.3 + 0.3 * q)
        x = pads.x + bells.x
        x = x + 0.3 * reverb(0.5 * pads.x + bells.x, seconds=3.0, damp=5000)
        put(starts[k], hp(x, 22))
        del pads, bells, x
    # the close: a long D major with its ninth, and a bell cascade under "Thanks for watching"
    tail = DUR - t_end
    close, bells = Bus(tail + 4), Bus(tail + 4)
    close.add(0, warm_pad([50, 57, 62, 66, 69, 76], tail + 0.3, cutoff=2400, attack=1.2, release=tail * 0.6, seed=999), 0.8)
    close.add(0, vox_pad([62, 66, 69, 76], tail + 0.3, attack=1.5, release=tail * 0.6, bright=1.2, seed=999), 0.3)
    close.add(0, sub_bass(38, tail - 0.5, attack=0.4, release=tail * 0.5), 0.12)
    for q, m in enumerate([86, 81, 78, 74, 69, 66, 62]):
        bells.add(0.3 + q * 0.16, bell_fm(m, 3.0, decay=1.1, index=1.4, idecay=0.2), 0.2 * (1 - 0.06 * q), pan=0.5 - 0.15 * q)
    x = close.x + bells.x
    put(t_end, hp(x + 0.3 * reverb(0.5 * close.x + bells.x, seconds=3.0, damp=5200), 22))
    y = out[:, :N]
    fi, fo = int(2.0 * SR), int(2.5 * SR)
    y[:, :fi] *= (np.sin(np.linspace(0, np.pi / 2, fi)) ** 2).astype(np.float32)
    y[:, -fo:] *= (np.cos(np.linspace(0, np.pi / 2, fo)) ** 2).astype(np.float32)
    return y


def compose_sfx_azdive() -> np.ndarray:
    """The film's few sounds (a shimmer as each chapter dives, a chime at the close), each with its own short
    reverb tail, into one float32 buffer instead of a full-length float64 bus."""
    out = np.zeros((2, N), dtype=np.float32)
    table = {**SFX, **SFX_VARIANT.get(VARIANT, {})}
    for sid, events in EV.items():
        if sid.startswith("_"):
            continue
        for name, e in events.items():
            kind = e.get("sfx")
            if not kind:
                continue
            fn, amp = table[kind]
            t = event_t(sid, name)
            sig = _sfx_call(fn, sid=sid, name=name, t=t)
            b = Bus(sig.shape[-1] / SR + 2.5)
            b.add(0, sig, amp)
            y = b.x + 0.22 * reverb(b.x, seconds=1.8)
            i0 = int(round(t * SR))
            n = min(y.shape[1], N - i0)
            if n > 0:
                out[:, i0:i0 + n] += y[:, :n].astype(np.float32)
    return out


# ─────────────────────────────────────────────────────────────────── Instagram reels (reel-*), 30 s, D major
# Six scenes (hook, problem, stat, reveal, feature, cta). A wry marimba line for the hook; the problem pulls back to a
# ticking clock; the stat builds; the logo lands on a bell bloom and starts the groove (D A Bm G); the end card gets
# a three-note sound logo and a long D major bloom. One beat grid for the whole film, counted from the logo.
R_CHORDS = {  # name: (pad voicing, bass root, arpeggio notes)
    "D": ([62, 66, 69, 76], 38, [74, 78, 81, 85, 86]),
    "A": ([61, 64, 69, 73], 33, [73, 76, 81, 83, 85]),
    "Bm": ([59, 62, 66, 69], 35, [71, 74, 78, 81, 83]),
    "G": ([59, 62, 66, 67], 31, [71, 74, 79, 83, 86]),
}
R_CYCLE = ["D", "A", "Bm", "G"]
R_HOOK = [81, None, 78, 74, None, 76, 74, None, 81, None, 78, 74, None, 76, 78, None]  # a shrug, then a question


def compose_music_reel() -> np.ndarray:
    t_prob, t_stat, t_feat = scene_t("problem"), scene_t("stat"), scene_t("feature")
    t_mark = event_t("reveal", "mark")
    t_end = event_t("cta", "lockup")
    span = t_end - t_mark
    bars = max(1, round(span * 112 / 240))
    while 240 * bars / span > 128 and bars > 1:
        bars -= 1
    while 240 * bars / span < 96:
        bars += 1
    bpm = 240 * bars / span
    beat = 60 / bpm
    bar = 4 * beat
    keys, pads, low, bells, drums, air = (Bus(DUR) for _ in range(6))
    hits = []

    # ── before the logo: the same grid, counted back from the mark
    k = -int(np.floor(t_mark / beat))
    while k < 0:
        tk = t_mark + k * beat
        k += 1
        if tk < 0.0:
            continue
        pos = (k - 1) % 4  # beat in the bar (the mark is a downbeat)
        if tk < t_prob:  # hook: Bm7 -> G under a marimba shrug, light kick, snaps
            if pos == 0:
                name = "Bm" if ((k - 1) // 4) % 2 == 0 else "G"
                pads.add(tk, warm_pad(R_CHORDS[name][0], bar + 0.3, cutoff=950, attack=0.08 if tk < 0.1 else 0.3, release=0.4, seed=400 + k), 0.36)
                low.add(tk, sub_bass(R_CHORDS[name][1] + 12, bar * 0.9, attack=0.02, release=0.1), 0.14)
            if pos in (0, 2):
                drums.add(tk, soft_kick(f_end=36.7, decay=0.16), 0.34)
                hits.append((tk, 0.25))
            if pos in (1, 3):
                drums.add(tk, clap(seed=k), 0.12, pan=0.1)
            for e in range(2):
                te = tk + e * beat / 2
                if te >= t_prob - 0.05:
                    continue
                m = R_HOOK[(((k - 1) % 8) * 2 + e) % 16]
                if m is not None:
                    bells.add(te, marimba(m, 0.7, hard=0.75), 0.22, pan=-0.3 if e else 0.3)
                drums.add(te, shaker(0.3, seed=k * 2 + e), 0.03, pan=0.3)
        elif tk < t_stat:  # problem: the clock, a low Bm, the kick only on the one
            keys.add(tk, tick_wood(1760 if pos % 2 == 0 else 1320, seed=k), 0.15, pan=0.2 if pos % 2 else -0.2)
            if pos == 0:
                pads.add(tk, warm_pad(R_CHORDS["Bm"][0], bar + 0.3, cutoff=600, attack=0.25, release=0.5, seed=420 + k), 0.4)
                low.add(tk, sub_bass(35, bar * 0.95, attack=0.05, release=0.15), 0.2)
                drums.add(tk, soft_kick(f_end=34.65, decay=0.2), 0.3)
                hits.append((tk, 0.3))
        else:  # stat: G -> A on felt piano, a kick on every beat that grows, the shaker comes in
            g = (tk - t_stat) / max(0.1, t_mark - t_stat)
            if pos == 0:
                name = "G" if ((k - 1) // 4) % 2 == 0 else "A"
                for i, m in enumerate(R_CHORDS[name][0]):
                    keys.add(tk + 0.012 * i, felt_piano(m + 12, 2.4, vel=0.55, sustain=bar * 0.95), 0.18, pan=-0.3 + 0.2 * i)
                pads.add(tk, warm_pad(R_CHORDS[name][0], bar + 0.3, cutoff=900 + 1200 * g, attack=0.2, release=0.3, seed=440 + k), 0.4)
                low.add(tk, sub_bass(R_CHORDS[name][1] + 12, bar * 0.95, attack=0.02, release=0.1), 0.18)
            if tk < t_mark - 0.3:
                drums.add(tk, soft_kick(f_end=34.65), 0.28 + 0.2 * g)
                hits.append((tk, 0.25 + 0.15 * g))
                for q in range(2 if g < 0.5 else 4):
                    tq = tk + q * beat / (2 if g < 0.5 else 4)
                    drums.add(tq, shaker(0.5, seed=k * 4 + q), 0.04 + 0.03 * g, pan=0.3)
    # the build into the logo: a riser and a reverse swell
    rise = min(1.6, t_mark - t_stat)
    air.add(t_mark - rise, _noise_sweep(rise, 400, 7000, width=0.9, curve=1.5, seed=61) * env_ar(int(rise * SR), rise * 0.9, 0.02), 0.08)

    # ── the logo: a D major bell bloom out of a reverse swell, an impact, then the groove
    bloom = np.zeros((2, int(4.4 * SR)))
    for j, (m, pn) in enumerate(zip([62, 69, 74, 78, 81, 86], [-0.45, 0.35, -0.2, 0.5, -0.5, 0.2])):
        _mixin(bloom, j * 0.03, bell_fm(m, 4.2, decay=1.4, index=1.4, idecay=0.3), 0.5 - 0.03 * j, pan=pn)
    air.add(t_mark - 0.45, reverse_swell(bloom, 0.45), 0.3)
    bells.add(t_mark, bloom, 0.4)
    low.add(t_mark, impact(0.8)[: int(1.8 * SR)] * 0.5, 0.34)
    air.add(t_mark, air_wash(2.4, decay=0.7, seed=62), 0.12)

    for b in range(bars):
        tb = t_mark + b * bar
        name = R_CYCLE[b % 4]
        voicing, root, arp = R_CHORDS[name]
        lv = 1 if tb + 0.05 >= t_feat else 0
        pads.add(tb, warm_pad(voicing, bar + 0.3, cutoff=(1700, 2600)[lv], attack=0.05, release=0.3, seed=460 + b), 0.62)
        if lv:
            pads.add(tb, vox_pad([m + 12 for m in voicing[:3]], bar + 0.3, attack=0.2, release=0.3, bright=1.1, seed=b), 0.2)
        for i, m in enumerate(voicing):
            keys.add(tb + 0.01 * i, felt_piano(m + 12, 2.0, vel=0.6, sustain=bar * 0.9), 0.12, pan=-0.3 + 0.2 * i)
        for pos, d, up in ((0, 2.6, 0), (3, 0.9, 0), (4, 1.8, 0), (7, 0.85, 12)):
            low.add(tb + pos * beat / 2, sub_bass(root + up, d * beat / 2, attack=0.008, release=0.05), 0.12 if up else 0.24)
        for e in range(8):
            bells.add(tb + e * beat / 2, pluck(arp[[0, 2, 1, 3, 4, 3, 2, 1][e]], 0.9, decay=0.35, bright=0.85), 0.13 * H_ACCENT[e] * (1.1 if lv else 0.9), pan=0.35 if e % 2 else -0.35)
        for q in range(4):
            tq = tb + q * beat
            drums.add(tq, soft_kick(f_end=36.7), 0.5 + 0.06 * lv)
            hits.append((tq, 0.38 + 0.04 * lv))
            if q in (1, 3):
                drums.add(tq, clap(seed=b * 4 + q), 0.26 + 0.04 * lv, pan=0.1)
            for s in range(4):
                r = _hrng("reel-shake", b, q, s)
                drums.add(tq + s * beat / 4 + r.uniform(-0.003, 0.003), shaker(0.6, seed=b * 16 + q * 4 + s), 0.05 * (0.4, 0.2, 0.75, 0.25)[s] * r.uniform(0.85, 1.1), pan=0.3)
    # a bell top line once the job cards come in
    t_cards = event_t("feature", "cards")
    tb3 = t_mark + int(np.ceil((t_cards - t_mark) / bar - 1e-6)) * bar - bar / 2
    for pos, m, v in [(0, 86, 1.0), (2, 85, 0.8), (3, 81, 0.75), (4, 83, 0.9), (6, 81, 0.7), (7, 78, 0.75)]:
        te = tb3 + pos * beat / 2
        if t_cards - 0.1 <= te < t_end - 0.1:
            add_echo(bells, te, bell_fm(m, 1.8, decay=0.7, index=1.6, idecay=0.14), 0.18 * v, pan=0.1)

    # ── end card: bell cascade into the lockup, a three-note sound logo (A, D, F#), a Dmaj9 bloom that rings out
    casc = np.zeros((2, int(3.6 * SR)))
    for j, m in enumerate([93, 90, 86, 85, 81, 78, 74]):
        _mixin(casc, j * beat / 4, bell_fm(m, 2.4, decay=0.9, index=1.5, idecay=0.18), 0.28 * (1 - 0.05 * j), pan=0.55 - 0.18 * j)
    air.add(t_end - 0.8, reverse_swell(casc, 0.8), 0.36)
    bells.add(t_end, casc, 0.85)
    for j, m in enumerate([81, 86, 90]):
        add_echo(bells, t_end + 0.9 + j * beat / 2, bell_fm(m, 2.6, decay=1.1, index=1.3, idecay=0.16), 0.3 * (1.15 if j == 2 else 1), pan=-0.25 + 0.25 * j)
    tail = max(0.5, DUR - t_end)
    rel = min(3.0, (tail + 0.3) * 0.75)
    pads.add(t_end, warm_pad([50, 57, 62, 66, 69, 76], tail + 0.3, cutoff=2600, attack=0.1, release=rel, seed=481), 1.0)
    pads.add(t_end, vox_pad([62, 66, 69, 73, 76], tail + 0.3, attack=0.4, release=rel, bright=1.2, seed=481), 0.32)
    for i, m in enumerate([62, 69, 74, 78, 81]):
        keys.add(t_end + 0.02 * i, felt_piano(m, tail + 0.5, vel=0.6), 0.2, pan=-0.3 + 0.15 * i)
    low.add(t_end, sub_bass(38, tail - 0.3, attack=0.02, release=min(2.0, (tail - 0.3) * 0.7)), 0.2)
    low.add(t_end, impact(0.6)[: int(1.6 * SR)] * 0.5, 0.2)
    air.add(t_end, air_wash(3.6, decay=1.1, seed=63), 0.14)

    sc_curve = sidechain(pads.x.shape[1], hits)
    x = keys.x + pads.x * sc_curve + low.x * sc_curve + bells.x + drums.x + air.x
    x = x + 0.28 * reverb(0.5 * pads.x + keys.x + bells.x + 0.6 * air.x + 0.08 * drums.x, seconds=2.4, damp=5200)
    x = hp(x[:, :N], 22)
    # a breath before the logo: everything but the riser dips for a moment
    i0, i1, i2 = int((t_mark - 0.32) * SR), int((t_mark - 0.12) * SR), int(t_mark * SR)
    g = np.ones(x.shape[1])
    g[i0:i1] = np.linspace(1, 0.25, i1 - i0)
    g[i1:i2] = 0.25
    x = x * g
    fade = int(1.0 * SR)
    x[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    print(f"reel score: {bpm:.2f} BPM, {bars} bars from the logo ({t_mark:.2f}s) to the end card ({t_end:.2f}s)")
    return x


if VARIANT.startswith("reel-"):
    SFX_VARIANT[VARIANT] = {"swoosh": (s_swoosh, 0.3), "pop": (s_pop, 0.34), "count": (s_count, 0.2), "tick": (s_tick, 0.18), "tap": (s_tap, 0.38),
                            "sparkle": (s_sparkle, 0.22), "rise": (s_rise, 0.3), "notify": (s_notify, 0.2), "check": (s_check, 0.28),
                            "low": (s_low, 0.42), "shimmer": (s_shimmer, 0.26)}


def _sfx_call(fn, **ctx) -> np.ndarray:
    """Call an SFX generator with only the event context (sid, name, t) its signature
    asks for; the original no-argument generators are called exactly as before."""
    params = inspect.signature(fn).parameters
    return fn(**{k: v for k, v in ctx.items() if k in params})


def compose_sfx() -> np.ndarray:
    fx = Bus(DUR)
    table = {**SFX, **SFX_VARIANT.get(VARIANT, {})}
    for sid, events in EV.items():
        if sid.startswith("_"):
            continue
        for name, e in events.items():
            kind = e.get("sfx")
            if not kind or (kind != "type" and table[kind][0] is None):
                continue
            t = event_t(sid, name)
            if kind == "type":
                for c in range(e["count"]):
                    fx.add(t + c * e["every"] / FPS, s_type_click(), rng.uniform(0.12, 0.2), pan=rng.uniform(-0.2, 0.2))
                continue
            fn, amp = table[kind]
            for c in range(e.get("count", 1)):  # a run of the same sound (pins popping in, one every `every` frames)
                fx.add(t + c * e.get("every", 0) / FPS, _sfx_call(fn, sid=sid, name=name, t=t), amp * (1 if c == 0 else 0.8), pan=rng.uniform(-0.25, 0.25))
    x = fx.x[:, :N]
    return x + 0.22 * reverb(x, seconds=1.8)


# The Nov 2026 reel series (front-page, seen, plainly, home, form, night, blueprint, their -ko and -sohee twins): one music
# style per reel in score_reels.py; Fresh keeps compose_music_reel.
import score_reels  # noqa: E402

REEL_STYLE = VARIANT.startswith("reel-") and VARIANT.removeprefix("reel-").removesuffix("-sohee").removesuffix("-ko") in score_reels.STYLES

if __name__ == "__main__":
    out = HERE / "build" / VARIANT
    out.mkdir(parents=True, exist_ok=True)
    m = (
        compose_music_trace() if VARIANT == "trace"
        else compose_music_tahoe() if VARIANT in ("tahoe", "tahoe-korean")
        else compose_music_unparse() if VARIANT == "unparse"
        else compose_music_pitchdeck() if VARIANT == "pitchdeck"
        else compose_music_holly() if VARIANT == "holly"
        else compose_music_see() if VARIANT == "see"
        else compose_music_see_white() if VARIANT == "see-white"
        else compose_music_see_pitch() if VARIANT == "see-pitch"
        else compose_music_see_tech() if VARIANT == "see-tech"
        else compose_music_tahoe_ph() if VARIANT.startswith("tahoe-ph")
        else compose_music_traceshield() if VARIANT == "traceshield"
        else compose_music_azdive() if VARIANT == "azdive"
        else compose_music_seeker() if (VARIANT == "seeker" or VARIANT.startswith("seeker-"))
        else score_reels.compose(sys.modules[__name__], VARIANT) if REEL_STYLE
        else compose_music_reel() if VARIANT.startswith("reel-")
        else compose_music()
    )
    s = compose_sfx_azdive() if VARIANT == "azdive" else compose_sfx()
    peak = max(np.abs(m).max(), 1e-9)
    sf.write(out / "music.wav", (m / peak * 0.7).T.astype(np.float32), SR, subtype="FLOAT")
    sf.write(out / "sfx.wav", (s / max(np.abs(s).max(), 1e-9) * 0.7).T.astype(np.float32), SR, subtype="FLOAT")
    if VARIANT == "holly":
        title, bpm = "s02_reveal", H_BPM
    elif VARIANT == "see":
        title, bpm = "s05_reveal", S_BPM
    elif VARIANT == "see-white":
        title, bpm = "w07_reveal", S_BPM
    elif VARIANT == "see-pitch":
        title, bpm = "p06_reveal", S_BPM
    elif VARIANT == "see-tech":
        title, bpm = "k16_close", S_BPM
    elif VARIANT.startswith("tahoe-ph"):
        title, bpm = T_ROLES[VARIANT]["logo"], T_BPM
    elif VARIANT == "traceshield":
        title, bpm = "v24_dealer", 72
    elif VARIANT == "azdive":
        title, bpm = "c8_end", 60
    elif (VARIANT == "seeker" or VARIANT.startswith("seeker-")):
        print(f"music + sfx: {DUR:.1f}s, logo at {event_t('s04_reveal', 'mark'):.2f}s, end mark at {event_t('s10_end', 'mark'):.2f}s")
        sys.exit(0)
    elif REEL_STYLE:
        print(f"music + sfx: {DUR:.1f}s")
        sys.exit(0)
    elif VARIANT.startswith("reel-"):
        print(f"music + sfx: {DUR:.1f}s, logo at {event_t('reveal', 'mark'):.2f}s, end card at {event_t('cta', 'lockup'):.2f}s")
        sys.exit(0)
    else:
        title = "t06_title" if VARIANT == "trace" else "s01_title" if VARIANT == "pitchdeck" else "s03_title"
        bpm = BPM
    print(f"music + sfx: {DUR:.1f}s at {bpm} BPM, impact at {event_t(title, 'impact'):.2f}s")
