import React, { CSSProperties, ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useSceneData } from "../../lib/scene";
import { prog } from "../../lib/motion";
import { BODY, C, MONO, SANS, SPRING, STANDARD } from "../theme";

export const Icon = {
  Check: ({ size = 28, color = C.blue, stroke = 3 }: { size?: number; color?: string; stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  ),
  X: ({ size = 28, color = C.coral, stroke = 3 }: { size?: number; color?: string; stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
};

// No Eyebrow component here on purpose: this deck never runs a small colored
// kicker label above a headline.

export const Headline: React.FC<{ children: ReactNode; size?: number; style?: CSSProperties }> = ({ children, size = 76, style }) => (
  <div
    style={{
      fontFamily: SANS,
      fontSize: size,
      fontWeight: 700,
      letterSpacing: "-0.03em",
      lineHeight: 1.06,
      color: C.fg,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Body/caption text, Inter, for anything that isn't a headline or code/data. */
export const Body: React.FC<{ children: ReactNode; size?: number; color?: string; style?: CSSProperties }> = ({ children, size = 20, color = C.dim, style }) => (
  <div style={{ fontFamily: BODY, fontSize: size, fontWeight: 500, color, lineHeight: 1.35, ...style }}>{children}</div>
);

/** Code/data text, JetBrains Mono, for the demo, badges of literal values, and chart figures. */
export const Mono: React.FC<{ children: ReactNode; size?: number; color?: string; style?: CSSProperties }> = ({ children, size = 24, color = C.dim, style }) => (
  <span style={{ fontFamily: MONO, fontSize: size, color, letterSpacing: "-0.01em", ...style }}>{children}</span>
);

export const Card: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: C.card,
      border: `1px solid ${C.hairline}`,
      borderRadius: 28,
      boxShadow: "0 2px 6px rgba(19,42,76,0.06), 0 22px 60px rgba(19,42,76,0.10)",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Small labeled pill, e.g. a regulation name or "Beta". Not a kicker: always sits beside or below content, never alone above a headline as its label. */
export const Badge: React.FC<{ children: ReactNode; color?: string; bg?: string; style?: CSSProperties }> = ({ children, color = C.blue, bg = C.blueFaint, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 18px",
      borderRadius: 999,
      background: bg,
      fontFamily: BODY,
      fontSize: 18,
      fontWeight: 600,
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Wraps every scene: slow push-in, and a blur-fade exit that overlaps the next scene. */
export const SceneShell: React.FC<{ children: ReactNode; last?: boolean; overlap: number; push?: number }> = ({ children, last, overlap, push = 0.024 }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useSceneData();
  const exitLen = last ? 30 : overlap + 6;
  const out = interpolate(f, [durationInFrames - exitLen, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = 1 + push * (f / durationInFrames) + out * 0.01;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 1 - out,
        filter: out > 0 && !last ? `blur(${out * 10}px)` : undefined,
        transform: `scale(${scale})`,
        fontFamily: BODY,
        color: C.fg,
      }}
    >
      {children}
    </div>
  );
};

/** Soft glow that blends into the light blue canvas rather than punching a white hole in it. */
export const Glow: React.FC<{ at: number; size?: number; x?: string; y?: string; opacity?: number }> = ({ at, size = 1300, x = "50%", y = "50%", opacity = 0.5 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 1 + 0.03 * Math.sin(f / 24);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `translate(-50%, -50%) scale(${(0.75 + 0.25 * p) * breathe})`,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${C.blueLight}55 0%, ${C.blueFaint}77 45%, transparent 70%)`,
        filter: "blur(120px)",
        opacity: opacity * p,
        pointerEvents: "none",
      }}
    />
  );
};

/**
 * Two-bar-per-row market growth comparison: "today" (muted) vs a projected
 * year (blue), on one shared linear scale. Bars grow with a soft spring
 * overshoot rather than a flat ease. Direct value labels at each bar's end
 * rather than relying on color alone; one small legend row covers the
 * repeated today/projected meaning once for all rows.
 */
export const GrowthChart: React.FC<{
  rows: { label: string; today: number; future: number; futureLabel: string; cagr: string }[];
  max: number;
  at: number;
  width?: number;
}> = ({ rows, max, at, width = 860 }) => {
  const f = useCurrentFrame();
  const barH = 24;
  const gap = 58;
  const trackW = width - 210;

  return (
    <div style={{ width }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 24, opacity: prog(f, at, 16) }}>
        <LegendSwatch color={C.track} label="Today" />
        <LegendSwatch color={C.blue} label="Projected" />
      </div>
      {rows.map((r, i) => {
        const rowAt = at + 6 + i * 10;
        const p = Math.max(0, prog(f, rowAt, 36, SPRING)); // allow >1 overshoot, clamp only the floor
        const todayW = (r.today / max) * trackW * p;
        const futureW = (r.future / max) * trackW * p;
        return (
          <div key={r.label} style={{ marginBottom: gap, opacity: prog(f, rowAt - 4, 16) }}>
            <Body size={22} color={C.fg} style={{ fontWeight: 600, marginBottom: 12 }}>{r.label}</Body>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
              <div style={{ width: trackW, height: barH, background: C.track, borderRadius: barH / 2, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: barH, width: Math.max(Math.min(todayW, trackW), 2), background: C.faint, borderRadius: barH / 2 }} />
              </div>
              <Mono size={18} color={C.dim} style={{ width: 90, flexShrink: 0 }}>today</Mono>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: trackW, height: barH, background: C.track, borderRadius: barH / 2, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: barH, width: Math.max(Math.min(futureW, trackW), 2), background: `linear-gradient(90deg, ${C.blueDeep}, ${C.blue})`, borderRadius: barH / 2 }} />
              </div>
              <Mono size={18} color={C.blue} style={{ width: 90, flexShrink: 0, fontWeight: 700 }}>{r.futureLabel}</Mono>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
              <Badge style={{ fontSize: 14, padding: "4px 12px" }}>{r.cagr}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LegendSwatch: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
    <Body size={17} color={C.dim} style={{ fontWeight: 500 }}>{label}</Body>
  </div>
);

/**
 * Min-to-max range indicator with a "swinging wildly" pre-roll: a marker
 * oscillates across the whole track with decaying amplitude (visualizing the
 * volatility in words) before the fill settles on the real min/max, which
 * eases in with a soft overshoot. Direct labels at both ends.
 */
export const RangeBar: React.FC<{ min: number; max: number; scaleMax: number; at: number; width?: number }> = ({ min, max, scaleMax, at, width = 640 }) => {
  const f = useCurrentFrame();
  const jitterDur = 36;
  const jitterStart = at - jitterDur - 6;
  const inJitter = f >= jitterStart && f < at;
  const jitterT = Math.min(1, Math.max(0, (f - jitterStart) / jitterDur));
  const decay = Math.pow(1 - jitterT, 1.6);
  const jitterX = width * (0.5 + 0.42 * Math.sin(jitterT * 22) * decay);

  const p = Math.max(0, prog(f, at, 40, SPRING)); // allow >1 overshoot, clamp only the floor
  const minX = (min / scaleMax) * width;
  const maxX = (max / scaleMax) * width * p + minX * (1 - p);
  return (
    <div style={{ width, opacity: prog(f, jitterStart, 16) }}>
      <svg width={width} height={40} viewBox={`0 0 ${width} 40`}>
        <line x1={0} y1={20} x2={width} y2={20} stroke={C.track} strokeWidth={10} strokeLinecap="round" />
        <line x1={minX} y1={20} x2={Math.max(Math.min(maxX, width), minX + 2)} y2={20} stroke={C.blue} strokeWidth={10} strokeLinecap="round" />
        {inJitter && <circle cx={jitterX} cy={20} r={7} fill={C.coral} opacity={0.9} />}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <Mono size={20} color={C.fg} style={{ fontWeight: 700 }}>{min}%</Mono>
        <Mono size={20} color={C.blue} style={{ fontWeight: 700 }}>{max}%</Mono>
      </div>
    </div>
  );
};

/**
 * Compounding growth curve between two real, cited endpoints (never
 * fabricated intermediate data points, just a visual interpolation): an
 * exponential path draws in left to right, an area fill settles underneath,
 * and the end value pops in with a soft bounce.
 */
export const GrowthCurve: React.FC<{ from: number; to: number; at: number; width?: number; height?: number }> = ({ from, to, at, width = 380, height = 130 }) => {
  const f = useCurrentFrame();
  const n = 28;
  const padTop = 14;
  const padBottom = 10;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const val = from * Math.pow(to / from, t);
    const x = t * width;
    const y = height - padBottom - ((val - from) / (to - from)) * (height - padTop - padBottom);
    pts.push([x, y]);
  }
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaD = `${d} L${width},${height} L0,${height} Z`;
  const pathLen = width * 1.35;
  const drawP = Math.min(1, Math.max(0, prog(f, at, 50, STANDARD)));
  const areaP = prog(f, at + 34, 26);
  const dotP = Math.max(0, prog(f, at + 46, 22, SPRING));
  const [ex, ey] = pts[n];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <path d={areaD} fill={`${C.blue}12`} opacity={areaP} />
      <path d={d} fill="none" stroke={C.blue} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={pathLen} strokeDashoffset={pathLen * (1 - drawP)} />
      <circle cx={ex} cy={ey} r={7 * Math.min(1.2, dotP)} fill={C.blue} />
    </svg>
  );
};

/**
 * Competitive positioning map. X: evaluation/observability -> statistical
 * guarantees. Y: post-hoc monitoring -> pre-response enforcement. Competitors
 * render as one muted "everyone else" cluster (never individually hued, so
 * the eye isn't asked to tell several greys apart by color); the product is
 * the single blue, glowing dot. Every dot pops in with a spring bounce.
 */
export const Quadrant: React.FC<{
  others: { label: string; x: number; y: number }[];
  us: { label: string; x: number; y: number };
  at: number;
  size?: number;
}> = ({ others, us, at, size = 620 }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 30, STANDARD);
  const usP = prog(f, at + 22, 30, SPRING);
  const pad = 30;
  const plot = size - pad * 2;
  const toXY = (x: number, y: number) => [pad + x * plot, pad + (1 - y) * plot];

  return (
    <div style={{ width: size, opacity: prog(f, at - 6, 16) }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect x={0.5} y={0.5} width={size - 1} height={size - 1} rx={20} fill={C.card2} stroke={C.hairline} />
        <line x1={pad} y1={size / 2} x2={size - pad} y2={size / 2} stroke={C.hairline} strokeWidth={1.5} strokeDasharray="4 6" />
        <line x1={size / 2} y1={pad} x2={size / 2} y2={size - pad} stroke={C.hairline} strokeWidth={1.5} strokeDasharray="4 6" />

        {others.map((o, i) => {
          const [cx, cy] = toXY(o.x, o.y);
          const op = prog(f, at + i * 4, 22, SPRING);
          const opClamped = Math.min(1.15, Math.max(0, op)); // soft ceiling on the bounce, not a hard clamp to 1
          const anchor = cx > size * 0.72 ? "end" : cx < size * 0.28 ? "start" : "middle";
          const labelY = i % 2 === 0 ? cy + 24 : cy - 16;
          return (
            <g key={o.label} opacity={p * Math.min(1, Math.max(0, prog(f, at + i * 4, 16)))} transform={`translate(${cx} ${cy}) scale(${opClamped}) translate(${-cx} ${-cy})`}>
              <circle cx={cx} cy={cy} r={8} fill={C.grey} />
              <text x={cx} y={labelY} textAnchor={anchor} fontFamily={BODY} fontSize={15} fontWeight={600} fill={C.greyText}>
                {o.label}
              </text>
            </g>
          );
        })}

        {(() => {
          const [cx, cy] = toXY(us.x, us.y);
          const anchor = cx > size * 0.6 ? "end" : "middle";
          const usScale = Math.min(1.15, Math.max(0, usP));
          return (
            <g opacity={Math.min(1, Math.max(0, usP))} transform={`translate(${cx} ${cy}) scale(${usScale}) translate(${-cx} ${-cy})`}>
              <circle cx={cx} cy={cy} r={28} fill={C.blue} opacity={0.14} />
              <circle cx={cx} cy={cy} r={12} fill={C.blue} />
              <text x={cx} y={cy - 24} textAnchor={anchor} fontFamily={SANS} fontSize={18} fontWeight={700} fill={C.blue}>
                {us.label}
              </text>
            </g>
          );
        })()}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        <Mono size={15} color={C.dim}>Evaluation and observability</Mono>
        <Mono size={15} color={C.blue} style={{ fontWeight: 700 }}>Statistical guarantees</Mono>
      </div>
    </div>
  );
};
