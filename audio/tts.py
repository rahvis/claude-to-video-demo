"""Render the voiceover phrase by phrase and derive the film's timeline from it.

Outputs:
  public/vo/vo.wav      full-length narration, each phrase placed on its cue frame
  src/timeline.json     scene starts, lengths and per-phrase cue frames (drives the edit)
  out/captions.srt      sidecar captions from the same timings

Usage:
  .venv/bin/python tts.py                 # build with the voice in script.json
  .venv/bin/python tts.py --voice am_michael --speed 0.95
  .venv/bin/python tts.py --samples       # only render out/voice-samples/*.wav
  .venv/bin/python tts.py --variant light --voice am_michael   # white edition, separate outputs
  .venv/bin/python tts.py --variant trace --script script-trace.json --voice af_bella   # Trace Privacy film
"""

import argparse
import hashlib
import re
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
CACHE = HERE / "cache"
SAMPLE_VOICES = ["af_heart", "am_michael", "bf_emma", "af_bella", "bm_george"]
SAMPLE_TEXT = "Introducing Conformal Confidential Inference. Not a disclaimer. A claim you can check."

_kokoro = None


def kokoro() -> Kokoro:
    global _kokoro
    if _kokoro is None:
        _kokoro = Kokoro(str(HERE / "models/kokoro-v1.0.onnx"), str(HERE / "models/voices-v1.0.bin"))
    return _kokoro


def trim(x: np.ndarray, sr: int, thresh_db: float = -42.0) -> np.ndarray:
    """Trim leading/trailing silence, keeping a few ms so consonants aren't clipped."""
    env = np.abs(x)
    win = max(1, int(sr * 0.01))
    env = np.convolve(env, np.ones(win) / win, mode="same")
    thresh = env.max() * 10 ** (thresh_db / 20)
    idx = np.where(env > thresh)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(sr * 0.015))
    b = min(len(x), idx[-1] + int(sr * 0.06))
    y = x[a:b].copy()
    f = int(sr * 0.008)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def synth(text: str, voice: str, speed: float) -> tuple[np.ndarray, int]:
    key = hashlib.sha1(f"{voice}|{speed}|{text}".encode()).hexdigest()[:16]
    path = CACHE / f"{key}.wav"
    if path.exists():
        x, sr = sf.read(path, dtype="float32")
        return x, sr
    x, sr = kokoro().create(text, voice=voice, speed=speed, lang="en-us")
    x = trim(np.asarray(x, dtype=np.float32), sr)
    CACHE.mkdir(exist_ok=True)
    sf.write(path, x, sr)
    return x, sr


def syllables(word: str) -> int:
    groups = re.findall(r"[aeiouy]+", word.lower())
    n = len(groups) - (1 if word.lower().endswith("e") and len(groups) > 1 else 0)
    return max(1, n)


def word_frames(text: str, frame: int, end: int) -> list[dict]:
    """Estimate where each word starts, weighting by syllables, with punctuation as a short beat."""
    words = text.split()
    weights = [syllables(w) + (0.8 if w[-1] in ",.;:" else 0) for w in words]
    total = sum(weights)
    out, acc = [], 0.0
    for w, wt in zip(words, weights):
        out.append({"text": w, "frame": frame + round((end - frame) * acc / total)})
        acc += wt
    return out


def srt_time(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def out_paths(variant: str) -> tuple[Path, Path, Path]:
    """(narration wav, timeline json, captions srt); a variant gets its own copies."""
    if variant:
        return ROOT / f"public/{variant}/vo.wav", ROOT / f"src/{variant}/timeline.json", ROOT / f"out/captions-{variant}.srt"
    return ROOT / "public/vo/vo.wav", ROOT / "src/timeline.json", ROOT / "out/captions.srt"


def build(voice: str, speed: float, variant: str = "", script_name: str = "script.json") -> None:
    vo_path, timeline_path, srt_path = out_paths(variant)
    script = json.loads((HERE / script_name).read_text())
    fps, gap, overlap = script["fps"], script["gap"], script["overlap_frames"]

    scenes, placed, captions = [], [], []
    start = 0
    sr = 24000
    for sc in script["scenes"]:
        t = sc["lead"]
        cues = []
        for ph in sc["phrases"]:
            x, sr = synth(ph["text"], voice, speed)
            frame = round(t * fps)
            dur = len(x) / sr
            end = frame + round(dur * fps)
            cues.append({"frame": frame, "endFrame": end, "text": ph["text"], "words": word_frames(ph["text"], frame, end)})
            placed.append(((start + frame) / fps, x))
            captions.append(((start + frame) / fps, (start + frame) / fps + dur, ph["text"]))
            t = frame / fps + dur + ph.get("pause", gap)
        length = round((t - gap + sc["tail"]) * fps)
        scenes.append({"id": sc["id"], "from": start, "durationInFrames": length, "cues": cues})
        start += length - overlap

    total = scenes[-1]["from"] + scenes[-1]["durationInFrames"]
    vo = np.zeros(int(total / fps * sr) + sr, dtype=np.float32)
    for at, x in placed:
        i = int(round(at * sr))
        vo[i : i + len(x)] += x
    vo = vo[: int(total / fps * sr)]

    vo_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(vo_path, vo, sr, subtype="PCM_24")
    timeline = {"fps": fps, "overlap": overlap, "durationInFrames": total, "voice": voice, "scenes": scenes}
    timeline_path.parent.mkdir(parents=True, exist_ok=True)
    timeline_path.write_text(json.dumps(timeline, indent=2))

    (ROOT / "out").mkdir(exist_ok=True)
    srt = "\n".join(
        f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{text}\n" for i, (a, b, text) in enumerate(captions, 1)
    )
    srt_path.write_text(srt)

    print(f"voice={voice} speed={speed}  total={total} frames ({total / fps:.1f}s)")
    for s in scenes:
        print(f"  {s['id']:<18} from {s['from']:>5}  len {s['durationInFrames']:>4}  cues {[c['frame'] for c in s['cues']]}")


def samples(speed: float) -> None:
    out = ROOT / "out/voice-samples"
    out.mkdir(parents=True, exist_ok=True)
    for v in SAMPLE_VOICES:
        x, sr = kokoro().create(SAMPLE_TEXT, voice=v, speed=speed, lang="en-us")
        sf.write(out / f"{v}.wav", trim(np.asarray(x, dtype=np.float32), sr), sr)
        print("wrote", out / f"{v}.wav")


if __name__ == "__main__":
    ap0 = argparse.ArgumentParser(add_help=False)
    ap0.add_argument("--script", default="script.json")
    cfg = json.loads((HERE / ap0.parse_known_args()[0].script).read_text())
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", default="script.json", help="narration script in audio/ (default script.json)")
    ap.add_argument("--voice", default=cfg["voice"])
    ap.add_argument("--speed", type=float, default=cfg["speed"])
    ap.add_argument("--samples", action="store_true")
    ap.add_argument("--variant", default="", help="write to public/<v>/, src/<v>/ and out/captions-<v>.srt")
    args = ap.parse_args()
    if args.samples:
        samples(args.speed)
    else:
        build(args.voice, args.speed, args.variant, args.script)
