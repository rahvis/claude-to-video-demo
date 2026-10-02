#!/usr/bin/env bash
# Trace Privacy film, end to end: af_bella narration -> timeline -> score + SFX -> mix -> both renders -> posters.
# Writes only its own files (src/trace/timeline.json, public/trace/, audio/build/trace/, out/*Trace*, out/*trace*),
# so the CCI films are untouched.
#   ./build-trace.sh                 generated score
#   ./build-trace.sh --music x.mp3   licensed track instead
#   VOICE=af_heart ./build-trace.sh  different narrator
set -euo pipefail
cd "$(dirname "$0")"
PY=audio/.venv/bin/python
VOICE=${VOICE:-af_bella}
[ -x "$PY" ] && [ -f audio/models/kokoro-v1.0.onnx ] || { echo "run ./build.sh once first to set up the voice engine"; exit 1; }
[ -d node_modules ] || npm install

(cd audio && ../$PY tts.py --variant trace --script script-trace.json --voice "$VOICE" && ../$PY score.py --variant trace && ../$PY mix.py --variant trace "$@")
npm run render:trace:16x9
npm run render:trace:9x16

mid=$(node -e 'const t=require("./src/trace/timeline.json");const s=t.scenes.find(x=>x.id==="t06_title");console.log(s.from+s.durationInFrames-30)')
npx remotion still Trace-16x9 out/poster-trace-16x9.png --frame="$mid"
npx remotion still Trace-9x16 out/poster-trace-9x16.png --frame="$mid"
echo "Done: out/Trace-16x9.mp4, out/Trace-9x16.mp4, out/poster-trace-*.png, out/captions-trace.srt"
