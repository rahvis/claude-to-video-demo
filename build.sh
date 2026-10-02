#!/usr/bin/env bash
# One command for the whole film: narration -> timeline -> score + SFX -> mix -> both renders -> posters.
#   ./build.sh                 generated score
#   ./build.sh --music x.mp3   licensed track instead
#   VOICE=am_michael ./build.sh
set -euo pipefail
cd "$(dirname "$0")"
PY=audio/.venv/bin/python

if [ ! -x "$PY" ]; then
  uv venv -p 3.12 audio/.venv
  uv pip install --python "$PY" kokoro-onnx soundfile numpy scipy
fi
if [ ! -f audio/models/kokoro-v1.0.onnx ]; then
  mkdir -p audio/models
  base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
  curl -sL -o audio/models/kokoro-v1.0.onnx "$base/kokoro-v1.0.onnx"
  curl -sL -o audio/models/voices-v1.0.bin "$base/voices-v1.0.bin"
fi
[ -d node_modules ] || npm install

(cd audio && ../$PY tts.py ${VOICE:+--voice "$VOICE"} && ../$PY score.py && ../$PY mix.py "$@")
npm run render:16x9
npm run render:9x16

mid=$(node -e 'const t=require("./src/timeline.json");const s=t.scenes.find(x=>x.id==="s03_title");console.log(s.from+s.durationInFrames-30)')
npx remotion still CCI-16x9 out/poster-16x9.png --frame="$mid"
npx remotion still CCI-9x16 out/poster-9x16.png --frame="$mid"
echo "Done: out/CCI-16x9.mp4, out/CCI-9x16.mp4, out/poster-*.png, out/captions.srt"
