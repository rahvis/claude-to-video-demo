#!/usr/bin/env bash
# TahoeAI film, end to end: af_heart narration -> timeline -> score + SFX -> mix -> both renders -> posters.
# Writes only its own files (src/tahoe/timeline.json, public/tahoe/, audio/build/tahoe/, out/*Tahoe*),
# so the other films are untouched.
#   ./build-tahoe.sh                 generated score
#   ./build-tahoe.sh --music x.mp3   licensed track instead
#   VOICE=bf_emma ./build-tahoe.sh   different narrator
set -euo pipefail
cd "$(dirname "$0")"
PY=audio/.venv/bin/python
VOICE=${VOICE:-af_heart}
[ -x "$PY" ] && [ -f audio/models/kokoro-v1.0.onnx ] || { echo "run ./build.sh once first to set up the voice engine"; exit 1; }
[ -d node_modules ] || npm install

(cd audio && ../$PY tts.py --variant tahoe --script script-tahoe.json --voice "$VOICE" && ../$PY score.py --variant tahoe && ../$PY mix.py --variant tahoe "$@")
npm run render:tahoe:16x9
npm run render:tahoe:9x16

mid=$(node -e 'const t=require("./src/tahoe/timeline.json");const s=t.scenes.find(x=>x.id==="s03_title");console.log(s.from+s.durationInFrames-20)')
npx remotion still Tahoe-16x9 out/poster-tahoe-16x9.png --frame="$mid"
npx remotion still Tahoe-9x16 out/poster-tahoe-9x16.png --frame="$mid"
echo "Done: out/Tahoe-16x9.mp4, out/Tahoe-9x16.mp4, out/poster-tahoe-*.png, out/captions-tahoe.srt"
