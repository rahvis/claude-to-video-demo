import React from "react";
import { evolvePath } from "@remotion/paths";
import { interpolateColors } from "remotion";
import { C, GRADIENT, MONO } from "../../light/theme";

// An illustrative seven-step trace: per-step timing τ, request bytes out, response bytes in
// (request larger than response, as in the paper's measurements where uplink runs 5.1x downlink).
export const STEPS = [
  { tau: 1.0, out: 0.42, inn: 0.3 },
  { tau: 1.7, out: 0.7, inn: 0.52 },
  { tau: 0.8, out: 0.55, inn: 0.24 },
  { tau: 2.3, out: 1.0, inn: 0.72 },
  { tau: 1.2, out: 0.78, inn: 0.4 },
  { tau: 1.9, out: 0.88, inn: 0.62 },
  { tau: 0.9, out: 0.48, inn: 0.34 },
];

export const REQ = `linear-gradient(0deg, ${C.teal}, ${C.periwinkle})`;
export const RESP = `linear-gradient(180deg, ${C.periwinkle}cc, ${C.periwinkle}44)`;

type Props = {
  width: number;
  steps?: typeof STEPS;
  blockH?: number;
  gap?: number;
  upMax: number;
  downMax: number;
  appear?: (i: number) => number; // 0..1 per block
  flash?: (i: number) => number; // 1 = just appeared (teal), 0 = settled (ink)
  numbers?: (i: number) => number;
  widthMix?: number; // 0 = equal widths, 1 = widths from timing
  up?: (i: number) => number;
  down?: (i: number) => number;
  outline?: number; // draws the silhouette
  dim?: number;
  respColor?: string;
  fixed?: boolean; // constant plan: equal widths/heights (TraceShield)
  id?: string;
};

/** The execution trace as blocks (steps, width = timing) with request bars above and response bars below. */
export const TraceChart: React.FC<Props> = ({
  width,
  steps = STEPS,
  blockH = 30,
  gap = 16,
  upMax,
  downMax,
  appear = () => 1,
  flash = () => 0,
  numbers = () => 0,
  widthMix = 1,
  up = () => 1,
  down = () => 1,
  outline = 0,
  dim = 0,
  respColor,
  id = "tr",
}) => {
  const n = steps.length;
  const avail = width - gap * (n - 1);
  const sum = steps.reduce((a, s) => a + s.tau, 0);
  const H = upMax + downMax + blockH + 40;
  const base = upMax + 14 + blockH / 2;
  let x = 0;
  const geo = steps.map((s, i) => {
    const w = avail / n + (s.tau / sum * avail - avail / n) * widthMix;
    const g = { x, w, uh: upMax * s.out * up(i), dh: downMax * s.inn * down(i) };
    x += w + gap;
    return g;
  });

  // silhouette over the request bars and under the response bars
  let top = "";
  let bot = "";
  geo.forEach((g, i) => {
    const yt = base - blockH / 2 - 10 - g.uh;
    const yb = base + blockH / 2 + 10 + g.dh;
    top += `${i ? "L" : "M"}${(g.x + 8).toFixed(1)},${yt.toFixed(1)} L${(g.x + g.w - 8).toFixed(1)},${yt.toFixed(1)} `;
    bot += `${i ? "L" : "M"}${(g.x + 8).toFixed(1)},${yb.toFixed(1)} L${(g.x + g.w - 8).toFixed(1)},${yb.toFixed(1)} `;
  });
  const et = outline > 0 ? evolvePath(outline, top) : null;
  const eb = outline > 0 ? evolvePath(outline, bot) : null;

  return (
    <svg width={width} height={H} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id={`${id}-up`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={C.teal} />
          <stop offset="1" stopColor={C.periwinkle} />
        </linearGradient>
        <linearGradient id={`${id}-dn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={respColor ?? C.periwinkle} stopOpacity={0.85} />
          <stop offset="1" stopColor={respColor ?? C.periwinkle} stopOpacity={0.3} />
        </linearGradient>
        <linearGradient id={`${id}-ol`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.teal} />
          <stop offset="0.52" stopColor={C.periwinkle} />
          <stop offset="1" stopColor={C.coral} />
        </linearGradient>
      </defs>
      {geo.map((g, i) => {
        const a = appear(i);
        if (a <= 0) return null;
        const cx = g.x + g.w / 2;
        const s = 0.6 + 0.4 * a;
        return (
          <g key={i} opacity={Math.min(1, a * 1.6) * (1 - 0.5 * dim)}>
            {g.uh > 0.5 && <rect x={g.x + 8} y={base - blockH / 2 - 10 - g.uh} width={Math.max(0, g.w - 16)} height={g.uh} rx={12} fill={`url(#${id}-up)`} />}
            {g.dh > 0.5 && <rect x={g.x + 8} y={base + blockH / 2 + 10} width={Math.max(0, g.w - 16)} height={g.dh} rx={12} fill={`url(#${id}-dn)`} />}
            <g transform={`translate(${cx} ${base}) scale(${s}) translate(${-cx} ${-base})`}>
              <rect x={g.x} y={base - blockH / 2} width={g.w} height={blockH} rx={blockH / 2} fill={interpolateColors(flash(i), [0, 1], [C.fg, C.teal])} />
              <text x={cx} y={base + 7} textAnchor="middle" fontFamily={MONO} fontSize={19} fontWeight={600} fill="#fff" opacity={numbers(i)}>
                {i + 1}
              </text>
            </g>
          </g>
        );
      })}
      {et && eb && (
        <g fill="none" stroke={`url(#${id}-ol)`} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
          <path d={top} strokeDasharray={et.strokeDasharray} strokeDashoffset={et.strokeDashoffset} />
          <path d={bot} strokeDasharray={eb.strokeDasharray} strokeDashoffset={eb.strokeDashoffset} />
        </g>
      )}
    </svg>
  );
};

/** Seven gradient bars: the film's mark. */
export const Mark: React.FC<{ size?: number; grow?: (i: number) => number }> = ({ size = 120, grow = () => 1 }) => {
  const hs = [0.45, 0.8, 0.6, 1.0, 0.7, 0.9, 0.5];
  const bw = size / 11;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: bw * 0.55, height: size * 0.75 }}>
      {hs.map((h, i) => (
        <div
          key={i}
          style={{
            width: bw,
            height: size * 0.75 * h * Math.max(0, grow(i)),
            borderRadius: bw / 2,
            backgroundImage: GRADIENT,
            backgroundSize: `${size * 1.1}px 100%`,
            backgroundPosition: `${-i * bw * 1.55}px 0`,
          }}
        />
      ))}
    </div>
  );
};

/** Chip in the trace legend; `on` 0..1. */
export const LegendChip: React.FC<{ label: string; on: number; swatch: React.ReactNode; size?: number }> = ({ label, on, swatch, size = 26 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontSize: size,
      fontWeight: 600,
      padding: "12px 24px",
      borderRadius: 999,
      color: interpolateColors(on, [0, 1], ["#b0b0b5", C.fg]),
      background: `rgba(245,245,247,${on})`,
      border: `1.5px solid rgba(0,0,0,${0.07 * (1 - on)})`,
      transform: `scale(${1 + 0.05 * Math.sin(Math.PI * Math.min(1, Math.max(0, on)))})`,
      whiteSpace: "nowrap",
    }}
  >
    <div style={{ opacity: 0.25 + 0.75 * on, display: "flex" }}>{swatch}</div>
    {label}
  </div>
);
