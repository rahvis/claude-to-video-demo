"""Music for the seven Tahoe reels of Nov 2026 (variants reel-<key> and reel-<key>-ko), one style per reel, so the
set never sounds like one template. Called from score.py with that module (`S`): its synths (warm_pad, felt_piano,
marimba, bell_fm, vox_pad, soft_kick, clap, shaker, snap, tick_wood, sub_bass, air_wash, reverb, Bus ...), its timeline
(scene_t, event_t, DUR, N, SR) and its rng.

Every style runs on one tempo grid anchored to the brand moment ("mark") with a whole number of bars from there to the
end card ("end"), so the downbeats land on the logo and the end card; the bars before the mark are counted back from
it. Each style's `beat(ctx)` adds whatever plays on one beat; a section switch (pre / post the mark, or a third
section) changes chords and parts.
"""
from dataclasses import dataclass, field
from typing import Callable

import numpy as np

# anchors per reel: the brand moment and the end card (scene, event); extra section starts where a style needs them
ANCHORS = {
    "front-page": {"mark": ("turn", "mark"), "end": ("close", "lockup")},
    "seen": {"mark": ("turn", "mark"), "end": ("close", "lockup"), "quiet": "silence"},
    "plainly": {"mark": ("friend", "mark"), "end": ("close", "lockup")},
    "home": {"mark": ("map", "mark"), "end": ("close", "lockup")},
    "form": {"mark": ("auto", "mark"), "end": ("close", "lockup")},
    "night": {"mark": ("shift", "mark"), "end": ("close", "lockup"), "dawn": "morning"},
    "blueprint": {"mark": ("resume", "mark"), "end": ("close", "lockup")},
}
TARGET_BPM = {"front-page": 100, "seen": 80, "plainly": 118, "home": 96, "form": 104, "night": 70, "blueprint": 112}


@dataclass
class Ctx:
    S: object
    bus: dict
    t: float  # beat time (s)
    k: int  # beat index from the mark (negative before it)
    pos: int  # beat in the bar, 0..3
    bar: int  # bar index from the mark (negative before it)
    beat: float  # seconds per beat
    section: str  # "pre", "post" or a style's own third section
    rng: np.random.Generator = field(default=None)


def _grid(t_mark: float, t_end: float, target: float) -> float:
    span = t_end - t_mark
    bars = max(1, round(span * target / 240))
    return 240 * bars / span


def _hit_mark(S, bus, t, big=1.0):
    """A soft downbeat swell on the brand moment: reverse air into a wash and a low thump."""
    bus["air"].add(t, S.air_wash(2.6, decay=0.9, seed=3), 0.5 * big)
    bus["drums"].add(t, S.soft_kick(f_end=41.2, decay=0.32), 0.42 * big)


# ---------------------------------------------------------------- 1. Front Page: a news bed

FP_PRE = [([50, 57, 62, 65], 38), ([46, 53, 58, 62], 34), ([53, 57, 60, 65], 41), ([48, 55, 60, 64], 36)]  # Dm Bb F C
FP_POST = [([53, 57, 60, 65], 41), ([48, 55, 60, 64], 36), ([50, 57, 62, 65], 38), ([46, 53, 58, 62], 34)]  # F C Dm Bb


def front_page(c: Ctx):
    S, b = c.S, c.bus
    prog = FP_PRE if c.section == "pre" else FP_POST
    pad, root = prog[c.bar % 4]
    if c.pos == 0:
        b["pad"].add(c.t, S.warm_pad(pad, 4 * c.beat + 0.3, cutoff=700 if c.section == "pre" else 1200, attack=0.2, release=0.4, seed=c.k), 0.3)
        b["low"].add(c.t, S.sub_bass(root, 4 * c.beat * 0.95, attack=0.01), 0.2)
    # the newsroom pulse: muted 16ths on the root and fifth, teletype ticks
    for e in range(4):
        te = c.t + e * c.beat / 4
        m = root + 24 + (7 if e == 2 else 0)
        b["keys"].add(te, S.marimba(m, 0.25, decay=0.07, hard=0.4), 0.16 if e else 0.22, pan=-0.2 if e % 2 else 0.2)
        if c.rng.uniform() < 0.55:
            b["drums"].add(te, S.tick_wood(2400 + 300 * c.rng.uniform(), seed=c.k * 4 + e), 0.035, pan=c.rng.uniform(-0.5, 0.5))
    if c.pos in (0, 2):
        b["drums"].add(c.t, S.soft_kick(f_end=36.7, decay=0.18), 0.26)
    if c.section == "post" and c.pos == 0:
        b["bells"].add(c.t, S.bell_fm(pad[-1] + 12, 1.6, decay=0.8, index=1.0), 0.12, pan=0.25)


# ---------------------------------------------------------------- 2. Seen: lo-fi

SE_PRE = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]  # Fmaj7 Em7 Dm7 Cmaj7
SE_POST = [[53, 57, 60, 64, 67], [55, 59, 62, 65], [52, 55, 59, 62], [48, 52, 55, 59, 62]]  # Fmaj9 G7 Em7 Cmaj9


def seen(c: Ctx):
    S, b = c.S, c.bus
    chords = SE_PRE if c.section == "pre" else SE_POST
    ch = chords[c.bar % 4]
    quiet = c.section == "quiet"
    if c.pos == 0:
        # lazy strum: notes a few ms apart, felt piano
        for j, m in enumerate(ch):
            b["keys"].add(c.t + 0.012 * j, S.felt_piano(m, 3.2, vel=0.38, sustain=4 * c.beat), 0.17, pan=(j - 2) * 0.12)
        b["low"].add(c.t, S.sub_bass(ch[0] - 12, 4 * c.beat * 0.9, attack=0.03), 0.17 if not quiet else 0.08)
    if c.pos == 2 and not quiet:
        b["keys"].add(c.t + c.beat * 0.55, S.felt_piano(ch[-1] + 12, 1.6, vel=0.3, sustain=1.0), 0.08, pan=0.3)
    if not quiet:
        swing = c.beat * 0.58
        if c.pos in (0, 2):
            b["drums"].add(c.t, S.soft_kick(f_end=43.65, decay=0.16, click=0.03), 0.3)
        if c.pos in (1, 3):
            b["drums"].add(c.t, S.snap(seed=c.k), 0.08, pan=0.15)
        b["drums"].add(c.t + swing, S.shaker(0.3, seed=c.k), 0.05, pan=-0.3)
        if c.section == "post":
            b["drums"].add(c.t, S.shaker(0.5, seed=c.k + 99), 0.05, pan=0.3)


# ---------------------------------------------------------------- 3. Say It Plainly: staccato pop

PL = [([60, 64, 67, 72], 36), ([59, 62, 67, 71], 43), ([57, 60, 64, 69], 45), ([57, 60, 65, 69], 41)]  # C G/B Am F
PL_HOOK = [72, None, 76, 79, None, 76, 74, None]


def plainly(c: Ctx):
    S, b = c.S, c.bus
    pad, root = PL[c.bar % 4]
    pre = c.section == "pre"
    b["drums"].add(c.t, S.soft_kick(f_end=43.65, decay=0.15), 0.36 if not pre else 0.22)
    if c.pos in (1, 3):
        b["drums"].add(c.t, S.clap(seed=c.k), 0.16)
    # off-beat stabs
    b["keys"].add(c.t + c.beat / 2, S.warm_pad(pad, 0.16, cutoff=3200, attack=0.004, release=0.07, seed=c.k), 0.36 if not pre else 0.22)
    b["low"].add(c.t, S.sub_bass(root, c.beat * 0.45, attack=0.005, release=0.05), 0.22)
    if not pre:
        for e in range(2):
            m = PL_HOOK[(c.pos * 2 + e) % 8]
            if m is not None:
                b["bells"].add(c.t + e * c.beat / 2, S.marimba(m, 0.6, hard=0.9), 0.17, pan=0.3 if e else -0.3)


# ---------------------------------------------------------------- 4. Close to Home: kalimba

HO = [([55, 59, 62, 67], 43), ([50, 54, 57, 62], 38), ([52, 55, 59, 64], 40), ([48, 52, 55, 60], 36)]  # G D Em C
HO_ARP = [0, 2, 1, 3, 2, 1, 3, 2]


def home(c: Ctx):
    S, b = c.S, c.bus
    pad, root = HO[c.bar % 4]
    post = c.section == "post"
    if c.pos == 0:
        b["pad"].add(c.t, S.warm_pad(pad, 4 * c.beat + 0.4, cutoff=1100, attack=0.4, release=0.6, seed=c.k), 0.2)
        b["low"].add(c.t, S.sub_bass(root, 4 * c.beat * 0.9, attack=0.03), 0.15)
    for e in range(2):
        i = HO_ARP[(c.pos * 2 + e) % 8]
        m = pad[i] + 12
        kal = S.bell_fm(m, 1.2, decay=0.45, ratio=5.4, index=0.6, idecay=0.05, body=0.6)
        b["bells"].add(c.t + e * c.beat / 2, kal, 0.13, pan=-0.35 + 0.7 * (i / 3))
    if post or c.pos == 0:
        b["drums"].add(c.t, S.soft_kick(f_end=49, decay=0.12, click=0.02), 0.2)
    if post:
        for e in range(2):
            b["drums"].add(c.t + e * c.beat / 2, S.shaker(0.4, seed=c.k * 2 + e), 0.06, pan=0.4)


# ---------------------------------------------------------------- 5. The Form: a ticking clock, then an open chord

FO_PRE = [[50, 53, 57, 61], [50, 53, 56, 60]]  # a tense D minor(maj7) wobble
FO_POST = [([62, 66, 69, 74, 76], 38), ([59, 62, 66, 71], 35), ([55, 59, 62, 67, 69], 43), ([57, 61, 64, 69], 45)]  # D Bm G A


def form(c: Ctx):
    S, b = c.S, c.bus
    if c.section == "pre":
        b["drums"].add(c.t, S.tick_wood(1600 if c.pos % 2 else 2000, seed=c.k), 0.14, pan=0.2)
        for e in range(4):
            if c.rng.uniform() < 0.7:
                b["drums"].add(c.t + (e + c.rng.uniform(-0.1, 0.1)) * c.beat / 4, S.s_type_click(), 0.07, pan=c.rng.uniform(-0.4, 0.4))
        if c.pos == 0:
            ch = FO_PRE[c.bar % 2]
            b["pad"].add(c.t, S.warm_pad(ch, 4 * c.beat + 0.3, cutoff=520, attack=0.3, release=0.3, seed=c.k), 0.26)
            b["low"].add(c.t, S.sub_bass(38, 4 * c.beat * 0.95, attack=0.02), 0.18)
        return
    pad, root = FO_POST[c.bar % 4]
    if c.pos == 0:
        b["pad"].add(c.t, S.warm_pad(pad, 4 * c.beat + 0.5, cutoff=1900, attack=0.15, release=0.6, seed=c.k), 0.26)
        b["low"].add(c.t, S.sub_bass(root, 4 * c.beat * 0.9, attack=0.02), 0.18)
    for e in range(2):
        m = pad[(c.pos * 2 + e) % len(pad)] + 12
        b["keys"].add(c.t + e * c.beat / 2, S.felt_piano(m, 1.8, vel=0.45, sustain=0.9), 0.12, pan=-0.25 if e else 0.25)
    if c.pos in (0, 2):
        b["drums"].add(c.t, S.soft_kick(f_end=36.7, decay=0.16), 0.26)
    if c.pos in (1, 3):
        b["drums"].add(c.t, S.snap(seed=c.k), 0.07, pan=-0.1)


# ---------------------------------------------------------------- 6. Night Shift: music box lullaby to dawn

NI_PRE = [([55, 58, 62], 43), ([51, 55, 58], 39), ([50, 53, 58], 46), ([53, 57, 60], 41)]  # Gm Eb Bb/D F
NI_POST = [([51, 55, 58, 62], 39), ([53, 57, 60, 65], 41), ([58, 62, 65, 69], 46), ([55, 58, 62, 65], 43)]  # Ebmaj7 F Bbmaj7 Gm7
NI_DAWN = [([58, 62, 65, 69, 72], 46), ([51, 55, 58, 62, 67], 39), ([53, 57, 60, 65, 69], 41), ([58, 62, 65, 70], 46)]  # Bb Eb F Bb
NI_TUNE = [74, 77, 74, 70, 72, 74, 72, 69]


def night(c: Ctx):
    S, b = c.S, c.bus
    prog = NI_PRE if c.section == "pre" else NI_DAWN if c.section == "dawn" else NI_POST
    pad, root = prog[c.bar % 4]
    if c.pos == 0:
        b["pad"].add(c.t, S.warm_pad(pad, 4 * c.beat + 0.8, cutoff=750 if c.section == "pre" else 1300, attack=0.9, release=1.0, seed=c.k), 0.26)
        b["low"].add(c.t, S.sub_bass(root, 4 * c.beat * 0.95, attack=0.2, release=0.4), 0.12)
        if c.section == "dawn":
            b["air"].add(c.t, S.vox_pad([m + 12 for m in pad[:3]], 4 * c.beat + 0.6, attack=1.2, release=1.2, seed=c.k), 0.14)
    # the music box: a slow tune, an octave up, a little uneven like a real comb
    m = NI_TUNE[(c.bar * 4 + c.pos) % 8] + (5 if c.section == "dawn" else 0)
    box = S.bell_fm(m + 12, 1.6, decay=0.55, ratio=4.0, index=0.9, idecay=0.04, body=0.2)
    b["bells"].add(c.t + c.rng.uniform(0, 0.012), box, 0.14, pan=0.2)
    if c.pos == 2:
        b["bells"].add(c.t + c.beat * 0.5, S.bell_fm(pad[1] + 24, 1.2, decay=0.4, ratio=4.0, index=0.7, idecay=0.04, body=0.2), 0.06, pan=-0.3)


# ---------------------------------------------------------------- 7. Blueprint: minimal arpeggios

BP_PRE = [([57, 60, 64, 67], 45), ([53, 57, 60, 64], 41), ([55, 59, 62, 67], 43), ([52, 55, 59, 64], 40)]  # Am7 Fmaj7 G Em7
BP_POST = [([60, 64, 67, 71], 36), ([57, 60, 64, 67], 45), ([53, 57, 60, 64], 41), ([55, 59, 62, 67], 43)]  # Cmaj7 Am7 Fmaj7 G
BP_ARP = [0, 1, 2, 3, 2, 1, 2, 3]


def blueprint(c: Ctx):
    S, b = c.S, c.bus
    pad, root = (BP_PRE if c.section == "pre" else BP_POST)[c.bar % 4]
    for e in range(4):
        i = BP_ARP[(c.pos * 4 + e) % 8]
        m = pad[i] + 12
        b["keys"].add(c.t + e * c.beat / 4, S.pluck(m, 0.5, decay=0.22, bright=0.7), 0.13 if e else 0.17, pan=-0.3 + 0.2 * i)
        b["drums"].add(c.t + e * c.beat / 4, S.hat(), 0.03 if e % 2 else 0.05, pan=0.35)
    if c.pos == 0:
        b["low"].add(c.t, S.sub_bass(root, 4 * c.beat * 0.9, attack=0.01), 0.2)
        b["pad"].add(c.t, S.warm_pad(pad, 4 * c.beat + 0.3, cutoff=900 if c.section == "pre" else 1500, attack=0.3, release=0.4, seed=c.k), 0.16)
    if c.section == "post" and c.pos in (0, 2):
        b["drums"].add(c.t, S.soft_kick(f_end=43.65, decay=0.14), 0.24)


STYLES: dict[str, Callable[[Ctx], None]] = {
    "front-page": front_page, "seen": seen, "plainly": plainly, "home": home, "form": form, "night": night, "blueprint": blueprint,
}
END_CHORD = {
    "front-page": [41, 53, 57, 60, 65, 69], "seen": [36, 48, 52, 55, 59, 62], "plainly": [36, 48, 55, 60, 64, 67],
    "home": [43, 55, 59, 62, 67, 71], "form": [38, 50, 57, 62, 66, 69, 76], "night": [46, 58, 62, 65, 69, 74],
    "blueprint": [36, 48, 55, 59, 64, 67],
}
LEVELS = {"pad": 1.0, "keys": 1.0, "bells": 1.0, "low": 1.0, "drums": 1.0, "air": 1.0}


def compose(S, variant: str) -> np.ndarray:
    key = variant.removeprefix("reel-").removesuffix("-sohee").removesuffix("-ko")
    a = ANCHORS[key]
    t_mark, t_end = S.event_t(*a["mark"]), S.event_t(*a["end"])
    bpm = _grid(t_mark, t_end, TARGET_BPM[key])
    beat = 60 / bpm
    bus = {k: S.Bus(S.DUR) for k in LEVELS}
    rng = np.random.default_rng(23)
    quiet = (S.scene_t(a["quiet"]), S.scene_t(a["quiet"]) + S.SCENES[a["quiet"]]["durationInFrames"] / S.FPS) if "quiet" in a else None
    dawn = S.scene_t(a["dawn"]) if "dawn" in a else None
    fn = STYLES[key]
    k = -int(np.floor(t_mark / beat))
    while True:
        t = t_mark + k * beat
        if t > t_end + 0.01:
            break
        if t >= 0:
            section = "pre" if t < t_mark - 0.01 else "post"
            if quiet and quiet[0] <= t < quiet[1]:
                section = "quiet"
            if dawn is not None and t >= dawn - 0.01:
                section = "dawn"
            fn(Ctx(S=S, bus=bus, t=t, k=k, pos=k % 4, bar=k // 4, beat=beat, section=section, rng=rng))
        k += 1
    _hit_mark(S, bus, t_mark, 1.0 if key != "night" else 0.5)
    # the end card: one long chord
    ch = END_CHORD[key]
    tail = max(1.0, S.DUR - t_end + 0.5)
    bus["pad"].add(t_end, S.warm_pad(ch[1:], tail, cutoff=1500, attack=0.05, release=min(2.0, tail * 0.6), seed=777), 0.34)
    bus["low"].add(t_end, S.sub_bass(ch[0], tail * 0.8, attack=0.02, release=1.0), 0.2)
    bus["bells"].add(t_end, S.bell_fm(ch[-1] + 12, 3.0, decay=1.4, index=1.0), 0.12)
    bus["air"].add(t_end, S.air_wash(3.0, decay=1.2, seed=5), 0.3)

    x = np.zeros((2, S.N))
    for name, bb in bus.items():
        y = bb.x[:, : S.N]
        wet = {"pad": 0.25, "keys": 0.3, "bells": 0.45, "low": 0.0, "drums": 0.12, "air": 0.5}[name]
        if wet:
            y = y + wet * S.reverb(y, seconds=2.2 if key != "night" else 3.4)
        x += LEVELS[name] * y
    fade = int(1.0 * S.SR)
    x[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    print(f"{variant} score ({key}): {bpm:.1f} BPM, mark {t_mark:.2f}s, end card {t_end:.2f}s")
    return x
