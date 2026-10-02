// Render review stills: one per narration cue (once it has settled) plus the last
// frame before each scene exits, for both formats. Usage:
//   node scripts/stills.mjs [scene-id-filter] [--portrait-only|--landscape-only] [--light|--trace]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const light = process.argv.includes("--light");
const trace = process.argv.includes("--trace");
const timeline = JSON.parse(fs.readFileSync(path.join(root, trace ? "src/trace/timeline.json" : light ? "src/light/timeline.json" : "src/timeline.json"), "utf8"));
const filter = process.argv.find((a, i) => i > 1 && !a.startsWith("--"));
const pre = trace ? "Trace-" : light ? "CCI-Light-" : "CCI-";
const comps = (process.argv.includes("--portrait-only") ? ["9x16"] : process.argv.includes("--landscape-only") ? ["16x9"] : ["16x9", "9x16"]).map((a) => pre + a);

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const outDir = path.join(root, "out/stills");
fs.mkdirSync(outDir, { recursive: true });

for (const id of comps) {
  const composition = await selectComposition({ serveUrl, id });
  for (const s of timeline.scenes) {
    if (filter && !s.id.includes(filter)) continue;
    const frames = [...s.cues.map((c) => Math.min(c.endFrame + 4, s.durationInFrames - 20)), s.durationInFrames - 18];
    for (const [k, local] of [...new Set(frames)].entries()) {
      const output = path.join(outDir, `${id}_${s.id}_${k}.png`);
      await renderStill({ composition, serveUrl, output, frame: s.from + local, scale: 0.5 });
      console.log(output);
    }
  }
}
