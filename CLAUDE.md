# Notes for Claude Code

This repo turns prompts into narrated Remotion videos. For an Instagram reel (or any "make a video/reel about ..." request),
read `REELS.md` first and follow it: setup, the step-by-step, voices, copy rules and pitfalls.

- First run on a machine: `./setup-reels.sh`. If a model, Python env or `node_modules` is missing, run it rather than
  installing things ad hoc.
- Build with `REEL=<key> ./build-reel.sh`. Review layout with `REVIEW=1` and look at `out/review-reel-<key>.png` before the
  full render.
- Never weaken a check to get a build through. `reel-lint`, the Whisper check on the mix and the OCR echo check guard
  truthfulness and the copy rules. Fix the copy, the take or the timing instead.
- Claims must be true and verifiable (REELS.md section 6). Don't name the data provider.
- English reels stay within 30.5 s. Korean twins keep their natural length.
- Narration quality is picked by measurement, so ask the person to listen before calling a voice done.
- Don't commit generated files (`out/`, `public/reel-*/`, `audio/cache|build|models/`).
