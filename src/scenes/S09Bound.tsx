import React from "react";
import { evolvePath } from "@remotion/paths";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog, Swap } from "../lib/motion";
import { useCue, useEvent, useLayout } from "../lib/scene";
import { Eyebrow, Headline, Mono } from "../components/ui";
import { C, MONO } from "../theme";

// Largest attainable e-value at calibration size n (paper §5.3): p ≥ 1/(n+1), and the
// supremum over the calibrator family κp^(κ−1) is at κ* = −1/ln p_min, which gives
// (n+1)/(e·ln(n+1)). That is 3.32 at n = 30 and 11.07 at n = 150, and it first reaches
// the alarm 1/α = 10 at n = 132.
const emax = (n: number) => (n + 1) / (Math.E * Math.log(n + 1));
const X_MAX = 200;
const Y_MAX = 15;

export const S09Bound: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2)];
  const tAxes = useEvent("axes");
  const tCurve = useEvent("curve");
  const tWall = useEvent("wall");
  const tShip = useEvent("ship");

  const W = portrait ? 920 : 1040;
  const H = portrait ? 640 : 640;
  const m = { l: 80, r: 30, t: 30, b: 80 };
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;
  const X = (n: number) => m.l + (n / X_MAX) * pw;
  const Y = (e: number) => m.t + ph - (e / Y_MAX) * ph;

  let d = "";
  for (let n = 1; n <= X_MAX; n++) d += `${n === 1 ? "M" : "L"}${X(n).toFixed(2)},${Y(emax(n)).toFixed(2)} `;
  const draw = prog(f, tCurve, 54, EASE_IN_OUT);
  const ev = evolvePath(draw, d);
  const axes = prog(f, tAxes, 20);
  const wall = prog(f, tWall, 18);
  const p30 = prog(f, tCurve + 16, 14);
  const ship = prog(f, tShip, 16);

  const chart = (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="curve" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={C.teal} />
          <stop offset="0.6" stopColor={C.periwinkle} />
          <stop offset="1" stopColor={C.fg} />
        </linearGradient>
      </defs>
      <g opacity={axes}>
        {[0, 5, 10, 15].map((e) => (
          <g key={e}>
            <line x1={m.l} x2={W - m.r} y1={Y(e)} y2={Y(e)} stroke="rgba(255,255,255,0.08)" />
            <text x={m.l - 18} y={Y(e) + 7} fill={C.dim} fontFamily={MONO} fontSize={20} textAnchor="end">
              {e}
            </text>
          </g>
        ))}
        {[0, 50, 100, 150, 200].map((n) => (
          <text key={n} x={X(n)} y={H - m.b + 36} fill={C.dim} fontFamily={MONO} fontSize={20} textAnchor="middle">
            {n}
          </text>
        ))}
        <line x1={m.l} x2={W - m.r} y1={Y(0)} y2={Y(0)} stroke="rgba(255,255,255,0.3)" />
        <text x={m.l + pw / 2} y={H - 4} fill={C.dim} fontFamily={MONO} fontSize={21} textAnchor="middle">
          calibration examples, n
        </text>
        <text x={m.l} y={m.t - 12} fill={C.dim} fontFamily={MONO} fontSize={21}>
          largest attainable e-value
        </text>
      </g>

      <rect x={X(0)} y={m.t} width={(X(132) - X(0)) * wall} height={ph} fill={C.coral} opacity={0.1} />
      <line x1={X(132)} x2={X(132)} y1={m.t} y2={Y(0)} stroke={C.coral} strokeDasharray="6 8" strokeWidth={2} opacity={wall} />
      <text x={X(132) + 12} y={Y(0) - 16} fill={C.coral} fontFamily={MONO} fontSize={22} opacity={wall}>
        n = 132
      </text>
      <text x={X(8)} y={Y(13.2)} fill={C.coral} fontFamily={MONO} fontSize={24} opacity={wall}>
        alarm can never fire
      </text>

      <line x1={m.l} x2={W - m.r} y1={Y(10)} y2={Y(10)} stroke={C.coral} strokeDasharray="10 10" strokeWidth={2.5} opacity={axes} />
      <text x={W - m.r} y={Y(10) + 32} fill={C.coral} fontFamily={MONO} fontSize={21} textAnchor="end" opacity={axes}>
        alarm · 1/α = 10
      </text>

      <path d={d} fill="none" stroke="url(#curve)" strokeWidth={6} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />

      <g opacity={p30}>
        <circle cx={X(30)} cy={Y(emax(30))} r={10} fill={C.bg} stroke={C.fg} strokeWidth={4} />
        <text x={X(30) + 20} y={Y(emax(30)) + 44} fill={C.fg} fontFamily={MONO} fontSize={22}>
          n = 30 → 3.32
        </text>
      </g>
      <g opacity={ship}>
        <circle cx={X(150)} cy={Y(emax(150))} r={26 + 20 * (1 - ship)} fill="none" stroke={C.green} strokeWidth={2} opacity={1 - ship * 0.6} />
        <circle cx={X(150)} cy={Y(emax(150))} r={12} fill={C.green} />
        <text x={X(150) - 20} y={Y(emax(150)) - 34} fill={C.green} fontFamily={MONO} fontSize={24} textAnchor="end" fontWeight={600}>
          n = 150 → 11.07
        </text>
      </g>
    </svg>
  );

  const text = (
    <div style={{ width: portrait ? 920 : 600 }}>
      <BlurIn at={tAxes}>
        <Eyebrow>Session monitor</Eyebrow>
      </BlurIn>
      <Swap
        style={{ marginTop: 16 }}
        items={[
          { at: c[0].frame, node: <Headline size={portrait ? 80 : 70}>A hard limit.</Headline> },
          { at: c[1].frame, node: <Headline size={portrait ? 80 : 70}>Below n = 132, it can never fire.</Headline> },
          {
            at: c[2].frame,
            node: (
              <Headline size={portrait ? 80 : 70}>
                So we ship <span style={{ color: C.green }}>n = 150</span>.
              </Headline>
            ),
          },
        ]}
      />
      <BlurIn at={tCurve + 10}>
        <div style={{ marginTop: 30, lineHeight: 1.6 }}>
          <Mono size={23}>p-values are at least 1/(n+1),</Mono>
          <br />
          <Mono size={23}>so every e-value has a ceiling.</Mono>
          <br />
          <Mono size={23}>The mean of capped values is capped too.</Mono>
        </div>
      </BlurIn>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: portrait ? "column-reverse" : "row",
        gap: portrait ? 90 : 80,
      }}
    >
      {chart}
      {text}
    </AbsoluteFill>
  );
};
