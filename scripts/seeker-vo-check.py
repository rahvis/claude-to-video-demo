"""Narration check for the Tahoe job-seeker film: every line, cut from the finished mix (music and effects in), must
be heard right by Whisper. English: faster-whisper small.en, word match >= 0.9 and "Tahoe" heard as Tahoe. Other
languages: audio/tts_qwen.py's measures (Korean characters, Spanish and Vietnamese words, Chinese pinyin with tones,
Japanese kana), >= 0.85 (Vietnamese 0.8: tone marks make it the strictest), judged by large-v3-turbo and then small,
each with and without silence around the line; a line passes when one of them hears it exactly. Each model has its
own blind spots on the made-up brand and on short clips, while a real mispronunciation fails all of them.

Usage (from CCI/video):  audio/.venv-qwen/bin/python scripts/seeker-vo-check.py --lang en [file.mp4|mix.wav]
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "audio"))
import tts_qwen as Q  # noqa: E402

lang = sys.argv[sys.argv.index("--lang") + 1] if "--lang" in sys.argv else "en"
v = "seeker" if lang == "en" else f"seeker-{lang}"
if "--variant" in sys.argv:  # another film in the same pipeline (e.g. reel-fresh)
    v = sys.argv[sys.argv.index("--variant") + 1]
args = [a for a in sys.argv[1:] if not a.startswith("--") and a not in ("en", "ko", "es", "zh", "ja", "vi", v) and "whisper" not in a and not a.startswith(("large", "medium", "small", "turbo"))]
src = Path(args[0]) if args else ROOT / f"public/{v}/mix.wav"
tl = json.loads((ROOT / f"src/{v}/timeline.json").read_text())
script = json.loads((ROOT / f"audio/script-{v}.json").read_text())
says = {(sc["id"], i): ph.get("say", ph["text"]) for sc in script["scenes"] for i, ph in enumerate(sc["phrases"])}
language = {"en": "english", "ko": "korean", "es": "spanish", "zh": "chinese", "ja": "japanese", "vi": "vietnamese"}[lang]

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(src), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.float32)
# Judges, tried in order until one hears the line exactly (at the threshold). Each Whisper has its own blind spots on
# a made-up brand and on short clips (small misreads short Japanese and Vietnamese lines and flips on 0.25 s of
# padding; turbo writes 타호 as 타올 and 천 건 as 1000권), while a real mispronunciation fails all of them.
# English: small.en (it knows "Tahoe"). --model NAME uses that one model only.
if "--model" in sys.argv:
    names = [sys.argv[sys.argv.index("--model") + 1]]
else:
    names = ["small.en"] if lang == "en" else ["large-v3-turbo", "small"]
JUDGES = [(n, padded) for n in names for padded in (True, False)]
_models = {}


def judge(name: str):
    if name not in _models:
        if name in ("small", "small.en"):
            _models[name] = Q.whisper(language)
        else:
            from faster_whisper import WhisperModel

            _models[name] = WhisperModel(name, device="cpu", compute_type="int8")
    return _models[name]


fps = tl["fps"]
# How a narrator says the brand, as Whisper spells it. Spanish has no English h, so "Tahoe" comes out with the Latin
# American j (/h/), which Whisper writes "Tajo"; in the Spanish film that word is the brand, not a misread.
BRAND_HEARD = {"es": re.compile(r"^taj[oó]([.,;:!?]*)$", re.I)}
NATIVE = {"하나": 1, "한": 1, "둘": 2, "두": 2, "셋": 3, "세": 3, "넷": 4, "네": 4, "다섯": 5, "여섯": 6, "일곱": 7, "여덟": 8, "아홉": 9, "열": 10}


def counted(text: str) -> str:
    """Native Korean counts before a counter word ("다섯 건") as digits, the way Whisper writes them."""
    import re

    return re.sub(r"(하나|한|둘|두|셋|세|넷|네|다섯|여섯|일곱|여덟|아홉|열)\s*(건|명|개|곳)", lambda m: f"{NATIVE[m.group(1)]}{m.group(2)}", text)


starts = [(s["from"] + c["frame"]) / fps for s in tl["scenes"] for c in s["cues"]]
bad = 0
for s in tl["scenes"]:
    for i, c in enumerate(s["cues"]):
        t0 = (s["from"] + c["frame"]) / fps
        t1 = (s["from"] + c["endFrame"]) / fps
        nxt = min([x for x in starts if x > t0 + 0.01], default=1e9)
        a = int(max(0, t0 - 0.15) * 16000)
        b = int(min(t1 + 0.25, nxt - 0.03) * 16000)
        said = says[(s["id"], i)]
        need = 0.9 if lang == "en" else 0.85 if lang in ("ko", "es", "zh", "ja") else 0.8
        best = None
        for name, padded in JUDGES:
            # padded: silence around the line, as the take scorer hears takes
            x = np.concatenate([np.zeros(4000, np.float32), audio[a:b], np.zeros(8000, np.float32)]) if padded else audio[a:b]
            segs, _ = judge(name).transcribe(x, language=lang, beam_size=5, condition_on_previous_text=False, vad_filter=False)
            # Whisper writes the feature name as one word ("AutoApply"); the script says "auto apply"
            heard = [[w, 0, 0] for seg in segs for w in re.sub(r"(?i)\bauto-?apply", "auto apply", seg.text).split()]
            if lang in BRAND_HEARD:
                heard = [[BRAND_HEARD[lang].sub(r"Tahoe\1", w), 0, 0] for w, _, _ in heard]
            if lang == "en":  # Whisper's spelling of a plural can carry an apostrophe ("evening's", "companies'")
                said, heard = said.replace("'", "").replace("’", ""), [[w.replace("'", "").replace("’", ""), 0, 0] for w, _, _ in heard]
            m = Q.match(counted(said) if lang == "ko" else said, heard, language)
            brand = lang == "en" and "tahoe" in said.lower() and "tahoe" not in " ".join(w[0] for w in heard).lower()
            ok = m >= need and not brand
            if best is None or ok or m > best[0]:
                best = (m, heard, f"{name}{' padded' if padded else ''}")
            if ok:
                break
        m, heard, by = best
        flag = not ok
        bad += flag
        print(f"{'FAIL' if flag else 'ok  '} {s['id']}.{i} {m:.2f}  said: {said}\n          heard: {' '.join(w[0] for w in heard)}  ({by})")
print(f"{bad} line(s) failed in {src.name}")
sys.exit(1 if bad else 0)
