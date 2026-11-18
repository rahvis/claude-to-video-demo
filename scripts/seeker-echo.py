"""Echo check for the Tahoe job-seeker film (adapted from scripts/see-tech-echo.py): on-screen text must not spell
out the narration.

Samples the rendered film once a second, OCRs each frame with tesseract (eng, or the film's language + eng), and
compares the text with the narration words spoken within +/-2.5 s (word times from the film's timeline.json, which
come from Whisper's alignment). Any run of three or more consecutive narration words that also appears on screen, in
order, is reported; Chinese and Japanese have no spaces, so for them it is any six characters in a row. The non-English
models live in audio/build/tessdata (fetched by build-seeker.sh from tesseract-ocr/tessdata_fast).

Usage: python3 scripts/seeker-echo.py out/Tahoe-JobSeekers-EN-16x9.mp4 --lang en
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
video = sys.argv[1]
lang = sys.argv[sys.argv.index("--lang") + 1] if "--lang" in sys.argv else "en"
every = float(sys.argv[sys.argv.index("--every") + 1]) if "--every" in sys.argv else 1.0
variant = sys.argv[sys.argv.index("--variant") + 1] if "--variant" in sys.argv else ("seeker" if lang == "en" else f"seeker-{lang}")
tl = json.loads((ROOT / f"src/{variant}/timeline.json").read_text())
CJK = lang in ("zh", "ja")
TESS = {"en": "eng", "ko": "kor+eng", "es": "spa+eng", "zh": "chi_sim+eng", "ja": "jpn+eng", "vi": "vie+eng"}[lang]
fps = tl["fps"]


def norm(w: str) -> str:
    w = w.lower().replace("’", "'")
    if lang == "ko":
        return re.sub(r"[^0-9a-z\uac00-\ud7a3%]", "", w)
    if CJK:
        return re.sub(r"[^0-9a-z\u3040-\u30ff\u4e00-\u9fff]", "", w)
    return re.sub(r"[^\w%]", "", w).strip("_")


words = []  # (time, normalised word)
for s in tl["scenes"]:
    for c in s["cues"]:
        for w in c["words"]:
            n = norm(w["text"])
            if n:
                words.append(((s["from"] + w["frame"]) / fps, n))
dur = tl["durationInFrames"] / fps

tmp = Path(tempfile.mkdtemp(prefix="seeker-echo-"))
subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps=1/{every}", str(tmp / "f%05d.png")], check=True)
frames = sorted(tmp.glob("f*.png"))
env = dict(os.environ)
if lang != "en":
    env["TESSDATA_PREFIX"] = str(ROOT / "audio/build/tessdata")


def ocr(p):
    cmd = ["tesseract", str(p), "-", "--psm", "11", "-l", TESS]
    out = subprocess.run(cmd, capture_output=True, text=True, env=env).stdout
    return [norm(w) for w in out.split() if norm(w)]


with ThreadPoolExecutor(6) as ex:
    texts = list(ex.map(ocr, frames))

hits = []
for k, toks in enumerate(texts):
    t = (k + 0.5) * every
    near = [w for (tw, w) in words if abs(tw - t) <= 2.5]
    screen = " " + " ".join(toks) + " "
    if CJK:  # no spaces: any 6 characters of the narration in a row, also in a row on screen
        said, seen_txt = "".join(near), "".join(toks)
        for i in range(len(said) - 5):
            if said[i:i + 6] in seen_txt:
                hits.append((t, said[i:i + 6]))
        continue
    for i in range(len(near) - 2):
        tri = near[i:i + 3]
        if lang in ("en", "es", "vi") and all(len(x) <= 2 for x in tri):
            continue  # "is it a": function words only
        if f" {' '.join(tri)} " in screen:
            hits.append((t, " ".join(tri)))
for p in frames:
    p.unlink()
tmp.rmdir()
seen = set()
for t, tri in hits:
    key = (int(t // 5), tri)
    if key not in seen:
        seen.add(key)
        m, s = divmod(t, 60)
        print(f"{int(m):02d}:{s:04.1f}  '{tri}'")
print(f"{len(seen)} echo(es) in {len(frames)} frames ({dur:.0f} s), {lang}")
sys.exit(1 if seen else 0)
