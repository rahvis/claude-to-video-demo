import React from "react";
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { evolvePath } from "@remotion/paths";
import { Counter, EASE, mix, prog } from "../lib/motion";
import { useCue, useEvent } from "../lib/scene";
import { C, clamp } from "../seeker/theme";
import {
  Burst,
  CROWD_COLORS,
  CROWD_NAMES,
  CatMark,
  Check,
  Chip,
  CompanyGlyph,
  Cursor,
  F,
  FreshChip,
  Heart,
  In,
  IsoSheet,
  Job,
  JobCard,
  LightBg,
  NightBg,
  R,
  WorkOnward,
  Wordmark,
  arc,
  wander,
} from "../reel/kit";

// Tahoe for job seekers, IG reel "Fresh" (30 s, 9:16). The story: the right job, and the crowd that found it too;
// a job board buries your application; the company's own site gets you twice the interviews (Huntr, Q3 2026);
// that is where Tahoe looks; it checks 220K+ company career sites every hour, so new jobs reach you early; get
// there first. Every picture is vector; the narration is never written on screen.

const HOOK_JOB: Job = { title: "Senior Product Designer", company: "Lumen & Pine", place: "Austin, TX", glyph: "pine", hue: "#0F766E", hue2: "#2DD4BF" };
const FRESH: { job: Job; posted: string }[] = [
  { job: { title: "Product Designer", company: "Harbor Finch", place: "Remote", glyph: "wave", hue: "#1D4ED8", hue2: "#60A5FA" }, posted: "Posted 4 minutes ago" },
  { job: { title: "Data Analyst", company: "Cedarline", place: "Denver, CO", glyph: "sun", hue: "#C2410C", hue2: "#FB923C" }, posted: "Posted 12 minutes ago" },
  { job: { title: "Frontend Engineer", company: "Brightarc", place: "Austin, TX", glyph: "arc", hue: "#7E22CE", hue2: "#C084FC" }, posted: "Posted 31 minutes ago" },
];

/* ================================================================== hook: the right job, and everyone else */

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardAt = useEvent("card");
  const cursorAt = useEvent("cursor");
  const save = useEvent("save");
  const spark = useEvent("spark");
  const crowd = useEvent("crowd");
  const count = useEvent("count");

  const sp = spring({ frame: f - cardAt, fps, config: { damping: 15, stiffness: 110, mass: 0.9 } });
  const push = prog(f, cursorAt, 50, Easing.bezier(0.4, 0, 0.2, 1));
  const pull = prog(f, crowd + 4, 46, Easing.bezier(0.45, 0, 0.2, 1));
  const zoom = mix(mix(1.02, 1.12, push), 0.9, pull);

  // card: 880 wide, top at 760; the heart sits at the right end of the top row
  const heart: [number, number] = [896, 838];
  const me = arc([900, 1560], heart, prog(f, cursorAt, save - cursorAt - 2, Easing.bezier(0.3, 0, 0.15, 1)), 0.08);
  const press = interpolate(f, [save - 2, save, save + 5], [0, 1, 0], clamp);
  const saved = prog(f, save, 12, Easing.bezier(0.2, 0.9, 0.3, 1.2));

  const applicants = Math.round(f < count ? 12 : interpolate(f, [count, count + 50], [12, 1284], { ...clamp, easing: Easing.bezier(0.3, 0, 0.3, 1) }));
  const hot = prog(f, count + 10, 30);

  const cursors = [];
  const N = 64;
  for (let i = 0; i < N; i++) {
    const wave = i < 34 ? 0 : 1;
    const t0 = crowd + (wave ? 14 + random(`hw${i}`) * 24 : random(`ht${i}`) * 18);
    const d = 16 + random(`hd${i}`) * 10;
    const p = prog(f, t0, d, Easing.bezier(0.2, 0.7, 0.2, 1));
    if (p <= 0) continue;
    const ang = random(`ha${i}`) * Math.PI * 2;
    const from: [number, number] = [540 + Math.cos(ang) * 1500, 900 + Math.sin(ang) * 1500];
    const to: [number, number] = wave
      ? [60 + random(`hx${i}`) * 960, 330 + random(`hy${i}`) * 1160]
      : [140 + random(`hx${i}`) * 820, 640 + random(`hy${i}`) * 520];
    const [x, y] = arc(from, to, p, 0.1);
    const [wx, wy] = p >= 1 ? wander(`hc${i}`, f, 7) : [0, 0];
    cursors.push(
      <Cursor key={i} x={x + wx} y={y + wy} color={CROWD_COLORS[i % CROWD_COLORS.length]} label={i < 16 ? CROWD_NAMES[i] : undefined} size={0.9 + random(`hs${i}`) * 0.25} />,
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <LightBg drift={f * 0.4} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "540px 900px" }}>
        <div style={{ position: "absolute", left: 100, top: 760, transform: `translateY(${(1 - sp) * 120}px) scale(${0.9 + 0.1 * sp})`, opacity: Math.min(1, sp * 1.5) }}>
          <JobCard
            job={HOOK_JOB}
            width={880}
            right={<Heart size={96} on={saved} />}
            footer={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Chip>Full time</Chip>
                  <Chip>Hybrid</Chip>
                  <Chip>$140K</Chip>
                </div>
                <div style={{ fontFamily: F.text, fontSize: 28, fontWeight: 600, color: hot > 0 ? `rgb(${mix(66, 220, hot)}, ${mix(66, 38, hot)}, ${mix(69, 38, hot)})` : C.ink2, fontVariantNumeric: "tabular-nums" }}>
                  {applicants.toLocaleString("en-US")} applicants
                </div>
              </div>
            }
          />
        </div>
        <Burst x={heart[0]} y={heart[1]} at={spark} r0={56} r1={104} />
        {cursors}
        <Cursor x={me[0]} y={me[1]} color={C.purple} label="You" size={1.15} press={press} opacity={prog(f, cursorAt - 4, 8)} />
      </div>
    </div>
  );
};

/* ================================================================== problem: a job board buries you */

const BoardRow: React.FC<{ i: number; ours?: boolean; lit?: number }> = ({ i, ours, lit = 0 }) => {
  const kinds = ["wave", "sun", "arc", "stack", "pine"] as const;
  const greys: [string, string][] = [["#94A3B8", "#CBD5E1"], ["#A8A29E", "#D6D3D1"], ["#9CA3AF", "#D1D5DB"]];
  const g = greys[i % greys.length];
  return (
    <div
      style={{
        height: 96,
        borderRadius: 22,
        background: ours ? `rgba(124,58,237,${0.06 + 0.06 * lit})` : "#F7F7F9",
        boxShadow: ours ? `0 0 0 ${2 + 2 * lit}px rgba(124,58,237,${0.25 + 0.5 * lit})` : undefined,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 22px",
        fontFamily: F.text,
      }}
    >
      {ours ? <CompanyGlyph kind="pine" hue={HOOK_JOB.hue} hue2={HOOK_JOB.hue2} size={60} /> : <CompanyGlyph kind={kinds[i % kinds.length]} hue={g[0]} hue2={g[1]} size={60} />}
      <div style={{ flex: 1 }}>
        {ours ? (
          <>
            <div style={{ fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: "-0.01em" }}>{HOOK_JOB.title}</div>
            <div style={{ fontSize: 22, color: C.sub, marginTop: 4 }}>{HOOK_JOB.company}</div>
          </>
        ) : (
          <>
            <div style={{ width: 220 + random(`bw${i}`) * 200, height: 16, borderRadius: 8, background: "#DCDCE3" }} />
            <div style={{ width: 120 + random(`bv${i}`) * 90, height: 12, borderRadius: 6, background: "#E8E8EE", marginTop: 12 }} />
          </>
        )}
      </div>
      <div style={{ padding: "12px 24px", borderRadius: 999, background: ours ? C.purple : "#E4E4EA", color: ours ? "#fff" : "#9A9AA3", fontSize: 24, fontWeight: 600 }}>Apply</div>
    </div>
  );
};

export const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const apply = useEvent("apply");
  const drop = useEvent("drop");
  const rain = useEvent("rain");
  const buried = useEvent("buried");

  // the board's list scrolls fast, then eases to a stop on our row as the cursor clicks Apply
  const stop = apply - 4;
  const scroll = f < stop - 14 ? f * 7 : (stop - 14) * 7 + 7 * 14 * prog(f, stop - 14, 14, Easing.bezier(0.2, 0.6, 0.3, 1)) * 0.5;
  const rowH = 110;
  const oursIndex = Math.round((scroll + 3 * rowH) / rowH);
  const boardOut = prog(f, rain - 2, 14, Easing.bezier(0.5, 0, 0.75, 0));
  const boardIn = prog(f, 0, 12);

  // our row's Apply button, in screen space (board at x 100, y 300; list starts 90 below)
  const oursY = 300 + 90 + oursIndex * rowH - scroll + 48;
  const btn: [number, number] = [910, oursY];
  const me = arc([980, 1500], btn, prog(f, 0, apply - 2, Easing.bezier(0.3, 0, 0.2, 1)), 0.06);
  const press = interpolate(f, [apply - 2, apply, apply + 5], [0, 1, 0], clamp);

  const base = 1210;
  const ourP = prog(f, drop, 18, Easing.bezier(0.3, 0, 0.2, 1));
  const ourPos = arc([540, Math.min(oursY, 760)], [540, base], ourP, -0.05);
  const xray = interpolate(f, [buried, buried + 8], [0, 1], clamp);
  const pulse = xray * (0.75 + 0.25 * Math.sin((f - buried) / 4));

  const sheets = [];
  const M = 24;
  const greys = ["#D4D4D8", "#CBD5E1", "#D6D3D1", "#E4E4E7", "#C7CAD1"];
  for (let k = 0; k < M; k++) {
    const land = rain + 4 + k * 2.1;
    const p = prog(f, land - 10, 10, Easing.bezier(0.55, 0, 1, 0.45));
    if (p <= 0) continue;
    const restY = base - (k + 1) * 12;
    const cx = 540 + (random(`sx${k}`) - 0.5) * 60;
    const rot = (random(`sr${k}`) - 0.5) * 18;
    const y = mix(restY - 1100, restY, p);
    const bounce = f > land ? Math.exp(-(f - land) / 3) * Math.sin((f - land) * 1.2) * 4 : 0;
    sheets.push(<IsoSheet key={k} cx={cx} cy={y - bounce} header={greys[k % greys.length]} rot={rot + (1 - p) * 20} />);
  }
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <LightBg drift={f * 0.4} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={540} cy={base + 210} rx={380} ry={60} fill="rgba(43,15,102,0.10)" opacity={ourP} />
        {ourP > 0 ? <IsoSheet cx={ourPos[0]} cy={ourPos[1]} header={C.purple} scale={mix(0.5, 1, ourP)} rot={mix(-14, 4, ourP)} /> : null}
        {sheets}
        {/* x-ray: our résumé seen through the pile */}
        {xray > 0 ? <IsoSheet cx={540} cy={base} header={C.purple} rot={4} opacity={0.32 * xray} outline={pulse} /> : null}
      </svg>
      {xray > 0 ? (
        <div style={{ position: "absolute", left: 96, top: base + 4, opacity: xray, transform: `scale(${0.8 + 0.2 * xray})` }}>
          <Chip bg={C.purple} color="#fff" size={30}>
            You
          </Chip>
        </div>
      ) : null}
      {/* the job board */}
      {boardOut < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 100,
            top: 300,
            width: 880,
            height: 500,
            borderRadius: 36,
            background: "#fff",
            boxShadow: "0 30px 70px rgba(43,15,102,0.14), 0 0 0 1px rgba(29,29,31,0.05)",
            overflow: "hidden",
            opacity: boardIn * (1 - boardOut),
            transform: `translateY(${-boardOut * 120 + (1 - boardIn) * 40}px)`,
          }}
        >
          <div style={{ height: 76, display: "flex", alignItems: "center", gap: 12, padding: "0 28px", borderBottom: "1px solid #EEEEF2" }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <span key={c} style={{ width: 16, height: 16, borderRadius: "50%", background: c }} />
            ))}
            <div style={{ marginLeft: 24, flex: 1, height: 40, borderRadius: 20, background: "#F2F2F6" }} />
          </div>
          <div style={{ position: "absolute", left: 24, right: 24, top: 90 - scroll }}>
            {Array.from({ length: 60 }, (_, i) => (
              <div key={i} style={{ height: rowH, paddingBottom: 14, boxSizing: "border-box" }}>
                <BoardRow i={i} ours={i === oursIndex} lit={i === oursIndex ? prog(f, stop - 6, 10) : 0} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <Cursor x={me[0]} y={me[1]} color={C.purple} label="You" size={1.1} press={press} opacity={(1 - boardOut) * prog(f, 0, 8)} />
    </div>
  );
};

/* ================================================================== stat: interview rate by where you apply */

export const Stat: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const boards = useEvent("boards");
  const company = useEvent("company");
  const twice = useEvent("twice");
  const base = 1270;
  const maxH = 700;
  const hB = (3.4 / 6.0) * maxH;
  const gB = prog(f, boards, 26, Easing.bezier(0.2, 0.9, 0.2, 1));
  const gC = spring({ frame: f - company, fps, config: { damping: 13, stiffness: 90, mass: 1 } });
  const cTop = base - maxH * gC;
  const bTop = base - hB * gB;
  const arrowP = prog(f, twice - 4, 16, Easing.bezier(0.3, 0, 0.2, 1));
  const arrowD = "M 690 750 C 690 590, 610 492, 500 486";
  const ev = evolvePath(Math.max(0.0001, arrowP), arrowD);
  const pill = spring({ frame: f - twice - 4, fps, config: { damping: 11, stiffness: 160 } });
  const bar = (x: number, h: number, top: number, fill: string) => (
    <div style={{ position: "absolute", left: x - 130, top, width: 260, height: Math.max(0, h), borderRadius: "34px 34px 10px 10px", background: fill }} />
  );
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <LightBg drift={f * 0.4} />
      <In at={0} style={{ position: "absolute", left: 90, right: 90, top: 290, textAlign: "center" }}>
        <div style={{ fontFamily: F.display, fontSize: 60, fontWeight: 600, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1.08 }}>Interview rate, by where you apply</div>
      </In>
      {bar(330, maxH * gC, cTop, `linear-gradient(180deg, ${C.violet} 0%, ${C.purple} 55%, ${C.deep} 100%)`)}
      {bar(750, hB * gB, bTop, "linear-gradient(180deg, #D9D9DF 0%, #C4C4CC 100%)")}
      <div style={{ position: "absolute", left: 330 - 200, width: 400, top: cTop - 116, textAlign: "center", opacity: prog(f, company, 8) }}>
        <span style={{ fontFamily: F.display, fontSize: 104, fontWeight: 700, letterSpacing: "-0.045em", color: C.deep }}>
          <Counter to={6.0} at={company} dur={30} decimals={1} suffix="%" />
        </span>
      </div>
      <div style={{ position: "absolute", left: 750 - 200, width: 400, top: bTop - 104, textAlign: "center", opacity: prog(f, boards, 8) }}>
        <span style={{ fontFamily: F.display, fontSize: 88, fontWeight: 700, letterSpacing: "-0.045em", color: C.ink2 }}>
          <Counter to={3.4} at={boards} dur={26} decimals={1} suffix="%" />
        </span>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <defs>
          <marker id="head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.purple} />
          </marker>
        </defs>
        {arrowP > 0 ? (
          <path d={arrowD} fill="none" stroke={C.purple} strokeWidth={7} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} markerEnd={arrowP > 0.95 ? "url(#head)" : undefined} />
        ) : null}
      </svg>
      {f >= twice + 4 ? (
        <div style={{ position: "absolute", left: 704, top: 500, transform: `scale(${pill})`, transformOrigin: "0% 50%" }}>
          <Chip bg={C.purple} color="#fff" size={44} style={{ fontFamily: F.display, fontWeight: 700, boxShadow: "0 14px 30px rgba(91,33,182,0.35)" }}>
            1.8×
          </Chip>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: base, height: 3, background: "#E4E1EE" }} />
      <In at={company - 4} style={{ position: "absolute", left: 330 - 170, width: 340, top: base + 26, textAlign: "center" }}>
        <div style={{ fontFamily: F.text, fontSize: 36, fontWeight: 600, color: C.ink, lineHeight: 1.2 }}>Company career site</div>
      </In>
      <In at={boards} style={{ position: "absolute", left: 750 - 170, width: 340, top: base + 26, textAlign: "center" }}>
        <div style={{ fontFamily: F.text, fontSize: 36, fontWeight: 600, color: C.ink2, lineHeight: 1.2 }}>Job boards</div>
      </In>
      <In at={twice + 10} y={10} style={{ position: "absolute", left: 0, right: 0, top: 1440, textAlign: "center" }}>
        <div style={{ fontFamily: F.text, fontSize: 26, color: C.faint }}>Huntr, Q3 2026. 84,753 applications.</div>
      </In>
    </div>
  );
};

/* ================================================================== reveal: that's where Tahoe looks */

export const Reveal: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wipe = useEvent("wipe");
  const mark = useEvent("mark");
  const r = interpolate(f, [wipe, wipe + 16], [0, 1250], { ...clamp, easing: Easing.bezier(0.5, 0, 0.2, 1) });
  const sp = spring({ frame: f - mark, fps, config: { damping: 12, stiffness: 140, mass: 0.8 } });
  const word = prog(f, mark + 5, 16);
  const rings = [0, 10, 20].map((d) => {
    const p = prog(f, mark + 2 + d, 34, Easing.bezier(0.2, 0.6, 0.3, 1));
    return p > 0 && p < 1 ? <circle key={d} cx={540} cy={820} r={130 + p * 520} fill="none" stroke={R.glow} strokeWidth={3} opacity={(1 - p) * 0.6} /> : null;
  });
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <LightBg />
      <div
        style={{
          position: "absolute",
          left: 540 - r,
          top: 900 - r,
          width: 2 * r,
          height: 2 * r,
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 45%, #8B5CF6 0%, ${C.purple} 30%, #4C1D95 75%, ${R.night2} 100%)`,
        }}
      />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {rings}
      </svg>
      <div style={{ position: "absolute", left: 540 - 120, top: 820 - 120, transform: `scale(${0.3 + 0.7 * sp})`, opacity: prog(f, mark - 1, 5) }}>
        <CatMark size={240} glow={1.2} ring="rgba(255,255,255,0.35)" />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 990, textAlign: "center", opacity: word, transform: `translateY(${(1 - word) * 30}px)`, filter: word < 1 ? `blur(${(1 - word) * 10}px)` : undefined }}>
        <Wordmark size={132} color="#fff" spark={R.glow} />
      </div>
    </div>
  );
};

/* ================================================================== feature: every hour, 220K+ career sites */

const CX = 540;
const CY = 860;
const SP = 36;
type Dot = { x: number; y: number; a: number; fresh: boolean; i: number };
const DOTS: Dot[] = (() => {
  const out: Dot[] = [];
  let i = 0;
  for (let y = SP / 2; y < 1920; y += SP) {
    for (let x = SP / 2 + (Math.round(y / SP) % 2 ? SP / 2 : 0); x < 1080; x += SP) {
      const dx = x - CX;
      const dy = y - CY;
      if (Math.hypot(dx, dy) < 380) continue;
      const a = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
      out.push({ x, y, a, fresh: random(`fd${i}`) < 0.035, i });
      i++;
    }
  }
  return out;
})();
// the three green dots the cards fly out of (one per card, spread around the dial)
const SOURCES = [DOTS.find((d) => d.fresh && d.a > 40 && d.a < 70)!, DOTS.find((d) => d.fresh && d.a > 150 && d.a < 200)!, DOTS.find((d) => d.fresh && d.a > 260 && d.a < 300)!];

export const Feature: React.FC = () => {
  const f = useCurrentFrame();
  const sweepAt = useEvent("sweep");
  const countAt = useEvent("count");
  const cardsAt = useEvent("cards");
  const c0 = useCue(0);
  const sweepEnd = c0.endFrame + 8;
  const span = sweepEnd - sweepAt;
  const s = 360 * interpolate(f, [sweepAt, sweepEnd], [0, 1], clamp);
  const dim = prog(f, cardsAt - 8, 16);
  const tick = (a: number) => sweepAt + (a / 360) * span; // frame the hand passes angle a

  const dots = DOTS.map((d) => {
    const passed = s >= d.a && f >= sweepAt;
    const since = passed ? f - tick(d.a) : -1;
    const lit = passed ? Math.max(0, 1 - since / 22) : 0;
    if (d.fresh && passed) {
      const ping = prog(f, tick(d.a), 16);
      return (
        <g key={d.i}>
          {ping < 1 ? <circle cx={d.x} cy={d.y} r={6 + ping * 26} fill="none" stroke={R.fresh} strokeWidth={3} opacity={1 - ping} /> : null}
          <circle cx={d.x} cy={d.y} r={6} fill={R.fresh} opacity={0.95} />
        </g>
      );
    }
    return <circle key={d.i} cx={d.x} cy={d.y} r={3 + 2.2 * lit} fill={lit > 0 ? R.glow : "#B9A6F5"} opacity={0.22 + 0.7 * lit} />;
  });

  const ringR = 330;
  const ringD = `M ${CX} ${CY - ringR} A ${ringR} ${ringR} 0 1 1 ${CX - 0.01} ${CY - ringR}`;
  const ringE = evolvePath(Math.max(0.0001, s / 360), ringD);
  const ticks = Array.from({ length: 60 }, (_, k) => {
    const a = (k / 60) * Math.PI * 2;
    const long = k % 5 === 0;
    const r1 = ringR + 14;
    const r2 = ringR + (long ? 40 : 26);
    return <line key={k} x1={CX + Math.sin(a) * r1} y1={CY - Math.cos(a) * r1} x2={CX + Math.sin(a) * r2} y2={CY - Math.cos(a) * r2} stroke="#fff" strokeOpacity={long ? 0.55 : 0.25} strokeWidth={long ? 5 : 3} strokeLinecap="round" />;
  });
  const handOn = f >= sweepAt && s < 360 ? 1 : interpolate(f, [sweepEnd, sweepEnd + 8], [1, 0], clamp);
  const numIn = prog(f, countAt - 6, 14);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <NightBg cx={CX} cy={CY} />
      <div style={{ position: "absolute", inset: 0, opacity: mix(1, 0.35, dim), transform: `scale(${mix(1, 0.94, dim)})`, transformOrigin: `${CX}px ${CY}px` }}>
        {/* the radar wedge trailing the hand */}
        <div
          style={{
            position: "absolute",
            left: CX - 1400,
            top: CY - 1400,
            width: 2800,
            height: 2800,
            borderRadius: "50%",
            opacity: handOn,
            background: `conic-gradient(from ${s - 60}deg, rgba(196,181,253,0) 0deg, rgba(196,181,253,0.26) 60deg, rgba(196,181,253,0) 60.4deg)`,
          }}
        />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {dots}
        </svg>
      </div>
      {/* the hour dial and the count leave entirely once the jobs arrive */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - dim, transform: `scale(${mix(1, 0.9, dim)})`, transformOrigin: `${CX}px ${CY}px` }}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={CX} cy={CY} r={ringR} fill="rgba(20,8,47,0.55)" stroke="#fff" strokeOpacity={0.16} strokeWidth={3} />
          {ticks}
          {s > 0 ? <path d={ringD} fill="none" stroke={R.glow} strokeWidth={8} strokeLinecap="round" strokeDasharray={ringE.strokeDasharray} strokeDashoffset={ringE.strokeDashoffset} /> : null}
          {handOn > 0 ? (
            <line x1={CX} y1={CY} x2={CX + Math.sin((s * Math.PI) / 180) * 1400} y2={CY - Math.cos((s * Math.PI) / 180) * 1400} stroke="#fff" strokeOpacity={0.75 * handOn} strokeWidth={4} />
          ) : null}
          <circle cx={CX} cy={CY} r={8} fill="#fff" opacity={handOn} />
        </svg>
        <div style={{ position: "absolute", left: CX - 300, width: 600, top: CY - 120, textAlign: "center", opacity: numIn, transform: `scale(${mix(0.85, 1, numIn)})` }}>
          <div style={{ fontFamily: F.display, fontSize: 168, fontWeight: 700, letterSpacing: "-0.05em", color: "#fff", lineHeight: 1 }}>
            <Counter to={220} at={countAt} dur={30} suffix="K+" />
          </div>
          <div style={{ fontFamily: F.text, fontSize: 38, fontWeight: 600, color: R.glow, marginTop: 14 }}>company career sites</div>
        </div>
      </div>
      {FRESH.map((c, k) => {
        const at = cardsAt + k * 8;
        const p = prog(f, at, 20, Easing.bezier(0.2, 0.8, 0.2, 1));
        if (p <= 0) return null;
        const src = SOURCES[k];
        const top = 470 + k * 265;
        const [x, y] = arc([src.x, src.y], [540, top + 112], p, 0.12);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x - 440,
              top: y - 112,
              transform: `scale(${mix(0.08, 1, p)})`,
              opacity: Math.min(1, p * 2),
              filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
            }}
          >
            <JobCard job={c.job} width={880} titleSize={42} footer={<FreshChip text={c.posted} size={28} phase={k * 11} />} />
          </div>
        );
      })}
    </div>
  );
};

/* ================================================================== cta: get there first, then the end card */

export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cursorAt = useEvent("cursor");
  const apply = useEvent("apply");
  const applied = useEvent("applied");
  const late = useEvent("late");
  const lockup = useEvent("lockup");
  const line = useEvent("line");
  const job = FRESH[0];
  const cardTop = 700;
  const btn: [number, number] = [868, cardTop + 34 + 40];
  const me = arc([160, 1560], btn, prog(f, cursorAt, apply - 2 - cursorAt, Easing.bezier(0.3, 0, 0.15, 1)), 0.1);
  const press = interpolate(f, [apply - 2, apply, apply + 5], [0, 1, 0], clamp);
  const done = prog(f, applied - 2, 10);
  const leave = prog(f, lockup - 10, 12, Easing.bezier(0.5, 0, 0.75, 0));
  const sp = spring({ frame: f - lockup, fps, config: { damping: 14, stiffness: 130 } });

  const lateOnes = Array.from({ length: 12 }, (_, i) => {
    const t0 = late + random(`lt${i}`) * 10;
    const p = prog(f, t0, 30, Easing.bezier(0.2, 0.6, 0.3, 1));
    if (p <= 0) return null;
    const ang = (i / 12) * Math.PI * 2 + 0.4;
    const from: [number, number] = [540 + Math.cos(ang) * 1300, 900 + Math.sin(ang) * 1300];
    const to: [number, number] = [520 + Math.cos(ang) * (400 + random(`lr${i}`) * 60), 820 + Math.sin(ang) * (470 + random(`lq${i}`) * 60)];
    const [x, y] = arc(from, to, p, 0.05);
    const [wx, wy] = p >= 1 ? wander(`lw${i}`, f, 6) : [0, 0];
    return <Cursor key={i} x={x + wx} y={y + wy} color={CROWD_COLORS[i % CROWD_COLORS.length]} label={i < 5 ? CROWD_NAMES[i + 3] : undefined} size={0.95} opacity={0.85} />;
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <LightBg drift={f * 0.4} />
      {leave < 1 ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - leave, filter: leave > 0 ? `blur(${leave * 12}px)` : undefined, transform: `scale(${1 - 0.04 * leave})` }}>
          <In at={0} style={{ position: "absolute", left: 100, top: cardTop }}>
            <JobCard
              job={job.job}
              width={880}
              titleSize={42}
              right={
                <div
                  style={{
                    height: 80,
                    padding: "0 30px",
                    borderRadius: 999,
                    background: done > 0.5 ? C.deep : C.purple,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: F.text,
                    fontSize: 30,
                    fontWeight: 600,
                    transform: `scale(${1 - 0.06 * press + 0.08 * Math.sin(Math.PI * done)})`,
                    boxShadow: "0 12px 26px rgba(91,33,182,0.3)",
                  }}
                >
                  {done > 0.5 ? (
                    <>
                      <Check size={34} p={prog(f, applied, 12)} />
                      Applied
                    </>
                  ) : (
                    "Apply"
                  )}
                </div>
              }
              footer={<FreshChip text={job.posted} size={28} />}
            />
          </In>
          <Burst x={btn[0]} y={btn[1]} at={applied} r0={70} r1={130} n={10} />
          {lateOnes}
          <Cursor x={me[0]} y={me[1]} color={C.purple} label="You" size={1.15} press={press} opacity={prog(f, cursorAt, 6)} />
        </div>
      ) : null}
      {f >= lockup - 2 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
            <div style={{ transform: `scale(${0.5 + 0.5 * sp})`, opacity: prog(f, lockup - 2, 6) }}>
              <CatMark size={190} glow={0.8} />
            </div>
            <In at={lockup + 4} y={20}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Wordmark size={112} />
                <div style={{ fontFamily: F.text, fontSize: 38, color: C.sub, fontWeight: 500, marginTop: 4 }}>for job seekers</div>
              </div>
            </In>
          </div>
          <In at={line} y={26} style={{ position: "absolute", left: 80, right: 80, top: 1060, textAlign: "center" }}>
            <div style={{ fontFamily: F.display, fontSize: 64, fontWeight: 600, letterSpacing: "-0.03em", color: C.ink }}>Free to start. No credit card.</div>
          </In>
          <In at={line + 8} y={20} style={{ position: "absolute", left: 0, right: 0, top: 1170, display: "flex", justifyContent: "center" }}>
            <Chip bg={C.tint} color={C.deep} size={34} style={{ fontFamily: F.ui, padding: "18px 32px" }}>
              tahoe.workonward.com
            </Chip>
          </In>
          <In at={line + 18} y={10} style={{ position: "absolute", left: 0, right: 0, top: 1380, display: "flex", justifyContent: "center" }}>
            <WorkOnward size={26} />
          </In>
        </>
      ) : null}
    </div>
  );
};

export const FRESH_SCENES: Record<string, React.FC> = { hook: Hook, problem: Problem, stat: Stat, reveal: Reveal, feature: Feature, cta: Cta };
