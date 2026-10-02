"""Compose the film's original score and sound effects from the timeline.

Everything is synthesised here (no samples), so the result is royalty-free. The
arrangement is driven by src/timeline.json (scene starts) and src/events.json
(visual beats), so hits land on the frames the animation uses.

Outputs audio/build/music.wav and audio/build/sfx.wav (48 kHz stereo).
`--variant light` reads src/light/timeline.json and writes audio/build/light/.
`--variant trace` is the Trace Privacy film: its own beats (src/trace/events.json) and arrangement.
"""

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

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
        base = cue["words"][e["word"]]["frame"] if "word" in e else cue["frame"]
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
    beats (search, capture, match, outreach, analytics) before pulling back into
    the closing tagline and the WorkOnward lockup."""
    music = Bus(DUR)
    t_02 = scene_t("s02_shift")
    t_04, t_05, t_06 = scene_t("s04_search"), scene_t("s05_extension"), scene_t("s06_match")
    t_07, t_08, t_09 = scene_t("s07_outreach"), scene_t("s08_analytics"), scene_t("s09_promise")
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
    # as the product proves itself out (search -> capture -> match -> outreach -> analytics).
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
}


def compose_sfx() -> np.ndarray:
    fx = Bus(DUR)
    for sid, events in EV.items():
        if sid.startswith("_"):
            continue
        for name, e in events.items():
            kind = e.get("sfx")
            if not kind or (kind != "type" and SFX[kind][0] is None):
                continue
            t = event_t(sid, name)
            if kind == "type":
                for c in range(e["count"]):
                    fx.add(t + c * e["every"] / FPS, s_type_click(), rng.uniform(0.12, 0.2), pan=rng.uniform(-0.2, 0.2))
                continue
            fn, amp = SFX[kind]
            fx.add(t, fn(), amp, pan=rng.uniform(-0.25, 0.25))
    x = fx.x[:, :N]
    return x + 0.22 * reverb(x, seconds=1.8)


if __name__ == "__main__":
    out = HERE / "build" / VARIANT
    out.mkdir(parents=True, exist_ok=True)
    m = (
        compose_music_trace() if VARIANT == "trace"
        else compose_music_tahoe() if VARIANT == "tahoe"
        else compose_music_unparse() if VARIANT == "unparse"
        else compose_music_pitchdeck() if VARIANT == "pitchdeck"
        else compose_music()
    )
    s = compose_sfx()
    peak = max(np.abs(m).max(), 1e-9)
    sf.write(out / "music.wav", (m / peak * 0.7).T.astype(np.float32), SR, subtype="FLOAT")
    sf.write(out / "sfx.wav", (s / max(np.abs(s).max(), 1e-9) * 0.7).T.astype(np.float32), SR, subtype="FLOAT")
    title = "t06_title" if VARIANT == "trace" else "s01_title" if VARIANT == "pitchdeck" else "s03_title"
    print(f"music + sfx: {DUR:.1f}s at {BPM} BPM, impact at {event_t(title, 'impact'):.2f}s")
