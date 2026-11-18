#!/usr/bin/env bash
# One-time setup for the Instagram reel pipeline (REELS.md): everything a fresh clone needs to go from a prompt to
# out/Tahoe-Reel-<Name>-9x16.mp4. Safe to re-run: each step skips what is already there.
#
#   ./setup-reels.sh                       Node packages, Python envs, Qwen CustomVoice + Base, Whisper, OCR data
#   QWEN="CustomVoice Base VoiceDesign" ./setup-reels.sh    also the VoiceDesign model (to design a new voice)
#   QWEN=CustomVoice ./setup-reels.sh      only the Sohee / Korean voices (smallest download)
#
# Needs: a Mac with Apple Silicon (MLX runs the voice models), Homebrew, and
#   brew install node ffmpeg tesseract uv
# Disk: ~0.7 GB Node packages, ~1 GB Python envs, ~2.4 GB per Qwen checkpoint + 0.65 GB shared tokenizer,
#       ~2.5 GB Whisper models (in ~/.cache/huggingface), so about 9 GB with the default two checkpoints.
set -euo pipefail
cd "$(dirname "$0")"

QWEN=${QWEN:-"CustomVoice Base"}
# Qwen3-TTS 1.7B, 8-bit MLX conversions, pinned to the revisions the reels were made with (Apache-2.0).
rev() {
  case "$1" in
    Base) echo e7dd0585652209fa0d7783659aad4e8a324de11c ;;
    CustomVoice) echo 41d3337e8b7f2843a75841595fc14e4b9a7a4b96 ;;
    VoiceDesign) echo f90d617701d9f7f4ca499291e0b57f2b3c2fd2ee ;;
    *) echo "unknown Qwen model $1 (Base, CustomVoice or VoiceDesign)" >&2; exit 1 ;;
  esac
}
say() { printf "\n\033[1m== %s\033[0m\n" "$*"; }

say "Checking tools"
[ "$(uname -s)/$(uname -m)" = Darwin/arm64 ] || { echo "MLX needs a Mac with Apple Silicon (this is $(uname -s)/$(uname -m))"; exit 1; }
missing=()
for t in node npm ffmpeg ffprobe tesseract uv; do command -v $t >/dev/null || missing+=("$t"); done
[ ${#missing[@]} -eq 0 ] || { echo "missing: ${missing[*]}  ->  brew install node ffmpeg tesseract uv"; exit 1; }
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] || { echo "Node 20 or newer is needed"; exit 1; }
# grep -c reads all of ffmpeg's output (grep -q would exit early and trip pipefail)
[ "$(ffmpeg -hide_banner -filters 2>/dev/null | grep -c rubberband)" -gt 0 ] || echo "note: this ffmpeg has no rubberband filter; scripts with \"tempo\" other than 1.0 need it (Homebrew's ffmpeg has it)"
echo "ok: node $(node -v), $(ffmpeg -version | head -1 | cut -d' ' -f1-3), tesseract $(tesseract --version 2>&1 | head -1 | cut -d' ' -f2), $(uv --version)"
free=$(df -g . | awk 'NR==2 {print $4}')
echo "free disk: $free GB"
[ "$free" -ge 12 ] || [ -f audio/models/qwen3/CustomVoice-8bit/model.safetensors ] || echo "warning: a first setup needs about 9 GB plus room to build (15 GB free is comfortable)"

say "Node packages (Remotion)"
if [ -d node_modules/remotion ]; then echo "node_modules present"; else npm ci; fi
npx remotion browser ensure >/dev/null && echo "Remotion's headless Chrome is ready"

say "Python envs (uv, Python 3.12)"
# audio/.venv: music, mix, contact sheets. audio/.venv-qwen: Qwen3-TTS on MLX, Whisper checks, pitch analysis.
for pair in ".venv:requirements.txt" ".venv-qwen:requirements-qwen.txt"; do
  env=${pair%%:*}; req=${pair##*:}
  [ -x "audio/$env/bin/python" ] || uv venv -q -p 3.12 "audio/$env"
  uv pip install -q --python "audio/$env/bin/python" -r "audio/$req"
  echo "audio/$env: $(uv pip list --python "audio/$env/bin/python" 2>/dev/null | tail -n +3 | wc -l | tr -d ' ') packages"
done

say "Qwen3-TTS voice models: $QWEN"
HF=audio/.venv-qwen/bin/hf
mkdir -p audio/models/qwen3
tok=""  # the speech tokenizer is the same in every checkpoint: download it once, then APFS-clone it (no extra disk)
for m in Base CustomVoice VoiceDesign; do
  [ -f "audio/models/qwen3/$m-8bit/speech_tokenizer/model.safetensors" ] && tok="audio/models/qwen3/$m-8bit/speech_tokenizer"
done
for m in $QWEN; do
  dir="audio/models/qwen3/$m-8bit"
  if [ -f "$dir/model.safetensors" ]; then echo "$m: present"; continue; fi
  echo "$m: downloading (~2.4 GB) ..."
  if [ -n "$tok" ]; then
    "$HF" download "mlx-community/Qwen3-TTS-12Hz-1.7B-$m-8bit" --revision "$(rev "$m")" --local-dir "$dir" --exclude "speech_tokenizer/*" >/dev/null
    [ -d "$dir/speech_tokenizer" ] || cp -Rc "$tok" "$dir/speech_tokenizer"
  else
    "$HF" download "mlx-community/Qwen3-TTS-12Hz-1.7B-$m-8bit" --revision "$(rev "$m")" --local-dir "$dir" >/dev/null
    tok="$dir/speech_tokenizer"
  fi
  echo "$m: done"
done

say "Whisper models (narration checks)"
# small.en checks English takes and mixes; small and large-v3-turbo check Korean.
for repo in Systran/faster-whisper-small.en Systran/faster-whisper-small mobiuslabsgmbh/faster-whisper-large-v3-turbo; do
  "$HF" download "$repo" >/dev/null && echo "$repo: ready"
done

say "OCR data (on-screen text check)"
mkdir -p audio/build/tessdata
share="$(brew --prefix 2>/dev/null || echo /opt/homebrew)/share/tessdata"
for t in eng osd; do [ -f audio/build/tessdata/$t.traineddata ] || cp "$share/$t.traineddata" audio/build/tessdata/; done
[ -f audio/build/tessdata/kor.traineddata ] || curl -sSfL -o audio/build/tessdata/kor.traineddata \
  https://github.com/tesseract-ocr/tessdata_fast/raw/main/kor.traineddata
echo "tessdata: $(ls audio/build/tessdata | tr '\n' ' ')"

say "Done"
echo "Build a reel:   REEL=fresh-sohee ./build-reel.sh      (keys in src/reel/registry.ts)"
echo "Make a new one: see REELS.md (or ask Claude Code: \"make a 30 s reel about ...\")"
