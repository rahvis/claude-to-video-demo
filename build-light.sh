#!/usr/bin/env bash
# White edition, end to end: am_michael narration -> timeline -> score + SFX -> mix -> both renders -> posters.
# Writes only its own files (src/light/timeline.json, public/light/, audio/build/light/, out/*light*),
# so the dark film is untouched.
#   ./build-light.sh                 generated score
#   ./build-light.sh --music x.mp3   licensed track instead
#   VOICE=af_heart ./build-light.sh  different narrator
set -euo pipefail
cd "$(dirname "$0")"
PY=audio/.venv/bin/python
VOICE=${VOICE:-am_michael}
[ -x "$PY" ] && [ -f audio/models/kokoro-v1.0.onnx ] || { echo "run ./build.sh once first to set up the voice engine"; exit 1; }
[ -d node_modules ] || npm install

(cd audio && ../$PY tts.py --variant light --voice "$VOICE" && ../$PY score.py --variant light && ../$PY mix.py --variant light "$@")
npm run render:light:16x9
npm run render:light:9x16

mid=$(node -e 'const t=require("./src/light/timeline.json");const s=t.scenes.find(x=>x.id==="s03_title");console.log(s.from+s.durationInFrames-30)')
npx remotion still CCI-Light-16x9 out/poster-light-16x9.png --frame="$mid"
npx remotion still CCI-Light-9x16 out/poster-light-9x16.png --frame="$mid"
echo "Done: out/CCI-light-16x9.mp4, out/CCI-light-9x16.mp4, out/poster-light-*.png, out/captions-light.srt"
