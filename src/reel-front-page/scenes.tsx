import React from "react";
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { evolvePath } from "@remotion/paths";
import { Counter, mix, prog } from "../lib/motion";
import { useEvent, useSceneData } from "../lib/scene";
import { clamp } from "../seeker/theme";
import { useLang } from "../reel/Film";
import { CatMark, FACE, In, WorkOnward, Wordmark, arc } from "../reel/kit";
import { STAT, useCopy } from "./copy";

// "Front Page" (search reel, 30 s, 9:16). A news story: about one in five job-board ads is a ghost (Greenhouse data
// via the WSJ, Aug 2026); Tahoe skips the boards and reads each company's own career site (220K+), checks every job
// daily and marks closed ones closed. Newsprint, black ink, halftone; Tahoe purple only from the reveal on.
// Scenes hand over with a page turn (src/reel/shells.tsx PageTurn).

const P = { paper: "#F2EDE2", paper2: "#E9E2D3", ink: "#151412", ink2: "#3B3833", grey: "#8C857A", rule: "#24221F", blue: "#1F4FA8", green: "#1B7F4B", red: "#C2362B", purple: "#7C3AED" };

const useFaces = () => {
  const ko = useLang() === "ko";
  return {
    ko,
    mast: ko ? FACE.krSerif : FACE.didot,
    head: ko ? FACE.kr : FACE.serif,
    body: ko ? FACE.kr : FACE.serif,
    sans: ko ? FACE.kr : FACE.text,
  };
};

/* ------------------------------------------------------------------ paper, rules, filler text */

export const Paper: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 70% at 50% 45%, ${P.paper} 0%, ${P.paper2} 100%)` }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.32, mixBlendMode: "multiply" }}>
      <filter id="fibers">
        <feTurbulence type="fractalNoise" baseFrequency="0.9 0.08" numOctaves={2} seed={4} />
        <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.32  0 0 0 0.35 0" />
      </filter>
      <rect width={1080} height={1920} filter="url(#fibers)" />
    </svg>
  </div>
);

/** Film grain and a soft vignette over the whole reel. */
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.13, mixBlendMode: "multiply" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={f % 7} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
        </filter>
        <rect width={1080} height={1920} filter="url(#grain)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 65% at 50% 48%, transparent 55%, rgba(40,30,15,0.28) 100%)" }} />
    </div>
  );
};

const DoubleRule: React.FC<{ y: number; x?: number; w?: number; p?: number }> = ({ y, x = 70, w = 940, p = 1 }) => (
  <>
    <div style={{ position: "absolute", left: x, top: y, width: w * p, height: 6, background: P.rule }} />
    <div style={{ position: "absolute", left: x, top: y + 12, width: w * p, height: 2, background: P.rule }} />
  </>
);

/** Newspaper body copy as grey bars (never readable words: the echo check reads the screen). */
const Columns: React.FC<{ x: number; y: number; w: number; h: number; cols?: number; seed: string; opacity?: number }> = ({ x, y, w, h, cols = 3, seed, opacity = 1 }) => {
  const gap = 26;
  const cw = (w - gap * (cols - 1)) / cols;
  const lines = Math.floor(h / 22);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity }}>
      {Array.from({ length: cols }, (_, c) => (
        <div key={c} style={{ position: "absolute", left: c * (cw + gap), top: 0, width: cw }}>
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} style={{ height: 9, marginBottom: 13, borderRadius: 2, background: "#BDB5A6", width: `${i % 7 === 6 ? 45 + random(`${seed}${c}${i}`) * 25 : 92 + random(`${seed}${c}${i}`) * 8}%` }} />
          ))}
        </div>
      ))}
      {Array.from({ length: cols - 1 }, (_, c) => (
        <div key={`r${c}`} style={{ position: "absolute", left: (c + 1) * (cw + gap) - gap / 2, top: 0, width: 1.5, height: h, background: "#B3AA99" }} />
      ))}
    </div>
  );
};

/** A halftone print of a skyline at dusk, for the front-page photo. */
const Halftone: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const sky = Array.from({ length: Math.ceil(w / 12) * Math.ceil(h / 12) }, (_, i) => {
    const cx = (i % Math.ceil(w / 12)) * 12 + ((Math.floor(i / Math.ceil(w / 12)) % 2) * 6);
    const cy = Math.floor(i / Math.ceil(w / 12)) * 12;
    const d = Math.hypot(cx - w * 0.68, cy - h * 0.42) / (w * 0.6);
    const r = Math.max(0.6, 4.4 * Math.min(1, d) * (0.55 + 0.45 * (cy / h)));
    return <circle key={i} cx={cx} cy={cy} r={r} />;
  });
  const city = "M0 " + h + " L0 " + h * 0.62 + " L60 " + h * 0.62 + " L60 " + h * 0.4 + " L130 " + h * 0.4 + " L130 " + h * 0.55 + " L190 " + h * 0.55 + " L190 " + h * 0.22 + " L250 " + h * 0.22 + " L250 " + h * 0.48 + " L330 " + h * 0.48 + " L330 " + h * 0.33 + " L400 " + h * 0.33 + " L400 " + h * 0.6 + " L470 " + h * 0.6 + " L470 " + h * 0.15 + " L520 " + h * 0.15 + " L520 " + h * 0.5 + " L600 " + h * 0.5 + " L600 " + h * 0.36 + " L680 " + h * 0.36 + " L680 " + h * 0.58 + " L" + w + " " + h * 0.58 + " L" + w + " " + h + " Z";
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <clipPath id="ht-sky">
          <rect width={w} height={h} />
        </clipPath>
        <pattern id="ht-city" width={8} height={8} patternUnits="userSpaceOnUse">
          <circle cx={4} cy={4} r={3.4} fill={P.ink} />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={P.paper} />
      <g clipPath="url(#ht-sky)" fill={P.ink2} opacity={0.75}>
        {sky}
      </g>
      <path d={city} fill="url(#ht-city)" />
    </svg>
  );
};

/** A rubber stamp: rotated, inked, slammed down at `at` (scale 1.6 -> 1, with a short shake). */
const Stamp: React.FC<{ at: number; color: string; rot?: number; size?: number; children: React.ReactNode; style?: React.CSSProperties; font: string }> = ({ at, color, rot = -8, size = 34, children, style, font }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = prog(f, at, 7, Easing.bezier(0.5, 0, 0.9, 0.6));
  const s = mix(1.7, 1, p);
  const shake = f - at < 10 ? Math.sin((f - at) * 2.4) * (1 - (f - at) / 10) * 3 : 0;
  return (
    <div
      style={{
        position: "absolute",
        transform: `rotate(${rot}deg) scale(${s}) translate(${shake}px, 0)`,
        opacity: mix(0, 0.92, Math.min(1, p * 1.6)),
        padding: `${size * 0.22}px ${size * 0.5}px`,
        border: `${Math.max(3, size * 0.11)}px solid ${color}`,
        borderRadius: size * 0.22,
        color,
        fontFamily: font,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        mixBlendMode: "multiply",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ================================================================== story: the front page lands */

export const Story: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCopy();
  const F = useFaces();
  const drop = useEvent("drop");
  const headline = useEvent("headline");
  const push = useEvent("push");
  const applied = useEvent("applied");

  const sp = spring({ frame: f - drop, fps, config: { damping: 16, stiffness: 90, mass: 1 } });
  const zoom = mix(1, 1.1, prog(f, push, 80, Easing.bezier(0.4, 0, 0.2, 1)));
  const wipe = prog(f, headline, 16, Easing.bezier(0.3, 0, 0.2, 1));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Paper />
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - sp) * -260}px) rotate(${(1 - sp) * -5}deg) scale(${zoom})`, transformOrigin: "540px 1000px" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 262, textAlign: "center", fontFamily: F.mast, fontSize: F.ko ? 92 : 104, fontWeight: 700, color: P.ink, letterSpacing: F.ko ? "0.06em" : "-0.01em" }}>{c.masthead}</div>
        <DoubleRule y={398} />
        <div style={{ position: "absolute", left: 70, top: 438, width: 940, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
          {c.headline.map((l, i) => (
            <div key={i} style={{ fontFamily: F.head, fontSize: F.ko ? 84 : 90, fontWeight: F.ko ? 700 : 700, color: P.ink, lineHeight: 1.08, letterSpacing: F.ko ? "-0.02em" : "-0.015em" }}>
              {l}
            </div>
          ))}
        </div>
        {/* the clipping: your application */}
        <div style={{ position: "absolute", left: 110, top: 668, width: 860, border: `3px solid ${P.ink}`, background: P.paper, boxShadow: "0 18px 40px rgba(60,40,10,0.12)" }}>
          <Halftone w={854} h={300} />
          <div style={{ padding: "26px 34px 32px", borderTop: `3px solid ${P.ink}` }}>
            <div style={{ fontFamily: F.head, fontSize: 56, fontWeight: 700, color: P.ink, letterSpacing: "-0.01em" }}>{c.adTitle}</div>
            <div style={{ fontFamily: F.sans, fontSize: 32, color: P.ink2, marginTop: 8 }}>{c.adMeta}</div>
          </div>
          <Stamp at={applied} color={P.blue} rot={-9} size={44} font={F.sans} style={{ right: 34, top: 392 }}>
            {c.applied}
          </Stamp>
        </div>
        <Columns x={70} y={1196} w={940} h={270} seed="story" />
      </div>
    </div>
  );
};

/* ================================================================== ghosts: one ad in five is a ghost */

const AD_W = 170;
const AD_H = 136;
const GHOST_COL = [4, 1, 3, 0];

/** One classified ad. `ghost` 0..1 turns it into a sheet ghost: no fill, dashed edge, wavy hem, two eyes. */
const Ad: React.FC<{ x: number; y: number; ghost: number; seed: string; lift: number }> = ({ x, y, ghost, seed, lift }) => {
  const f = useCurrentFrame();
  const amp = 13 * ghost;
  const ph = f / 7 + random(seed) * 6;
  const waves = 4;
  let hem = "";
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    hem += ` L${(AD_W * (1 - t)).toFixed(1)} ${(AD_H - amp + amp * Math.sin(t * Math.PI * 2 * waves + ph)).toFixed(1)}`;
  }
  const d = `M0 10 Q0 0 10 0 L${AD_W - 10} 0 Q${AD_W} 0 ${AD_W} 10 L${AD_W} ${AD_H - amp}${hem} Z`;
  const sway = ghost > 0 ? Math.sin(f / 9 + random(seed + "s") * 6) * 6 * ghost : 0;
  return (
    <div style={{ position: "absolute", left: x + sway, top: y - lift * 120, width: AD_W, height: AD_H, opacity: 1 - 0.75 * lift }}>
      <svg width={AD_W} height={AD_H + 4} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={d} fill={ghost > 0 ? `rgba(255,255,255,${0.55 * ghost})` : P.paper} stroke={P.ink} strokeWidth={ghost > 0.3 ? 3 : 2.4} strokeDasharray={ghost > 0.3 ? "9 7" : undefined} opacity={1 - 0.35 * ghost} />
      </svg>
      <div style={{ position: "absolute", inset: 0, padding: "16px 16px", opacity: 1 - ghost }}>
        <div style={{ height: 15, width: `${62 + random(seed + "t") * 30}%`, background: P.ink, borderRadius: 2 }} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 8, width: `${70 + random(seed + i) * 28}%`, background: "#B9B1A2", borderRadius: 2, marginTop: 12 }} />
        ))}
        <div style={{ position: "absolute", left: 16, bottom: 14, width: 54, height: 20, border: `2px solid ${P.ink2}`, borderRadius: 4 }} />
      </div>
      {ghost > 0.55 ? (
        <svg width={AD_W} height={AD_H} style={{ position: "absolute", inset: 0, opacity: (ghost - 0.55) / 0.45 }}>
          <ellipse cx={AD_W * 0.38} cy={AD_H * 0.42} rx={9} ry={13} fill={P.ink} />
          <ellipse cx={AD_W * 0.62} cy={AD_H * 0.42} rx={9} ry={13} fill={P.ink} />
        </svg>
      ) : null}
    </div>
  );
};

/** A résumé sheet flying into a ghost ad and vanishing inside it. */
const Sheet: React.FC<{ from: [number, number]; to: [number, number]; at: number; dur: number; rot: number }> = ({ from, to, at, dur, rot }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur, Easing.bezier(0.3, 0, 0.6, 1));
  if (p <= 0 || p >= 1) return null;
  const [x, y] = arc(from, to, p, 0.25);
  const s = mix(1, 0.25, Math.max(0, (p - 0.6) / 0.4));
  return (
    <div style={{ position: "absolute", left: x - 45, top: y - 58, width: 90, height: 116, background: "#fff", borderRadius: 6, boxShadow: "0 10px 20px rgba(40,30,10,0.18)", transform: `rotate(${rot * (1 - p)}deg) scale(${s})`, opacity: 1 - Math.max(0, (p - 0.8) / 0.2), padding: 10, boxSizing: "border-box" }}>
      <div style={{ height: 14, background: P.purple, opacity: 0.0, borderRadius: 3 }} />
      <div style={{ height: 10, width: "60%", background: P.ink2, borderRadius: 3 }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ height: 6, width: `${i % 2 ? 70 : 90}%`, background: "#CFC8BA", borderRadius: 3, marginTop: 8 }} />
      ))}
    </div>
  );
};

export const Ghosts: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const F = useFaces();
  const { durationInFrames } = useSceneData();
  const ghostAt = useEvent("ghost");
  const statAt = useEvent("stat");
  const resumes = useEvent("resumes");
  const nobody = useEvent("nobody");

  const x0 = 87;
  const ys = [420, 570, 720, 870];
  const drift = mix(24, -24, f / durationInFrames);

  const ads = [];
  const targets: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 5; col++) {
      const x = x0 + col * (AD_W + 14);
      const isG = GHOST_COL[r] === col;
      const g = isG ? prog(f, ghostAt + r * 4, 22, Easing.bezier(0.3, 0, 0.2, 1)) : 0;
      const lift = isG ? prog(f, nobody + r * 3, 40, Easing.bezier(0.4, 0, 0.6, 1)) : 0;
      if (isG) targets.push([x + AD_W / 2, ys[r] + AD_H / 2 + drift]);
      ads.push(<Ad key={`${r}-${col}`} x={x} y={ys[r]} ghost={g} lift={lift} seed={`ad${r}${col}`} />);
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Paper />
      <div style={{ position: "absolute", left: 0, right: 0, top: 268, textAlign: "center", fontFamily: F.mast, fontStyle: F.ko ? "normal" : "italic", fontSize: F.ko ? 68 : 76, fontWeight: 700, color: P.ink }}>{c.classifieds}</div>
      <DoubleRule y={376} />
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${drift}px)` }}>{ads}</div>
      {targets.map((t, i) => (
        <Sheet key={i} from={[200 + i * 230, 2050]} to={t} at={resumes + i * 5} dur={26} rot={i % 2 ? 14 : -12} />
      ))}
      <div style={{ position: "absolute", left: 70, top: 1046, width: 940, height: 2, background: P.rule, opacity: prog(f, statAt - 6, 12) }} />
      <In at={statAt} y={36} style={{ position: "absolute", left: 76, top: 1050 }}>
        <div style={{ fontFamily: F.ko ? FACE.serif : F.head, fontSize: 220, fontWeight: 900, color: P.ink, letterSpacing: "-0.04em", lineHeight: 1 }}>
          <Counter to={STAT.value} at={statAt} dur={26} suffix="%" />
        </div>
      </In>
      <In at={statAt + 10} y={24} style={{ position: "absolute", left: 82, top: 1286, width: 920 }}>
        {c.statLabel.map((l, i) => (
          <div key={i} style={{ fontFamily: F.body, fontSize: F.ko ? 40 : 42, lineHeight: 1.22, color: P.ink, fontWeight: i === 1 ? 700 : 400 }}>
            {l}
          </div>
        ))}
      </In>
      <In at={statAt + 18} y={12} style={{ position: "absolute", left: 82, top: 1408, fontFamily: F.sans, fontSize: 25, color: P.grey }}>
        {STAT.source[F.ko ? "ko" : "en"]}
      </In>
    </div>
  );
};

/* ================================================================== turn: Tahoe skips the boards */

export const Turn: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCopy();
  const F = useFaces();
  const mark = useEvent("mark");
  const strike = useEvent("strike");

  const seal = spring({ frame: f - mark, fps, config: { damping: 11, stiffness: 160, mass: 0.8 } });
  const ring = prog(f, mark, 24);
  const line = prog(f, strike, 12, Easing.bezier(0.4, 0, 0.2, 1));
  const strokeD = "M40 64 C 220 48, 420 78, 620 58 S 860 50, 900 60";
  const e = evolvePath(Math.max(0.0001, line), strokeD);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Paper />
      <DoubleRule y={300} />
      <div style={{ position: "absolute", left: 90, top: 400, width: 900, height: 130 }}>
        <div style={{ textAlign: "center", fontFamily: F.mast, fontSize: F.ko ? 112 : 132, fontWeight: 700, color: line > 0 ? `rgba(21,20,18,${1 - 0.55 * line})` : P.ink, letterSpacing: "-0.01em", lineHeight: "130px" }}>{c.boards}</div>
        <svg width={900} height={130} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {line > 0 ? <path d={strokeD} fill="none" stroke={P.purple} strokeWidth={22} strokeLinecap="round" strokeDasharray={e.strokeDasharray} strokeDashoffset={e.strokeDashoffset} opacity={0.92} /> : null}
        </svg>
      </div>
      <div style={{ position: "absolute", left: 540, top: 930, transform: `translate(-50%, -50%) scale(${f < mark ? 0 : mix(1.8, 1, seal)})`, opacity: f < mark ? 0 : Math.min(1, seal * 2) }}>
        <CatMark size={330} glow={0.6} />
      </div>
      {f >= mark ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <circle cx={540} cy={930} r={mix(170, 330, ring)} fill="none" stroke={P.purple} strokeWidth={mix(14, 2, ring)} opacity={(1 - ring) * 0.8} />
        </svg>
      ) : null}
      <In at={mark + 6} y={20} style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center" }}>
        <Wordmark size={104} color={P.ink} spark={P.purple} />
      </In>
      <DoubleRule y={1400} />
    </div>
  );
};

/* ================================================================== source: company career sites, checked daily */

const SITES = [
  { name: "Juniper Row", hue: "#0F766E" },
  { name: "Harbor Finch", hue: "#1D4ED8" },
  { name: "Cedarline", hue: "#C2410C" },
  { name: "Brightarc", hue: "#7E22CE" },
  { name: "Lumen & Pine", hue: "#15803D" },
  { name: "Quill Harbor", hue: "#B45309" },
  { name: "Saltmarsh", hue: "#0369A1" },
  { name: "Fernway", hue: "#4D7C0F" },
  { name: "Copperleaf", hue: "#9F1239" },
];

const Browser: React.FC<{ w: number; h: number; site: { name: string; hue: string }; careers: string; rows?: number; font: string; head: string }> = ({ w, h, site, careers, rows = 3, font, head }) => (
  <div style={{ width: w, height: h, background: "#fff", border: `2.5px solid ${P.ink}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 10px 24px rgba(60,40,10,0.12)" }}>
    <div style={{ height: 34, borderBottom: `2px solid ${P.ink}`, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: P.paper }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", border: `2px solid ${P.ink2}` }} />
      ))}
    </div>
    <div style={{ padding: "18px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: site.hue }} />
        <div style={{ fontFamily: head, fontSize: 26, fontWeight: 700, color: P.ink, whiteSpace: "nowrap" }}>{site.name}</div>
      </div>
      <div style={{ fontFamily: font, fontSize: 22, color: P.grey, marginTop: 12 }}>{careers}</div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ height: 30, marginTop: 12, borderRadius: 8, background: "#F1EEE8", display: "flex", alignItems: "center", padding: "0 10px" }}>
          <div style={{ height: 8, width: `${55 + i * 12}%`, background: "#BDB5A6", borderRadius: 3 }} />
        </div>
      ))}
    </div>
  </div>
);

export const Source: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const F = useFaces();
  const lang = useLang();
  const sites = useEvent("sites");
  const count = useEvent("count");
  const zoomAt = useEvent("zoom");
  const check = useEvent("check");
  const closed = useEvent("closed");

  // phase B: the 3x3 grid shrinks into a mosaic of thousands; phase C: one site up close
  const shrink = prog(f, count - 10, 30, Easing.bezier(0.6, 0, 0.2, 1));
  const toC = prog(f, zoomAt, 20, Easing.bezier(0.6, 0, 0.2, 1));
  const tiles = SITES.map((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const p = prog(f, sites + i * 3, 14, Easing.bezier(0.2, 0.9, 0.3, 1.25));
    return (
      <div key={s.name} style={{ position: "absolute", left: 105 + col * 295, top: 330 + row * 315, transform: `scale(${p})`, opacity: Math.min(1, p * 2) }}>
        <Browser w={280} h={300} site={s} careers={c.careers} font={F.sans} head={F.head} />
      </div>
    );
  });

  const mosaic = [];
  if (shrink > 0) {
    for (let r = 0; r < 26; r++)
      for (let q = 0; q < 15; q++) {
        const k = r * 15 + q;
        const t0 = random(`m${k}`) * 22;
        const o = prog(f, count - 6 + t0, 10);
        const hue = SITES[k % SITES.length].hue;
        mosaic.push(
          <div key={k} style={{ position: "absolute", left: 18 + q * 70, top: 40 + r * 70, width: 60, height: 60, borderRadius: 8, border: `2px solid ${P.ink}`, background: "#fff", opacity: o * (1 - toC) }}>
            <div style={{ margin: 8, height: 14, borderRadius: 4, background: hue }} />
            <div style={{ margin: "0 8px", height: 5, borderRadius: 3, background: "#C9C1B2" }} />
          </div>,
        );
      }
  }

  const rowsY = [640, 800, 960];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Paper />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - toC }}>{mosaic}</div>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${mix(1, 0.18, shrink)})`, transformOrigin: "540px 800px", opacity: 1 - shrink * 0.9 }}>{tiles}</div>
      {/* the count card */}
      <div style={{ position: "absolute", left: 140, top: 640, width: 800, height: 400, background: P.paper, border: `3px solid ${P.ink}`, boxShadow: "0 30px 60px rgba(40,30,10,0.25)", transform: `scale(${mix(0.8, 1, prog(f, count, 14))})`, opacity: prog(f, count, 10) * (1 - toC), textAlign: "center" }}>
        <div style={{ fontFamily: FACE.serif, fontSize: 230, fontWeight: 900, color: P.ink, letterSpacing: "-0.04em", lineHeight: "270px", marginTop: 20 }}>
          <Counter to={220} at={count} dur={30} suffix="K+" />
        </div>
        <div style={{ fontFamily: F.body, fontSize: 46, color: P.ink2 }}>{c.sitesLabel}</div>
      </div>
      {/* one site up close */}
      {toC > 0 ? (
        <div style={{ position: "absolute", left: 90, top: 330, width: 900, transform: `scale(${mix(0.6, 1, toC)})`, transformOrigin: "540px 700px", opacity: toC }}>
          <div style={{ width: 900, height: 1000, background: "#fff", border: `3px solid ${P.ink}`, borderRadius: 22, overflow: "hidden", boxShadow: "0 30px 60px rgba(40,30,10,0.2)" }}>
            <div style={{ height: 56, borderBottom: `3px solid ${P.ink}`, display: "flex", alignItems: "center", gap: 12, padding: "0 22px", background: P.paper }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", border: `3px solid ${P.ink2}` }} />
              ))}
            </div>
            <div style={{ padding: "40px 46px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                <div style={{ width: 84, height: 84, borderRadius: 20, background: SITES[0].hue }} />
                <div>
                  <div style={{ fontFamily: F.head, fontSize: 54, fontWeight: 700, color: P.ink }}>{SITES[0].name}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 32, color: P.grey, marginTop: 4 }}>{c.careers}</div>
                </div>
              </div>
            </div>
          </div>
          {c.rows.map((title, i) => {
            const isClosed = i === 2;
            const dim = isClosed ? prog(f, closed, 10) : 0;
            return (
              <div key={title} style={{ position: "absolute", left: 46, top: rowsY[i] - 330, width: 808, height: 130, borderRadius: 18, background: "#F4F1EA", display: "flex", alignItems: "center", padding: "0 30px", boxSizing: "border-box" }}>
                <div style={{ fontFamily: F.head, fontSize: 44, fontWeight: 600, color: dim ? `rgba(21,20,18,${1 - 0.6 * dim})` : P.ink, textDecoration: dim > 0.5 ? "line-through" : undefined }}>{title}</div>
                <Stamp at={check + i * 6} color={isClosed && f >= closed ? "transparent" : P.green} rot={-6} size={lang === "ko" ? 28 : 26} font={F.sans} style={{ right: 28, top: 38 }}>
                  {c.checked}
                </Stamp>
                {isClosed ? (
                  <Stamp at={closed} color={P.red} rot={-12} size={46} font={F.sans} style={{ right: 70, top: 26 }}>
                    {c.closed}
                  </Stamp>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

/* ================================================================== close: the Tahoe edition */

export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const F = useFaces();
  const front = useEvent("front");
  const lockup = useEvent("lockup");
  const line = useEvent("line");
  const rule = prog(f, front, 24, Easing.bezier(0.4, 0, 0.2, 1));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Paper />
      <div style={{ position: "absolute", left: 0, right: 0, top: 268, display: "flex", alignItems: "center", justifyContent: "center", gap: 26 }}>
        <In at={front} y={20}>
          <CatMark size={118} glow={0.5} />
        </In>
        <In at={front + 4} y={20}>
          <Wordmark size={112} color={P.ink} spark={P.purple} />
        </In>
      </div>
      <DoubleRule y={430} p={rule} />
      <In at={front + 8} y={30} style={{ position: "absolute", left: 70, top: 480, width: 940, textAlign: "center" }}>
        <div style={{ fontFamily: F.ko ? FACE.kr : FACE.serif, fontSize: F.ko ? 210 : 280, fontWeight: 900, color: P.ink, letterSpacing: "-0.045em", lineHeight: 1, whiteSpace: "nowrap" }}>{F.ko ? "500만+" : "5M+"}</div>
        <div style={{ fontFamily: F.head, fontSize: 70, fontWeight: 700, color: P.ink, marginTop: 10 }}>{c.roles}</div>
        <div style={{ fontFamily: F.body, fontSize: 42, color: P.ink2, marginTop: 14 }}>{c.from}</div>
      </In>
      <In at={lockup} y={24} style={{ position: "absolute", left: 170, top: 1070, width: 740 }}>
        <div style={{ border: `5px solid ${P.ink}`, padding: "34px 30px", textAlign: "center", background: "#FBF8F1", boxShadow: `10px 10px 0 ${P.purple}` }}>
          <div style={{ fontFamily: F.head, fontSize: 58, fontWeight: 700, color: P.ink }}>{c.trial}</div>
        </div>
      </In>
      <In at={line} y={10} style={{ position: "absolute", left: 0, right: 0, top: 1392, display: "flex", justifyContent: "center" }}>
        <WorkOnward size={28} />
      </In>
      <Columns x={70} y={1490} w={940} h={300} seed="close" opacity={0.6} />
    </div>
  );
};

export const FRONT_PAGE_SCENES: Record<string, React.FC> = { story: Story, ghosts: Ghosts, turn: Turn, source: Source, close: Close };
