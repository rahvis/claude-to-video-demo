"""Mix narration, score and sound effects into public/mix.wav.

The music is ducked under the voice with an envelope follower on the narration,
then the whole mix is loudness-normalised (two-pass ffmpeg loudnorm) to
-14 LUFS integrated, -1 dBTP, the common target for web and social video.

Usage:
  .venv/bin/python mix.py                      # uses audio/build/music.wav from score.py
  .venv/bin/python mix.py --music track.mp3    # swap in a licensed track instead
"""

import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import lfilter, resample_poly

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SR = 48000


def db(x: float) -> float:
    return 10 ** (x / 20)


def active_rms(x: np.ndarray) -> float:
    mono = x if x.ndim == 1 else x.mean(axis=0)
    win = int(0.05 * SR)
    frames = mono[: len(mono) // win * win].reshape(-1, win)
    r = np.sqrt((frames**2).mean(axis=1))
    loud = r[r > r.max() * 0.1]
    return float(np.sqrt((loud**2).mean())) if len(loud) else 1e-9


def decode(path: Path, n: int) -> np.ndarray:
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-ar", str(SR), "-ac", "2", tmp.name], check=True)
        x, _ = sf.read(tmp.name, dtype="float64")
    x = x.T[:, :n]
    if x.shape[1] < n:
        x = np.pad(x, ((0, 0), (0, n - x.shape[1])))
    fade = int(2.0 * SR)
    x[:, -fade:] *= np.linspace(1, 0, fade)
    return x


def eq_music(x: np.ndarray) -> np.ndarray:
    """Clear sub rumble and carve a little room under the voice (200-300 Hz)."""
    with tempfile.TemporaryDirectory() as d:
        a, b = Path(d) / "in.wav", Path(d) / "out.wav"
        sf.write(a, x.T.astype(np.float32), SR, subtype="FLOAT")
        flt = "highpass=f=38:poles=2,highpass=f=38:poles=2,equalizer=f=260:t=q:w=1.1:g=-3.5"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a), "-af", flt, "-c:a", "pcm_f32le", str(b)], check=True)
        y, _ = sf.read(b, dtype="float64")
    return y.T[:, : x.shape[1]]


def duck_gain(vo: np.ndarray, depth_db: float = -6.0) -> np.ndarray:
    """Smooth gain curve that dips the music while the narrator speaks."""
    env = np.abs(vo)
    win = int(0.03 * SR)
    env = np.convolve(env, np.ones(win) / win, mode="same")
    on = np.clip(env / (env.max() * 0.06), 0, 1)
    a = np.exp(-1 / (0.25 * SR))
    smooth = lfilter([1 - a], [1, -a], on)
    smooth = np.maximum(smooth, lfilter([1 - a], [1, -a], on[::-1])[::-1] * 0.9)  # anticipate onsets slightly
    return 1 - (1 - db(depth_db)) * np.clip(smooth * 1.4, 0, 1)


def loudnorm(src: Path, dst: Path, target: float = -14.0, tp: float = -1.0) -> dict:
    flt = f"loudnorm=I={target}:TP={tp}:LRA=11"
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(src), "-af", flt + ":print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    )
    m = json.loads(re.findall(r"\{[^{}]*\}", p.stderr)[-1])
    flt2 = (
        f"{flt}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
        f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
    )
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", flt2, "-ar", str(SR), "-c:a", "pcm_s24le", str(dst)],
        check=True,
    )
    return m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--music", type=Path, help="licensed track to use instead of the generated score")
    ap.add_argument("--variant", default="", help="mix the variant's narration/stems into public/<v>/mix.wav")
    ap.add_argument("--tp", type=float, default=-1.0, help="true-peak ceiling in dBTP (lower leaves room for AAC overshoot)")
    args = ap.parse_args()
    build = HERE / "build" / args.variant
    vo_path = ROOT / f"public/{args.variant}/vo.wav" if args.variant else ROOT / "public/vo/vo.wav"
    mix_path = ROOT / "public" / args.variant / "mix.wav"

    vo, vsr = sf.read(vo_path, dtype="float64")
    vo = resample_poly(vo, SR, vsr)
    n = len(vo)
    sfx, _ = sf.read(build / "sfx.wav", dtype="float64")
    sfx = sfx.T[:, :n]
    music = decode(args.music, n) if args.music else sf.read(build / "music.wav", dtype="float64")[0].T[:, :n]

    music = eq_music(music)
    vo *= db(-18) / active_rms(vo)
    music *= db(-25 if not args.music else -27) / active_rms(music)
    sfx *= db(-16) / max(np.abs(sfx).max(), 1e-9)

    mix = np.stack([vo, vo]) + music * duck_gain(vo) + sfx
    peak = np.abs(mix).max()
    if peak > 0.98:
        mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.98

    raw = build / "mix-raw.wav"
    sf.write(raw, mix.T.astype(np.float32), SR, subtype="FLOAT")
    m = loudnorm(raw, mix_path, tp=args.tp)
    print(f"mixed {n / SR:.1f}s  (pre-norm {m['input_i']} LUFS, TP {m['input_tp']}) -> {mix_path.relative_to(ROOT)} at -14 LUFS")


if __name__ == "__main__":
    main()
