import React, { CSSProperties, ReactNode } from "react";
import { Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { mix, prog } from "../lib/motion";
import { BRAND, C, UI, clamp } from "../seeker/theme";

// Vector kit for 30 s Instagram reels (1080 x 1920). Everything here is drawn in SVG or CSS shapes, so it stays
// sharp at any size; the only bitmap is Tahoe's own cat mark. Text follows the house copy rules (no dashes,
// no eyebrows) and never repeats the narration.

export const R = {
  ...C,
  night: "#14082F",
  night2: "#2B0F66",
  glow: "#C4B5FD",
  fresh: "#22C55E",
  freshTint: "#DCFCE7",
  freshInk: "#15803D",
};

/** Instagram covers the top (profile row) and the bottom (caption, buttons): keep words inside this box. */
export const SAFE = { top: 250, bottom: 1480, left: 80, right: 1000 };

const TEXT = "'SK Text', 'Inter', system-ui, sans-serif";
const DISPLAY = "'SK Display', 'Inter Display', 'Inter', system-ui, sans-serif";
export const F = { text: TEXT, display: DISPLAY, brand: BRAND, ui: UI };

/* ------------------------------------------------------------------ backgrounds */

/** White to a faint lilac with a fine dot grid that fades out toward the edges. */
export const LightBg: React.FC<{ drift?: number }> = ({ drift = 0 }) => {
  const mask = "radial-gradient(ellipse 75% 60% at 50% 45%, black 25%, transparent 90%)";
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #FFFFFF 0%, #F4EFFF 100%)", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -80,
          backgroundImage: "radial-gradient(rgba(124,58,237,0.16) 2px, transparent 2.4px)",
          backgroundSize: "40px 40px",
          transform: `translateY(${drift % 40}px)`,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      />
    </div>
  );
};

export const NightBg: React.FC<{ cx?: number; cy?: number }> = ({ cx = 540, cy = 880 }) => (
  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${cx}px ${cy}px, #3A1590 0%, ${R.night2} 35%, ${R.night} 80%)` }} />
);

/* ------------------------------------------------------------------ cursors */

const ARROW = "M3 2 L3 35 L11.5 26.5 L17.5 40 L24 37 L18 23.5 L30 23.5 Z";

/** A pointer whose tip sits at (x, y), with an optional name tag (multiplayer-cursor style). */
export const Cursor: React.FC<{ x: number; y: number; color: string; label?: string; size?: number; press?: number; opacity?: number; style?: CSSProperties }> = ({
  x,
  y,
  color,
  label,
  size = 1,
  press = 0,
  opacity = 1,
  style,
}) => {
  const s = size * (1 - 0.12 * press);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, transformOrigin: "0 0", opacity, ...style }}>
      <svg width={34} height={44} viewBox="0 0 34 44" style={{ position: "absolute", left: -3, top: -2, overflow: "visible", filter: "drop-shadow(0 4px 6px rgba(20,8,47,0.25))" }}>
        <path d={ARROW} fill={color} stroke="#fff" strokeWidth={2.6} strokeLinejoin="round" />
      </svg>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 26,
            top: 36,
            padding: "6px 14px",
            borderRadius: 999,
            background: color,
            color: "#fff",
            fontFamily: TEXT,
            fontSize: 24,
            fontWeight: 600,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 10px rgba(20,8,47,0.18)",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

export const CROWD_COLORS = ["#F97316", "#0EA5E9", "#10B981", "#F43F5E", "#EAB308", "#64748B", "#14B8A6", "#EC4899", "#3B82F6", "#84CC16", "#A16207", "#6366F1"];
export const CROWD_NAMES = ["Maya", "Jordan", "Sam", "Priya", "Leo", "Ana", "Chen", "Omar", "Kai", "Zoe", "Ravi", "Elena", "Noah", "Ivy", "Mateo", "Aisha"];

/* ------------------------------------------------------------------ invented company marks */

export type GlyphKind = "pine" | "wave" | "sun" | "arc" | "stack";

/** A made-up company's logo: a rounded tile with a simple geometric mark (no real brands). */
export const CompanyGlyph: React.FC<{ kind: GlyphKind; hue: string; hue2: string; size: number }> = ({ kind, hue, hue2, size }) => {
  const id = `g-${kind}-${hue.slice(1)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flex: "none" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={hue} />
          <stop offset="1" stopColor={hue2} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" rx="26" fill={`url(#${id})`} />
      {kind === "pine" && (
        <g fill="#fff">
          <path d="M50 18 L72 50 L60 50 L76 72 L24 72 L40 50 L28 50 Z" opacity="0.95" />
          <rect x="46" y="72" width="8" height="12" rx="2" />
        </g>
      )}
      {kind === "wave" && (
        <g fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round">
          <path d="M20 42 C30 32, 40 32, 50 42 S70 52, 80 42" />
          <path d="M20 62 C30 52, 40 52, 50 62 S70 72, 80 62" opacity="0.7" />
        </g>
      )}
      {kind === "sun" && (
        <g fill="#fff">
          <circle cx="50" cy="56" r="16" />
          <rect x="18" y="72" width="64" height="7" rx="3.5" opacity="0.8" />
          {[-60, -30, 0, 30, 60].map((a) => (
            <rect key={a} x="47.5" y="18" width="5" height="13" rx="2.5" transform={`rotate(${a} 50 56)`} />
          ))}
        </g>
      )}
      {kind === "arc" && (
        <g fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round">
          <path d="M26 72 A26 26 0 0 1 74 72" />
          <path d="M40 72 A10 10 0 0 1 60 72" opacity="0.75" />
        </g>
      )}
      {kind === "stack" && (
        <g fill="#fff">
          <rect x="24" y="24" width="52" height="14" rx="7" />
          <rect x="24" y="43" width="40" height="14" rx="7" opacity="0.8" />
          <rect x="24" y="62" width="28" height="14" rx="7" opacity="0.6" />
        </g>
      )}
    </svg>
  );
};

/* ------------------------------------------------------------------ small UI pieces */

export const Chip: React.FC<{ children: ReactNode; bg?: string; color?: string; size?: number; style?: CSSProperties }> = ({ children, bg = C.surface, color = C.ink2, size = 26, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.4,
      padding: `${size * 0.32}px ${size * 0.62}px`,
      borderRadius: 999,
      background: bg,
      color,
      fontFamily: TEXT,
      fontSize: size,
      fontWeight: 600,
      letterSpacing: "-0.01em",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

/** A green "Posted N minutes ago" chip with a dot that keeps pinging (the app's own wording for fresh jobs). */
export const FreshChip: React.FC<{ text: string; size?: number; phase?: number }> = ({ text, size = 26, phase = 0 }) => {
  const f = useCurrentFrame();
  const k = ((f + phase) % 36) / 36;
  return (
    <Chip bg={R.freshTint} color={R.freshInk} size={size}>
      <span style={{ position: "relative", width: size * 0.42, height: size * 0.42 }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: R.fresh }} />
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: R.fresh, opacity: 0.5 * (1 - k), transform: `scale(${1 + 1.6 * k})` }} />
      </span>
      {text}
    </Chip>
  );
};

const HEART = "M12 21s-7.4-4.5-9.5-9.1C0.9 8.4 3 4.6 6.6 4.6c2.1 0 3.5 1.2 4.4 2.6 0.9-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.8 4.2 7.3C19.4 16.5 12 21 12 21z";

/** Save button: an outlined heart that fills and pops when `on` goes 0 -> 1. */
export const Heart: React.FC<{ size: number; on: number }> = ({ size, on }) => {
  const pop = on > 0 && on < 1 ? 1 + 0.25 * Math.sin(on * Math.PI) : 1;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: on > 0.5 ? C.tint : C.surface, display: "grid", placeItems: "center" }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" style={{ transform: `scale(${pop})`, overflow: "visible" }}>
        <path d={HEART} fill={C.purple} fillOpacity={on} stroke={on > 0.5 ? C.purple : C.faint} strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** Short strokes flying out of a point (a save, a click). */
export const Burst: React.FC<{ x: number; y: number; at: number; color?: string; r0?: number; r1?: number; n?: number }> = ({ x, y, at, color = C.purple, r0 = 40, r1 = 90, n = 8 }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 16, Easing.bezier(0.2, 0.9, 0.3, 1));
  if (f < at || p >= 1) return null;
  const fade = 1 - prog(f, at + 6, 10);
  return (
    <svg style={{ position: "absolute", left: x - r1 - 10, top: y - r1 - 10, overflow: "visible" }} width={2 * r1 + 20} height={2 * r1 + 20}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.3;
        const ra = mix(r0 * 0.6, r0 + (r1 - r0) * 0.55, p);
        const rb = mix(r0 * 0.6, r1, p);
        const c = r1 + 10;
        return <line key={i} x1={c + Math.cos(a) * ra} y1={c + Math.sin(a) * ra} x2={c + Math.cos(a) * rb} y2={c + Math.sin(a) * rb} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={fade} />;
      })}
    </svg>
  );
};

/** A tick that draws itself. */
export const Check: React.FC<{ size: number; p: number; color?: string; width?: number }> = ({ size, p, color = "#fff", width = 3.2 }) => {
  const d = "M5 12.5 L10 17.5 L19 7.5";
  const e = evolvePath(Math.max(0.0001, p), d);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={e.strokeDasharray} strokeDashoffset={e.strokeDashoffset} />
    </svg>
  );
};

/* ------------------------------------------------------------------ job card */

export type Job = { title: string; company: string; place: string; glyph: GlyphKind; hue: string; hue2: string };

/** The film's job card: company mark, title, company and place, then whatever goes in the footer. */
export const JobCard: React.FC<{ job: Job; width: number; scale?: number; right?: ReactNode; footer?: ReactNode; style?: CSSProperties; titleSize?: number }> = ({
  job,
  width,
  right,
  footer,
  style,
  titleSize = 46,
}) => (
  <div
    style={{
      width,
      boxSizing: "border-box",
      padding: "34px 36px",
      borderRadius: 40,
      background: "#fff",
      boxShadow: "0 30px 70px rgba(43,15,102,0.16), 0 0 0 1px rgba(29,29,31,0.05)",
      fontFamily: TEXT,
      ...style,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <CompanyGlyph kind={job.glyph} hue={job.hue} hue2={job.hue2} size={titleSize * 1.9} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: titleSize, fontWeight: 600, letterSpacing: "-0.025em", color: C.ink, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</div>
        <div style={{ fontSize: titleSize * 0.6, fontWeight: 500, color: C.sub, marginTop: 8, whiteSpace: "nowrap" }}>
          {job.company} · {job.place}
        </div>
      </div>
      {right}
    </div>
    {footer ? <div style={{ marginTop: 26 }}>{footer}</div> : null}
  </div>
);

/* ------------------------------------------------------------------ résumé sheet, seen from above at an angle */

/** One résumé lying on a desk, drawn flat and tipped into isometric view. Tip of the transform at (cx, cy). */
export const IsoSheet: React.FC<{ cx: number; cy: number; header: string; rot?: number; scale?: number; opacity?: number; outline?: number }> = ({
  cx,
  cy,
  header,
  rot = 0,
  scale = 1,
  opacity = 1,
  outline = 0,
}) => {
  const W = 340;
  const H = 440;
  const iso = `matrix(${0.866 * scale} ${0.5 * scale} ${-0.866 * scale} ${0.5 * scale} ${cx} ${cy})`;
  const sheet = (
    <g transform={`rotate(${rot})`}>
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={18} fill="#fff" />
      <rect x={-W / 2} y={-H / 2} width={W} height={70} rx={18} fill={header} />
      <rect x={-W / 2} y={-H / 2 + 40} width={W} height={30} fill={header} />
      <circle cx={-W / 2 + 62} cy={-H / 2 + 128} r={34} fill={header} opacity={0.35} />
      <rect x={-W / 2 + 112} y={-H / 2 + 104} width={150} height={18} rx={9} fill="#D9D6E3" />
      <rect x={-W / 2 + 112} y={-H / 2 + 136} width={100} height={14} rx={7} fill="#E8E5F0" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={-W / 2 + 30} y={-H / 2 + 200 + i * 34} width={i % 3 === 2 ? 190 : 280} height={14} rx={7} fill="#ECEAF2" />
      ))}
    </g>
  );
  return (
    <g>
      <g opacity={opacity}>
        {/* paper edge */}
        <g transform={`translate(0 ${6 * scale})`}>
          <g transform={iso}>
            <g transform={`rotate(${rot})`}>
              <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={18} fill="#D8D2E8" />
            </g>
          </g>
        </g>
        <g transform={iso}>{sheet}</g>
      </g>
      {outline > 0 ? (
        <g transform={iso}>
          <g transform={`rotate(${rot})`}>
            <rect x={-W / 2 - 6} y={-H / 2 - 6} width={W + 12} height={H + 12} rx={22} fill="none" stroke={C.purple} strokeWidth={7} strokeDasharray="22 14" opacity={outline} />
          </g>
        </g>
      ) : null}
    </g>
  );
};

/* ------------------------------------------------------------------ brand */

export const CatMark: React.FC<{ size: number; glow?: number; ring?: string }> = ({ size, glow = 1, ring = "rgba(255,255,255,0.0)" }) => (
  <Img
    src={staticFile("seeker/brand/tahoe-cat-mark.png")}
    style={{ width: size, height: size, borderRadius: "50%", boxShadow: `0 ${size * 0.08}px ${size * 0.34}px rgba(20,8,47,${0.35 * glow}), 0 0 0 ${size * 0.025}px ${ring}` }}
  />
);

/** "tahoe ✦" as the site sets it (Sora 700); the spark takes `spark`. */
export const Wordmark: React.FC<{ size: number; color?: string; spark?: string }> = ({ size, color = C.ink, spark = C.purple }) => (
  <span style={{ fontFamily: BRAND, fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", color, display: "inline-flex", alignItems: "baseline", gap: size * 0.16 }}>
    tahoe
    <span style={{ color: spark, fontSize: size * 0.62, transform: `translateY(${-size * 0.28}px)`, display: "inline-block" }}>✦</span>
  </span>
);

export const WorkOnward: React.FC<{ size: number; label?: string }> = ({ size, label = "Powered by" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.55, fontFamily: TEXT, fontSize: size, color: C.faint, fontWeight: 500 }}>
    {label}
    <Img src={staticFile("seeker/brand/workonward-logo.svg")} style={{ height: size * 1.25 }} />
  </div>
);

/* ------------------------------------------------------------------ motion helpers */

/** Ease a point along a gentle arc from a to b (cursors, flying cards). */
export const arc = (a: [number, number], b: [number, number], p: number, lift = 0.18): [number, number] => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * lift;
  const q = 1 - p;
  return [q * q * a[0] + 2 * q * p * mx + p * p * b[0], q * q * a[1] + 2 * q * p * my + p * p * b[1]];
};

/** A small, smooth wander so things that have arrived still look alive. */
export const wander = (seed: string, f: number, amp: number): [number, number] => [
  amp * Math.sin(f / (11 + 6 * random(seed + "a")) + 6.28 * random(seed + "b")),
  amp * Math.cos(f / (13 + 6 * random(seed + "c")) + 6.28 * random(seed + "d")),
];

/** Rise, un-blur and fade in at `at`; leave (up, blurred) at `out`. */
export const In: React.FC<{ at: number; out?: number; y?: number; dur?: number; style?: CSSProperties; children: ReactNode }> = ({ at, out = 1e9, y = 30, dur = 18, style, children }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur);
  const q = prog(f, out, 12, Easing.bezier(0.5, 0, 0.75, 0));
  const o = p * (1 - q);
  if (o <= 0.001) return null;
  return <div style={{ opacity: o, transform: `translateY(${(1 - p) * y - q * 24}px)`, filter: o < 0.999 ? `blur(${(1 - p) * 12 + q * 10}px)` : undefined, ...style }}>{children}</div>;
};

export const fade = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);

/* ------------------------------------------------------------------ type faces for the reel series */

/** System faces on this Mac (renders run here) plus the seeker fonts, so each reel can have its own voice in type. */
export const FACE = {
  serif: "Charter, Georgia, serif",
  didot: "Didot, 'Bodoni 72', Georgia, serif",
  mono: "Menlo, 'SF Mono', Monaco, monospace",
  kr: "'SK KR', 'Apple SD Gothic Neo', system-ui, sans-serif",
  krSerif: "AppleMyungjo, 'Nanum Myeongjo', serif",
  display: DISPLAY,
  text: TEXT,
  brand: BRAND,
};
