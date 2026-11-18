// Copy lint for Instagram reels (src/reel + src/reel-<base>, audio/script-reel-<key>.json, out/captions-reel-<key>.srt).
// <key> is a reel (fresh, front-page, ...) or its twin (fresh-male, fresh-sohee, <base>-ko, <base>-sohee); twins share src/reel-<base>.
// Fails on em/en dashes or "--", machine-sounding words, "Meet X" openers, "Join"-style asks (English and Korean),
// the data provider's name, a "last hour" search claim, plan names, prices, "coming soon"/waitlist framing, and
// Auto Apply claims Tahoe can't back (Easy Apply, Indeed, CAPTCHAs, guarantees, volumes, success rates).
// Auto Apply itself may be named only in the Auto Apply reels (form, night, blueprint), and each of those must say,
// in the narration, that nothing is sent until the person has checked it. Checks the stats on screen are the
// verified ones (each reel's copy.ts STAT block) and that every scene has its beats.
//   node scripts/reel-lint.mjs --reel=front-page-ko
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const key = (process.argv.find((a) => a.startsWith("--reel=")) ?? "--reel=fresh").split("=")[1];
const v = `reel-${key}`;
const base = key.startsWith("fresh") ? "fresh" : key.replace(/-(ko|sohee)$/, "");
const AUTO_APPLY = ["form", "night", "blueprint"].includes(base);

const RULES = [
  ["dash", /[—–]|--/],
  [
    "machine word",
    /\b(seamless(ly)?|effortless(ly)?|unlock\w*|elevat\w*|supercharg\w*|empower\w*|streamlin\w*|harness\w*|revolutioni[sz]\w*|game-?changer|delve\w*|leverag\w*|next-level|reimagin\w*|journey\w*|cutting-edge|transformative|unleash\w*|robust|synerg\w*)\b/i,
  ],
  ["Meet X", /\bMeet [A-Z]/],
  ["join ask", /\bjoin\b|함께하세요|가입하세요|참여하세요/i],
  ["data provider name", new RegExp(Buffer.from("Y29yZVxzP3NpZ25hbA==", "base64").toString(), "i")], // name kept out of the source
  ["last-hour search claim", /(posted|search\w*|filter\w*)[^.]{0,30}(last|past) (1 )?hour/i],
  ["plan name or price", /autopilot|\bmax plan\b|\bplus plan\b|\$\s?\d+\s*(\/|a |per )\s*mo|요금제|달러/i],
  ["coming-soon framing", /coming soon|waitlist|wait list|곧 출시|대기 명단|대기자/i],
  ["unbacked auto-apply claim", /easy apply|\bindeed\b|captcha|guarantee\w*|success rate|hired faster|보장|합격률/i],
  ["volume claim", /\b\d[\d,]*\+?\s*(applications|jobs|apps)\s*(a|per|every)\s*(day|week|hour)|하루에?\s*\d+\s*(건|곳|개)/i],
];
if (!AUTO_APPLY) RULES.push(["auto-apply outside the Auto Apply reels", /auto-?\s?apply|자동\s?지원/i]);

const problems = [];
const check = (where, text) => {
  for (const [name, re] of RULES) if (re.test(text)) problems.push(`${where}: ${name}: ${JSON.stringify(text.trim().slice(0, 90))}`);
};

const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)])) : []);
for (const file of [...walk(path.join(root, "src/reel")), ...walk(path.join(root, `src/reel-${base}`))].filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))) {
  const rel = path.relative(root, file);
  // the shared kit and registry name every reel; the auto-apply rule applies to this reel's own files only
  const own = rel.startsWith(`src/reel-${base}/`);
  const src = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node) => {
    let text = null;
    if (ts.isJsxText(node)) text = node.getText();
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!ts.isImportDeclaration(node.parent) && !ts.isExportDeclaration(node.parent)) text = node.text;
    }
    if (text && text.trim() && (own || !/auto-?\s?apply|자동\s?지원/i.test(text))) check(`${rel}:${src.getLineAndCharacterOfPosition(node.getStart()).line + 1}`, text);
    ts.forEachChild(node, visit);
  };
  visit(src);
}

const script = JSON.parse(fs.readFileSync(path.join(root, `audio/script-${v}.json`), "utf8"));
for (const s of script.scenes) for (const p of s.phrases) for (const t of [p.text, p.say].filter(Boolean)) check(`audio/script-${v}.json ${s.id}`, t);
const srt = path.join(root, `out/captions-${v}.srt`);
if (fs.existsSync(srt)) fs.readFileSync(srt, "utf8").split("\n").forEach((l, i) => l.trim() && !/^\d+$|-->/.test(l) && check(`out/captions-${v}.srt:${i + 1}`, l));

// Auto Apply reels: the narration says nothing is sent before the person checks or approves it.
if (AUTO_APPLY) {
  const said = script.scenes.flatMap((s) => s.phrases.map((p) => p.text)).join(" ");
  if (!/until (I've|you've|you) (checked|approve)|read each one|확인하기 전|승인하기 전|읽어 보고/i.test(said))
    problems.push(`audio/script-${v}.json: an Auto Apply reel must say that nothing is sent before the person checks it`);
}

// Stats on screen = the verified figures (Fresh: Huntr Q3 2026 interview rates; the site's 220K+ career sites).
if (base === "fresh") {
  const scenes = fs.readFileSync(path.join(root, "src/reel-fresh/scenes.tsx"), "utf8"); // shared by every voice of the reel
  for (const [re, what] of [
    [/Counter to=\{6\.0\}/, "6.0% interview rate via company career sites (Huntr Q3 2026)"],
    [/Counter to=\{3\.4\}/, "3.4% via job boards (Huntr Q3 2026)"],
    [/Huntr, Q3 2026\. 84,753 applications\./, "Huntr source line"],
    [/Counter to=\{220\} at=\{countAt\} dur=\{30\} suffix="K\+"/, "220K+ company career sites"],
  ])
    if (!re.test(scenes)) problems.push(`src/reel-fresh/scenes.tsx: stat changed or missing: ${what}`);
}
// Other reels: copy.ts STAT block = the research table (plan: 2026 sources, re-checked on the source pages).
const STATS = {
  "front-page": [/value: 19,/, /en: "Greenhouse data, The Wall Street Journal, Aug 2026"/, /ko: "Greenhouse 데이터, 월스트리트저널, 2026년 8월"/],
  seen: [/value: 81,/, /en: "Greenhouse, Oct 2026"/, /ko: "Greenhouse, 2026년 10월"/],
  plainly: [/roles: "5M\+"/, /sites: "220K\+"/],
  home: [/value: 7\.5,/, /en: "US Bureau of Labor Statistics, Sep 2026"/, /ko: "미국 노동통계국, 2026년 9월"/],
  form: [/minutes: 44,/, /hours: 46,/, /en: "United Way NCA survey, May 2026"/, /ko: "United Way NCA 설문, 2026년 5월"/],
  night: [/value: 11\.9,/, /en: "US Bureau of Labor Statistics, Oct 2026"/, /ko: "미국 노동통계국, 2026년 10월"/],
  blueprint: [/value: 40,/, /en: "Greenhouse, Oct 2026"/, /ko: "Greenhouse, 2026년 10월"/],
};
if (STATS[base]) {
  const copyFile = path.join(root, `src/reel-${base}/copy.ts`);
  const copy = fs.existsSync(copyFile) ? fs.readFileSync(copyFile, "utf8") : "";
  for (const re of STATS[base]) if (!re.test(copy)) problems.push(`src/reel-${base}/copy.ts: stat changed or missing: ${re}`);
}

// Every scene in the script has beats, and every beat points at a cue (and word) that exists.
const ev = JSON.parse(fs.readFileSync(path.join(root, `src/${v}/events.json`), "utf8"));
for (const s of script.scenes) {
  if (!ev[s.id]) problems.push(`src/${v}/events.json: no beats for scene ${s.id}`);
  for (const [name, e] of Object.entries(ev[s.id] ?? {})) {
    if (e.cue === null) continue;
    const ph = s.phrases[e.cue];
    if (!ph) problems.push(`src/${v}/events.json ${s.id}.${name}: cue ${e.cue} does not exist`);
    else if (e.word !== undefined && e.word >= ph.text.split(" ").length) problems.push(`src/${v}/events.json ${s.id}.${name}: word ${e.word} past the end of "${ph.text}"`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`reel lint failed: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`reel lint ok: ${key}`);
