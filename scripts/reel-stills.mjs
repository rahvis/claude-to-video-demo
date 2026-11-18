// Review stills for an Instagram reel (src/reel, variant reel-<key>): one frame shortly after every visual beat
// (src/<variant>/events.json) plus each scene's middle, from ONE bundle of the reel's slim public folder (deleted after).
//   node scripts/reel-stills.mjs --reel=fresh [--scale=0.4] [frame ...]
// Output: out/stills-reel-<key>/fNNNNN.png and a contact sheet out/review-reel-<key>.png.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split("=")[1];
const key = arg("reel", "fresh");
const v = `reel-${key}`;
const scale = Number(arg("scale", "0.4"));
const fixed = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number);

const tl = JSON.parse(fs.readFileSync(path.join(root, `src/${v}/timeline.json`), "utf8"));
const ev = JSON.parse(fs.readFileSync(path.join(root, `src/${v}/events.json`), "utf8"));
const frames = [];
if (fixed.length) frames.push(...fixed);
else {
  for (const s of tl.scenes) {
    const local = Object.values(ev[s.id] ?? {}).map((e) => (e.cue === null ? e.at : (e.word !== undefined ? s.cues[e.cue].words[e.word].frame : s.cues[e.cue].frame) + e.at));
    local.push(Math.round(s.durationInFrames * 0.5), s.durationInFrames - 14);
    for (const l of local.sort((a, b) => a - b)) {
      const fr = Math.min(s.from + l + 14, s.from + s.durationInFrames - 10);
      if (!frames.length || fr - frames[frames.length - 1] > 12) frames.push(fr);
    }
  }
}

const comp = `Reel-${key.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("")}-9x16`; // fresh-male -> FreshMale
const serveUrl = await bundle({ entryPoint: path.join(root, "src/reel/index.ts"), publicDir: path.join(root, `audio/build/${v}/public`) });
try {
  const out = path.join(root, `out/stills-${v}`);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const composition = await selectComposition({ serveUrl, id: comp });
  for (const frame of frames) {
    await renderStill({ composition, serveUrl, frame, scale, output: path.join(out, `f${String(frame).padStart(5, "0")}.png`) });
  }
  execFileSync(path.join(root, "audio/.venv/bin/python"), [path.join(root, "scripts/sheet.py"), `${out}/f`, path.join(root, `out/review-${v}.png`), "6"], { stdio: "inherit" });
} finally {
  fs.rmSync(serveUrl, { recursive: true, force: true });
}
