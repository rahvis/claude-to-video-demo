#!/usr/bin/env bash
# Conformal Logit Inference film, end to end: af_bella narration -> timeline -> score + SFX -> mix -> both renders -> posters.
# Writes only its own files (src/unparse/timeline.json, public/unparse/, audio/build/unparse/, out/*Unparse*),
# so the other films are untouched.
#   ./build-unparse.sh                 generated score
#   ./build-unparse.sh --music x.mp3   licensed track instead
#   VOICE=bf_emma ./build-unparse.sh   different narrator
set -euo pipefail
cd "$(dirname "$0")"
PY=audio/.venv/bin/python
VOICE=${VOICE:-af_bella}
[ -x "$PY" ] && [ -f audio/models/kokoro-v1.0.onnx ] || { echo "run ./build.sh once first to set up the voice engine"; exit 1; }
[ -d node_modules ] || npm install

(cd audio && ../$PY tts.py --variant unparse --script script-unparse.json --voice "$VOICE" && ../$PY score.py --variant unparse && ../$PY mix.py --variant unparse "$@")
npm run render:unparse:16x9
npm run render:unparse:9x16

mid=$(node -e 'const t=require("./src/unparse/timeline.json");const s=t.scenes.find(x=>x.id==="s03_title");console.log(s.from+s.durationInFrames-20)')
npx remotion still Unparse-16x9 out/poster-unparse-16x9.png --frame="$mid"
npx remotion still Unparse-9x16 out/poster-unparse-9x16.png --frame="$mid"
echo "Done: out/Unparse-16x9.mp4, out/Unparse-9x16.mp4, out/poster-unparse-*.png, out/captions-unparse.srt"
