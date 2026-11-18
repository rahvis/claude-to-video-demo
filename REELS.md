# Instagram reels from a prompt

30-second, 9:16 (1080×1920, 30 fps) product reels for Tahoe: vector animation in Remotion and original
synthesized music. Narration is local Qwen3-TTS in English or Korean. Every reel passes automatic checks before it renders.
You describe the reel in a prompt (to Claude Code, or by hand), and the pipeline does the rest:

```
prompt -> narration script (audio/script-reel-<key>.json)
       -> voice: Qwen3-TTS, 3+ takes per line, Whisper picks the best   -> timeline.json (scene + word frames)
       -> scenes (src/reel-<key>/scenes.tsx) + beats (events.json)
       -> music + SFX on the same beats -> mix at -14 LUFS
       -> checks (Whisper on the mix, copy lint, on-screen text vs narration) -> out/Tahoe-Reel-<Name>-9x16.mp4
```

## 0. Quick start with Claude Code

You need a Mac with Apple Silicon, at least 15 GB of free disk, [Homebrew](https://brew.sh) (its installer asks for
your Mac password, so install it yourself first) and [Claude Code](https://claude.com/claude-code) installed and signed in. Open Terminal, run `claude`, and paste the prompts below. Approve the commands it asks to run.
The first setup downloads about 7 GB, mostly voice and speech-recognition models, so allow 30 to 60 minutes.

**Prompt 1. Set up and make a sample video**

```text
Set up the claude-to-video-demo repo on this Mac so I can make narrated Instagram reels locally, then make a sample video.

1. Clone https://github.com/rahvis/claude-to-video-demo.git into ~/claude-to-video-demo (skip if it's already there), then read CLAUDE.md and REELS.md before doing anything else.
2. Check that this is an Apple Silicon Mac with at least 15 GB free disk and that Homebrew is installed (if it isn't, stop and tell me to install it from https://brew.sh). If node, ffmpeg, tesseract or uv is missing, install it with brew install node ffmpeg tesseract uv.
3. Run ./setup-reels.sh. It installs the Node packages, the pinned Python environments, the Qwen3-TTS voice models (CustomVoice and Base), the Whisper models and the OCR data. If a step fails, find the cause, fix it and re-run. Don't skip steps.
4. Make the sample video: REEL=fresh-sohee ./build-reel.sh
5. When it's done, open out/Tahoe-Reel-FreshSohee-9x16.mp4 and tell me its length and whether every check passed (Whisper on the mix, reel lint, on-screen text check). Don't weaken or skip a check to get it through.
```

**Prompt 2. A new video from your idea**

```text
Make a new 30-second Instagram reel for Tahoe about <your idea, e.g. "seeing who's hiring near you">. Product page: https://tahoe.workonward.com/en/job-seekers

Follow REELS.md section 4 and its copy rules:
- Six scenes: hook, problem, stat, reveal, feature, call to action. Vector art and animation, built like src/reel-fresh.
- English narration in the Sohee voice, with a tone note for each line.
- Only claims the product page supports. Any stat must be from this year, checked on its source page, with the source and date on screen.

Show me the narration script first. After I approve it, render the narration, run REVIEW=1 and show me the contact sheet, then do the full build. Tell me where the video is and whether every check passed.
```

**Follow-ups**

```text
Make the same reel with the male voice (see the voices table in REELS.md).
```
```text
Add a Korean twin of <reel key> in the Korean Sohee voice. Keep its natural length.
```
```text
Before I pick a voice, write a short audition of the hook in each voice from REELS.md section 5 to out/voice-audition/ so I can listen.
```
```text
Design a new narrator voice: <describe it, e.g. "warm British woman in her thirties, calm and clear">. Get the VoiceDesign model with QWEN=VoiceDesign ./setup-reels.sh, make 6 candidates and let me listen before using one.
```
```text
List every reel in src/reel/registry.ts, then build <reel key>.
```
```text
The build stopped with this error: <paste it>. Read the Pitfalls in REELS.md, fix the cause and re-run. Don't weaken any check.
```

## 1. Setup (once per machine)

Needs a Mac with Apple Silicon (the voice models run on MLX) and Homebrew.

```bash
brew install node ffmpeg tesseract uv
git clone https://github.com/rahvis/claude-to-video-demo.git && cd claude-to-video-demo
./setup-reels.sh
```

`setup-reels.sh` is safe to re-run. It installs:

| What | Where | Size |
|---|---|---|
| Remotion and Node packages | `node_modules/` | 0.7 GB |
| Python envs (pinned) | `audio/.venv` (music, mix), `audio/.venv-qwen` (voice, checks) | 1 GB |
| Qwen3-TTS 1.7B 8-bit: CustomVoice (Sohee, Korean) and Base (cloned voices) | `audio/models/qwen3/` | 2.4 GB each + 0.65 GB shared |
| Whisper small.en, small, large-v3-turbo | `~/.cache/huggingface` | 2.5 GB |
| Tesseract English and Korean data | `audio/build/tessdata/` | small |

`QWEN="CustomVoice Base VoiceDesign" ./setup-reels.sh` adds VoiceDesign, which is only needed to design a new voice.
Models are downloaded, never committed. They're too large for git, and the script pins the exact revisions used here.

Check the setup by building an existing reel. The first build renders every voice take (a few minutes). Later builds
reuse `audio/cache/qwen/`.

```bash
REEL=fresh-sohee ./build-reel.sh          # -> out/Tahoe-Reel-FreshSohee-9x16.mp4 (+ .srt captions, poster)
```

## 2. Building

```bash
REEL=<key> ./build-reel.sh                # narration, music, mix, checks, render
REEL=<key> REVIEW=1 ./build-reel.sh       # everything but the render: contact sheet out/review-reel-<key>.png
REEL=<key> VIDEO_ONLY=1 ./build-reel.sh   # picture-only change: keep the current narration and mix
REELS=a,b,c ./build-reel.sh               # several in a row
```

Keys live in `src/reel/registry.ts`. The composition is `Reel-<Name>-9x16`, where Name is the key's hyphen parts capitalised
(`front-page-sohee` -> `FrontPageSohee`). The build stops if free disk is under 2 GB or an English reel runs over 30.5 s.

## 3. How a reel is put together

| Path | What |
|---|---|
| `src/reel/Film.tsx` | The film shell: scenes as Sequences, hand-over transitions, audio. `useReel`, `useLang`, `beatFrame`. |
| `src/reel/kit.tsx` | Vector parts: palette `R`, safe zone `SAFE`, fonts `F`, cursors, job cards, company glyphs, isometric résumé sheets, chips, check marks, Tahoe cat mark and wordmark, `In`/`fade`/`arc`/`wander` helpers. |
| `src/reel/shells.tsx` | Scene hand-overs: `BlurRise` (default), `Cut`, `Dissolve`, `PageTurn`, `Bare`. |
| `src/reel/series.ts` | Looks for the series reels (scenes, shell, full-film backdrop and overlay, background). `seriesReel(base, lang, timeline, events, voice?)`. |
| `src/reel/registry.ts` | Every reel key -> its timeline, beats and scenes. |
| `src/reel-<key>/scenes.tsx` | One component per scene id, driven by `useEvent("<beat>")` and `useCue(i)` from `src/lib/scene.tsx`. |
| `src/reel-<key>/events.json` | Beats: `{"scene": {"beat": {"cue": 0, "word": 3, "at": -4, "sfx": "pop"}}}`. Frame = the cue's word (or the cue start if no `word`, or the scene start if `cue` is null) + `at` frames. The music uses the same beats. SFX names: `SFX` in `audio/score.py`. |
| `src/reel-<key>/copy.ts` | Series reels: on-screen copy per language, and the stat with its source (`STAT`). |
| `src/reel-<key>/timeline.json` | Generated by the narration step. Never edit by hand. |
| `audio/script-reel-<key>.json` | The narration script (below). |
| `audio/score.py`, `audio/score_reels.py` | Music. `compose_music_reel` is the default 6-scene style. `score_reels.STYLES` gives each series reel its own style, anchored on its `mark` (logo) and `lockup` (end card) beats. |
| `audio/tts_qwen.py` | Narration: renders takes, Whisper scores them, picks one per line, writes `vo.wav`, `timeline.json` and captions. |
| `scripts/reel-lint.mjs` | Copy rules, stat checks, beats point at real words. |
| `scripts/seeker-vo-check.py`, `scripts/seeker-echo.py` | Whisper on the final mix. OCR of the render (on-screen text must not spell out the narration). |

Twins share scenes and differ in voice or language. A twin's key is the base key plus a suffix (`-ko` for Korean,
`-sohee` for the English Sohee voice, `fresh-male` for the male voice). Each twin has its own script, timeline and
events in `src/reel-<twin>/`.

## 4. Making a new reel from a prompt

Example prompt: *"Make a 30 s reel for Tahoe job seekers about seeing who's hiring near you. English, Sohee voice, plus a
Korean twin. Hook, problem, stat, reveal, feature, call to action."*

1. **Find true claims.** Read the product page the prompt names. Use only features the product really has. Any stat
   must be current-year, with its source and month on screen, and the source page must actually say it.
2. **Write the narration**, `audio/script-reel-<key>.json`. Copy a similar script (`script-reel-fresh-sohee.json` for the
   6-scene template, or any series script) and change the scenes:
   ```json
   { "fps": 30, "gap": 0.22, "overlap_frames": 8, "language": "english",
     "engine": "custom", "model": "models/qwen3/CustomVoice-8bit", "speaker": "sohee",
     "temperature": 0.8, "seed": 11, "takes": 3, "tempo": 1.0,
     "scenes": [
       { "id": "hook", "lead": 0.8, "tail": 0.5, "phrases": [
         { "text": "You finally find the right job.", "pause": 0.4, "instruct": "Excited and hopeful." },
         { "text": "Everyone else found it first.", "fall": true, "instruct": "Dry and deadpan, with a hint of a smile." } ] } ] }
   ```
   Phrase fields:
   - `text`: what's spoken and captioned.
   - `say`: the spoken spelling, if different.
   - `pause`: seconds after the phrase.
   - `fall`: the line must end falling, as a statement.
   - `instruct`: tone note (custom engine only).
   - `takes`: more takes for this line.
   - `take`: pin a take chosen by ear.

   Scene `lead` and `tail` set the air before and after.
   Script options:
   - `tempo`: time-stretch, pitch unchanged.
   - `max_pause`: cap pauses inside a line, in seconds.
   - `pick`: `"shortest"` keeps the briskest good take.
3. **Render the narration** and read the report:
   ```bash
   (cd audio && .venv-qwen/bin/python tts_qwen.py --script script-reel-<key>.json --variant reel-<key>)
   ```
   This prints each scene's length and, for each line, what Whisper heard and whether the end falls. `FLAG` marks a line to
   fix: reword it, add `takes`, or check whether it's a known Whisper quirk (see Pitfalls). It also writes
   `src/reel-<key>/timeline.json`.
4. **Draw the scenes**, `src/reel-<key>/scenes.tsx`, one component per scene id (`src/reel-fresh/scenes.tsx` is the
   6-scene template; the series reels show other styles). Put each motion on a beat in `src/reel-<key>/events.json`, so
   it lands on the word that motivates it.
5. **Register it**: one line in `src/reel/registry.ts`. For a new series-style look, add it to `LOOKS` in
   `src/reel/series.ts` and a music style to `score_reels.STYLES`. Otherwise `compose_music_reel` scores it.
6. **Review**: run `REEL=<key> REVIEW=1 ./build-reel.sh` and look at `out/review-reel-<key>.png`. Fix layout, then build.
7. **Build**: `REEL=<key> ./build-reel.sh`. Then listen to it. Measurements pick the takes, but a person signs off on the
   voice.

For a **Korean twin**: `audio/script-reel-<key>-ko.json` (`"language": "korean"`, Sohee, Korean `text`, English
`instruct`), `src/reel-<key>-ko/events.json` (cue and word indexes follow the Korean lines), and a registry line. Korean
keeps its natural length, up to 60 s. Don't speed it up or trim it to match the English.

## 5. Voices

| Voice | Script header |
|---|---|
| English female, Sohee (expressive, per-line tone) | `"engine": "custom", "model": "models/qwen3/CustomVoice-8bit", "speaker": "sohee"` + `instruct` per phrase |
| English male, bright tenor | `"engine": "clone", "model": "models/qwen3/Base-8bit", "ref_audio": "voices/reel-male-anchor.wav"`, `ref_text` = `anchor_text` (see `script-reel-fresh-male.json`) |
| English female, warm (designed) | `"engine": "clone", "ref_audio": "voices/seeker-en-anchor-0.wav"`, `"tempo": 0.9` (see `script-reel-fresh.json`) |
| Korean female, Sohee | `"engine": "custom", "speaker": "sohee", "language": "korean"` |
| A new voice | Write a `design` description, then run `tts_qwen.py --script ... --anchor 6` (needs VoiceDesign). Listen to `out/voice-audition/anchors/`, then `--use-anchor K` saves it to the script's `ref_audio`. |

Audition a few lines without building: `tts_qwen.py --script <s> --audition <name> --only hook,cta` writes `out/voice-audition/<name>.wav`.

## 6. Copy rules (the lint enforces most of these)

- No em dashes, en dashes or "--". Short, simple, attention-grabbing lines.
- No eyebrows (small labels above headlines). No emoji or generic icon badges. Use mono numerals, real marks and drawn objects.
- No machine-sounding words (seamless, unlock, elevate, supercharge, empower, streamline, leverage, journey, ...). No
  "Meet X" openers and no "Join X" asks.
- On-screen text never spells out the narration. The screen shows things; the voice tells the story (OCR check).
- Stats: current year only, verified on the source page, with the source and date on screen.
- Tahoe claims must be true:
  - It reads jobs from 220K+ company career sites, 5M+ open roles.
  - Sites are checked hourly, but there is no "posted in the last hour" filter (the smallest is 24 h).
  - Never name the data provider.
- Auto Apply is named only in the Auto Apply reels. It's shown as available, with true built-feature claims only: no plans,
  prices, volumes or success rates. Every Auto Apply reel says that nothing is sent until the person checks it.
- Keep words inside the safe zone, y 250 to 1480 (`SAFE` in kit.tsx). Instagram covers the top and bottom.

## 7. Pitfalls

- **Questions by accident**: Qwen reads auxiliary inversion ("So did everyone else.") as a question. Write plain statements
  and mark punchlines `"fall": true`.
- **Whisper quirks that aren't errors**:
  - "two hundred thousand" comes back as "200 ,000".
  - "Auto Apply" comes back as "AutoApply".
  - Apostrophes come back on plurals ("evening's"). The final check ignores apostrophes.
- **Sohee in English** reads up to ~18% slower than the male voice and pauses mid-sentence. If a reel runs long, set
  `"max_pause": 0.3` and `"pick": "shortest"` before reaching for `tempo`. Her "Tahoe" is sometimes heard as "Tau" or
  "Tate". Those takes fail the match, so the picker skips them.
- **Disk**: each Remotion bundle copies the public folder, so `build-reel.sh` bundles a slim copy holding only this reel's
  files. VoiceDesign runs can grow macOS swap by a few GB.
- **Generated, not committed**: `public/reel-*/` (vo.wav, mix.wav), `out/`, `audio/cache/`, `audio/build/`, `audio/models/`.
  Everything else a reel needs is in git.
