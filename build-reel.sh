#!/usr/bin/env bash
# Instagram reels for Tahoe, 30 s, 9:16 (template in src/reel, one reel per src/reel-<key>; registry in src/reel/registry.ts).
# Guide: REELS.md. First time on a machine: ./setup-reels.sh (Node packages, Python envs, voice and Whisper models).
#   REEL=fresh ./build-reel.sh            narration, score, mix, checks, render
#   REEL=fresh REVIEW=1 ./build-reel.sh   audio, checks and review stills only (out/review-reel-<key>.png)
#   REEL=fresh VIDEO_ONLY=1 ./build-reel.sh   keep the current narration and mix (after a picture-only change)
#
# A new reel: audio/script-reel-<key>.json (six scenes: hook, problem, stat, reveal, feature, cta), then
# src/reel-<key>/scenes.tsx + events.json (beats on cue words, shared with the score), and one line in registry.ts.
# Narration: Qwen3-TTS 1.7B Base 8-bit (audio/tts_qwen.py) cloning the designed English voice
# (audio/voices/seeker-en-anchor-0.wav) at tempo 0.9; takes are cached in audio/cache/qwen. Only one ~2.4 GB Qwen
# checkpoint is kept on disk: if Base-8bit has no model.safetensors, run
#   audio/.venv-qwen/bin/hf download mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit model.safetensors --local-dir audio/models/qwen3/Base-8bit
# Music: score.py compose_music_reel (original, synthesised). Fonts and the cat mark: public/seeker/{fonts,brand}.
set -euo pipefail
cd "$(dirname "$0")"
# REELS=a,b,c builds several reels in a row (each with the same REVIEW / VIDEO_ONLY settings).
if [ -n "${REELS:-}" ]; then
  for r in ${REELS//,/ }; do REEL="$r" REELS= "$0"; done
  exit 0
fi
REEL=${REEL:-fresh}
V="reel-$REEL"
case "$REEL" in *-ko) LANG_CODE=ko ;; *) LANG_CODE=en ;; esac  # Korean twins end in -ko (Qwen CustomVoice, Sohee); English -sohee twins read the English copy in the same voice
NAME=$(echo "$REEL" | awk -F- '{for (i = 1; i <= NF; i++) printf "%s%s", toupper(substr($i, 1, 1)), substr($i, 2)}')  # fresh-male -> FreshMale
free_gb() { df -g /System/Volumes/Data | awk 'NR==2 {print $4}'; }
[ "$(free_gb)" -ge 2 ] || { echo "less than 2 GB free on the disk; free some space first"; exit 1; }

if [ "${VIDEO_ONLY:-0}" != 1 ]; then
  # Only one ~2.4 GB Qwen checkpoint fits on the disk: the script's own must have its weights.
  MODEL=$(node -e "console.log(require('./audio/script-$V.json').model)")
  if [ ! -f "audio/$MODEL/model.safetensors" ]; then
    repo=$(basename "$MODEL" | sed 's/-8bit$//')
    echo "audio/$MODEL has no model.safetensors. Run QWEN=$(basename "$MODEL" | sed 's/-8bit$//') ./setup-reels.sh, or:"
    echo "  audio/.venv-qwen/bin/hf download mlx-community/Qwen3-TTS-12Hz-1.7B-$repo-8bit model.safetensors --local-dir audio/$MODEL"
    exit 1
  fi
  (cd audio && .venv-qwen/bin/python tts_qwen.py --script "script-$V.json" --variant "$V")
  (cd audio && .venv/bin/python score.py --variant "$V" && .venv/bin/python mix.py --variant "$V" --tp -2.0)
  rm -f "audio/build/$V/mix-raw.wav"
  audio/.venv-qwen/bin/python scripts/seeker-vo-check.py --lang "$LANG_CODE" --variant "$V"
fi
[ -f "public/$V/mix.wav" ] || { echo "no public/$V/mix.wav: run without VIDEO_ONLY"; exit 1; }
frames=$(node -e "console.log(require('./src/$V/timeline.json').durationInFrames)")
# English reels stay within 30.5 s; Korean twins keep the natural length of their narration (user, 2026-11-18),
# capped only at 60 s.
cap=915; [ "$LANG_CODE" = ko ] && cap=1800
[ "$frames" -le "$cap" ] || { echo "$V runs $frames frames (over $cap): trim copy or gaps"; exit 1; }
node scripts/reel-lint.mjs --reel="$REEL"

# A slim public folder of APFS clones (no extra disk), so the bundle copies only this reel's assets.
SP="audio/build/$V/public"
rm -rf "$SP" && mkdir -p "$SP/seeker"
cp -Rc "public/$V" "$SP/"
cp -Rc public/seeker/fonts public/seeker/brand "$SP/seeker/"

if [ "${REVIEW:-0}" = 1 ]; then
  node scripts/reel-stills.mjs --reel="$REEL"
  exit 0
fi

BUNDLE="audio/build/$V/bundle"
rm -rf "$BUNDLE"
trap 'rm -rf "$BUNDLE"' EXIT
npx remotion bundle src/reel/index.ts --public-dir="$SP" --out-dir="$BUNDLE" --log=error
OUT="out/Tahoe-Reel-$NAME-9x16.mp4"
npx remotion render "$BUNDLE" "Reel-$NAME-9x16" "$OUT" --codec h264 --crf 16 --pixel-format yuv420p --color-space bt709 \
  --audio-codec aac --audio-bitrate 320k --jpeg-quality 100
cp "out/captions-$V.srt" "out/Tahoe-Reel-$NAME-9x16.srt"
mark=$(node -e "const t=require('./src/$V/timeline.json');const s=t.scenes[t.scenes.length-1];console.log(s.from+s.durationInFrames-20)")
npx remotion still "$BUNDLE" "Reel-$NAME-9x16" "out/poster-reel-$REEL.png" --frame="$mark"
python3 scripts/seeker-echo.py "$OUT" --lang "$LANG_CODE" --variant "$V"
echo "Done: $OUT (+ .srt, poster)"
