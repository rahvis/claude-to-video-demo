# CCI Film

Remotion video project that turns a JSON narration script into a fully-scored video: synthesized voiceover (Kokoro TTS, runs fully offline/local), a generated music bed, sound effects, captions, and rendered MP4s in both 16:9 and 9:16 — all driven by one `build.sh` command.

The repo currently contains six films, each with its own script, timeline, and Remotion composition:

| Film | Script | Default voice | Compositions |
|---|---|---|---|
| CCI (dark) | `audio/script.json` | `af_heart` | `CCI-16x9`, `CCI-9x16` |
| CCI Light | `audio/script.json` | `am_michael` | `CCI-Light-16x9`, `CCI-Light-9x16` |
| Trace Privacy | `audio/script-trace.json` | `af_bella` | `Trace-16x9`, `Trace-9x16` |
| TahoeAI | `audio/script-tahoe.json` | `af_heart` | `Tahoe-16x9`, `Tahoe-9x16` |
| Conformal Logit Inference | `audio/script-unparse.json` | `af_bella` | `Unparse-16x9`, `Unparse-9x16` |
| Investor pitch deck | `audio/script-pitchdeck.json` | `af_bella` | `PitchDeck-16x9`, `PitchDeck-9x16` |

## How it works

1. `audio/tts.py` reads a script JSON (scenes → phrases of narration text), synthesizes each phrase with the local Kokoro model, and writes:
   - `public/<variant>/vo.wav` — the full voiceover track
   - `src/<variant>/timeline.json` — scene lengths and per-word caption cues, which the Remotion scenes read to time animations
   - `out/captions<-variant>.srt` — subtitles
2. `audio/score.py` generates a backing music bed and `audio/mix.py` mixes voice + music + SFX into `public/<variant>/mix.wav`.
3. Remotion renders the composition for that variant to `out/*.mp4`, then a poster frame is exported as a PNG.
4. Individual `.wav` renders are cached by content hash in `audio/cache/`, so re-running after a small script edit only re-synthesizes the lines that changed.

## Install

Prerequisites:
- **Node.js 20+** (tested on v22) and npm
- **Python 3.12** available via [`uv`](https://docs.astral.sh/uv/) (the build script creates `audio/.venv` with `uv venv -p 3.12`) — install uv with `brew install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **ffmpeg** on your `PATH` (`brew install ffmpeg`) — used by `mix.py` and Remotion's renderer

Nothing else needs manual setup — `./build.sh` installs npm packages, creates the Python venv, and downloads the Kokoro model weights the first time it runs.

```bash
cd video
./build.sh
```

This single command:
1. Creates `audio/.venv` and installs `kokoro-onnx`, `soundfile`, `numpy`, `scipy` (first run only)
2. Downloads `audio/models/kokoro-v1.0.onnx` and `audio/models/voices-v1.0.bin` (~325 MB total, first run only)
3. Runs `npm install` (first run only)
4. Synthesizes narration, generates score + SFX, mixes audio
5. Renders `out/CCI-16x9.mp4` and `out/CCI-9x16.mp4`
6. Exports poster stills to `out/poster-16x9.png` / `out/poster-9x16.png`

First run takes a few minutes (model download + render). Later runs are fast because synthesized lines are cached.

## Step-by-step usage

### 1. Edit the narration
Open `audio/script.json` (or the `script-<variant>.json` for another film) and edit the `phrases` text per scene. Each scene has a `lead`/`tail` pause (seconds) and each phrase can set its own trailing `pause`.

### 2. Pick a voice (optional)
```bash
VOICE=am_michael ./build.sh
```
See [Voices](#voices) below for the full list. To audition a few before committing:
```bash
cd audio && ../audio/.venv/bin/python tts.py --samples
```
writes one sample clip per voice in `SAMPLE_VOICES` to `out/voice-samples/`.

### 3. Build
```bash
./build.sh                       # CCI dark film, default voice
./build-light.sh                 # CCI white edition
./build-trace.sh                 # Trace Privacy film
./build-tahoe.sh                 # TahoeAI film
./build-unparse.sh               # Conformal Logit Inference film
./build-pitchdeck.sh             # Investor pitch deck
```
Each variant script only touches its own output files, so building one film never clobbers another.

To use a licensed music track instead of the generated score:
```bash
./build.sh --music path/to/track.mp3
```

### 4. Preview without a full render
```bash
npm run studio
```
Opens Remotion Studio in the browser at the composition for whichever film you're editing (e.g. `CCI-16x9`) — scrub the timeline live as you tweak `src/scenes/*.tsx` or `src/theme.ts`.

### 5. Render a single composition
If you only need one aspect ratio or want to re-render without redoing audio:
```bash
npm run render:16x9
npm run render:9x16
npm run render:trace:16x9
# ...etc, see package.json "scripts" for the full list
```

### 6. Review stills
```bash
node scripts/stills.mjs                 # one PNG per narration cue, both formats, dark film
node scripts/stills.mjs --light
node scripts/stills.mjs --trace
node scripts/stills.mjs s03_title       # filter to one scene id
```
Useful for spotting layout issues frame-by-frame without rendering full video.

## Using this with VS Code + Claude

This project is set up to be edited conversationally with Claude Code (the CLI/VS Code extension):

1. Open the `video/` folder in VS Code with the Claude Code extension installed (or run `claude` from this directory in the integrated terminal).
2. Ask Claude to edit a script, scene component, or theme — it can read/write `audio/script*.json`, `src/**/*.tsx`, and `src/theme.ts` directly.
3. Ask Claude to run the build (`./build.sh` or a variant script) and report back the rendered output path — Claude can execute these scripts directly and check `out/` for the results.
4. Ask Claude to open `npm run studio` in the background and describe what a given frame looks like, or to generate review stills with `scripts/stills.mjs` for visual QA.

### Sample prompts

> "Add a new scene to `audio/script-tahoe.json` between `s03_title` and the next scene, with two short phrases about on-device inference latency, then rebuild the Tahoe film."

> "Change the TahoeAI narrator to `bm_george` and re-render just the 9x16 version."

> "Render voice samples for af_bella, am_onyx, bf_isabella, and bm_fable so I can compare them before picking a narrator for the pitch deck."

> "The pitch deck pacing feels rushed around s04 — increase the `tail` pause on that scene in `audio/script-pitchdeck.json` by half a second and rebuild."

> "Generate review stills for every scene in the Trace film, landscape only, so I can check the captions don't overlap the logo."

> "Swap the background music for `./assets/license-track.mp3` on the light edition and rebuild."

> "Create a 7th film variant called `demo` that reuses the CCI theme but with its own script, timeline, and composition — walk me through all the files to add."

## Voices

Narration is synthesized locally by [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) (ONNX, v1.0), loaded from:
- `audio/models/kokoro-v1.0.onnx` — the model (gitignored; downloaded by `build.sh`)
- `audio/models/voices-v1.0.bin` — the voice embeddings (gitignored; downloaded by `build.sh`)

Both are ~100–200 MB and are intentionally excluded from git — `build.sh` fetches them from the [`kokoro-onnx` model-files-v1.0 release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0) on first run.

Pass a voice with `--voice` (`tts.py`) or the `VOICE` env var (any `build*.sh` script). Voice IDs are `<lang><gender>_<name>`:

| Prefix | Language / accent |
|---|---|
| `af_` / `am_` | American English, female / male |
| `bf_` / `bm_` | British English, female / male |
| `ef_` / `em_` | Spanish |
| `ff_` | French |
| `hf_` / `hm_` | Hindi |
| `if_` / `im_` | Italian |
| `jf_` / `jm_` | Japanese |
| `pf_` / `pm_` | Portuguese (Brazilian) |
| `zf_` / `zm_` | Mandarin Chinese |

Full list of supported voices in this model:

```
af_alloy    af_aoede    af_bella    af_heart    af_jessica  af_kore
af_nicole   af_nova     af_river    af_sarah    af_sky
am_adam     am_echo     am_eric     am_fenrir   am_liam     am_michael
am_onyx     am_puck     am_santa
bf_alice    bf_emma     bf_isabella bf_lily
bm_daniel   bm_fable    bm_george   bm_lewis
ef_dora     em_alex     em_santa
ff_siwis
hf_alpha    hf_beta     hm_omega    hm_psi
if_sara     im_nicola
jf_alpha    jf_gongitsune  jf_nezumi  jf_tebukuro  jm_kumo
pf_dora     pm_alex     pm_santa
zf_xiaobei  zf_xiaoni   zf_xiaoxiao zf_xiaoyi   zm_yunjian  zm_yunxi
zm_yunxia   zm_yunyang
```

English narration (`af_`/`am_`/`bf_`/`bm_`) has the most training data and sounds most natural; the other languages work but are better suited to non-English scripts (`lang="en-us"` is hardcoded in `tts.py` for phoneme handling — switch it if you script a non-English film).

## Project layout

```
video/
├── audio/                 # narration + music + mix pipeline (Python)
│   ├── script*.json       # per-film narration scripts (edit these)
│   ├── tts.py              # script -> voiceover + timeline.json + captions
│   ├── score.py            # generates the music bed
│   ├── mix.py               # mixes voice + music + sfx -> public/<variant>/mix.wav
│   ├── models/              # Kokoro model weights (gitignored, auto-downloaded)
│   ├── cache/                # per-line synthesis cache (gitignored)
│   └── build/                 # per-variant intermediate audio (gitignored)
├── src/
│   ├── Root.tsx             # registers every Remotion composition
│   ├── Film.tsx, theme.ts, scenes/   # the dark CCI film
│   └── light/ trace/ tahoe/ unparse/ pitchdeck/   # one folder per other variant
├── scripts/stills.mjs       # render review stills per narration cue
├── build.sh, build-*.sh     # one-command pipeline per film
├── public/                  # generated audio + assets served to the renderer (gitignored)
└── out/                     # rendered MP4s, posters, captions, stills (gitignored)
```

## Instagram reels from a prompt

30-second 9:16 product reels with vector animation, local Qwen3-TTS narration (English and Korean), original music and
automatic checks. Setup and the full guide are in [REELS.md](REELS.md).

```bash
brew install node ffmpeg tesseract uv   # Apple Silicon Mac
./setup-reels.sh                        # Node packages, Python envs, voice + Whisper models (downloaded, pinned)
REEL=fresh-sohee ./build-reel.sh        # -> out/Tahoe-Reel-FreshSohee-9x16.mp4
```
