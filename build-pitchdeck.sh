#!/usr/bin/env bash
# Investor pitch deck film, end to end: af_bella narration -> timeline -> score + SFX -> mix -> both renders -> posters.
# Writes only its own files (src/pitchdeck/timeline.json, public/pitchdeck/, audio/build/pitchdeck/, out/*PitchDeck*),
# so the other films are untouched.
#   ./build-pitchdeck.sh                 generated score
#   ./build-pitchdeck.sh --music x.mp3   licensed track instead
#   VOICE=bf_emma ./build-pitchdeck.sh   different narrator
set -euo pipefail
cd "$(dirname "$0")"
PY=audio/.venv/bin/python
VOICE=${VOICE:-af_bella}
[ -x "$PY" ] && [ -f audio/models/kokoro-v1.0.onnx ] || { echo "run ./build.sh once first to set up the voice engine"; exit 1; }
[ -d node_modules ] || npm install

(cd audio && ../$PY tts.py --variant pitchdeck --script script-pitchdeck.json --voice "$VOICE" --speed 0.95 && ../$PY score.py --variant pitchdeck && ../$PY mix.py --variant pitchdeck "$@")
npm run render:pitchdeck:16x9
npm run render:pitchdeck:9x16

mid=$(node -e 'const t=require("./src/pitchdeck/timeline.json");const s=t.scenes.find(x=>x.id==="s01_title");console.log(s.from+s.durationInFrames-20)')
npx remotion still PitchDeck-16x9 out/poster-pitchdeck-16x9.png --frame="$mid"
npx remotion still PitchDeck-9x16 out/poster-pitchdeck-9x16.png --frame="$mid"
echo "Done: out/PitchDeck-16x9.mp4, out/PitchDeck-9x16.mp4, out/poster-pitchdeck-*.png, out/captions-pitchdeck.srt"
