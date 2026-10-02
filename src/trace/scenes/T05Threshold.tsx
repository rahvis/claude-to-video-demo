import React from "react";
import { AbsoluteFill, interpolateColors, random, useCurrentFrame } from "remotion";
import { BlurIn, Counter, EASE_IN_OUT, mix, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Eyebrow, Headline, Mono } from "../../light/components/ui";
import { C, MONO, gradientText } from "../../light/theme";

// Illustrative runs: max request size for records without / with the attribute. The means
// and spread are set so a single cut separates them about as well as the paper's
// unfitted threshold (AUC 0.816), overlap included.
const gauss = (seed: string) => {
  const u = Math.max(1e-6, random(seed + "a"));
  const v = random(seed + "b");
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const DOTS = [0, 1].flatMap((cls) =>
  Array.from({ length: 30 }, (_, i) => ({
    cls,
    v: Math.min(0.98, Math.max(0.02, (cls ? 0.585 : 0.415) + 0.13 * gauss(`d${cls}-${i}`))),
    j: random(`j${cls}-${i}`) - 0.5,
    t: random(`t${cls}-${i}`),
  })),
);

export const T05Threshold: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1)];
  const tDots = useEvent("dots");
  const tLine = useEvent("line");
  const tStat = useEvent("stat");

  const W = portrait ? 920 : 1060;
  const H = portrait ? 600 : 470;
  const labelW = portrait ? 0 : 200;
  const x0 = labelW + 20;
  const x1 = W - 10;
  const rowY = portrait ? [170, 410] : [125, 320];
  const band = portrait ? 130 : 100;
  const X = (v: number) => x0 + v * (x1 - x0);

  const lineIn = prog(f, tLine, 12);
  const lx = X(mix(0.04, 0.5, prog(f, tLine + 4, 30, EASE_IN_OUT)));
  const reveal = prog(f, tLine, 10);

  const plot = (
    <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
      <line x1={x0} x2={x1} y1={H - 40} y2={H - 40} stroke="rgba(0,0,0,0.25)" strokeWidth={2} />
      <text x={x1} y={H - 4} textAnchor="end" fontFamily={MONO} fontSize={21} fill={C.dim}>
        max request size →
      </text>
      {["attribute absent", "attribute present"].map((l, r) =>
        portrait ? (
          <text key={l} x={x0} y={rowY[r] - band / 2 - 18} fontFamily={MONO} fontSize={22} fill={C.dim}>
            {l}
          </text>
        ) : (
          <text key={l} x={labelW} y={rowY[r] + 7} textAnchor="end" fontFamily={MONO} fontSize={21} fill={C.dim}>
            {l}
          </text>
        ),
      )}
      {DOTS.map((d, i) => {
        const k = prog(f, tDots + d.t * 26, 12);
        if (k <= 0) return null;
        const cx = X(d.v);
        const side = Math.min(1, Math.max(0, (cx - lx + 10) / 20));
        const pos = interpolateColors(side, [0, 1], ["#aeaeb2", C.teal]);
        const fill = interpolateColors(reveal, [0, 1], [C.faint, pos]);
        const right = side > 0.5;
        const opacity = mix(1, right === !!d.cls ? 1 : 0.4, reveal);
        return <circle key={i} cx={cx} cy={rowY[d.cls] + d.j * band} r={(portrait ? 15 : 13) * (0.4 + 0.6 * k)} fill={fill} opacity={opacity * k} />;
      })}
      <g opacity={lineIn}>
        <line x1={lx} x2={lx} y1={30} y2={30 + (H - 80) * lineIn} stroke={C.fg} strokeWidth={4} strokeLinecap="round" />
        <text x={lx} y={14} textAnchor="middle" fontFamily={MONO} fontSize={21} fill={C.fg} fontWeight={600}>
          one threshold
        </text>
      </g>
    </svg>
  );

  const stat = (
    <BlurIn at={tStat} dur={22} scale={0.94}>
      <div style={{ width: portrait ? 920 : 440 }}>
        <div style={{ fontSize: portrait ? 190 : 160, fontWeight: 700, letterSpacing: "-0.06em", lineHeight: 1, ...gradientText() }}>
          <Counter from={0.5} to={0.816} at={tStat + 2} dur={30} decimals={3} />
        </div>
        <div style={{ fontSize: portrait ? 40 : 34, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 16 }}>AUC, with no training</div>
        <Mono size={portrait ? 25 : 22} style={{ display: "block", marginTop: 10, lineHeight: 1.5 }}>
          no learned model beats it
        </Mono>
      </div>
    </BlurIn>
  );

  return (
    <AbsoluteFill style={{ padding: portrait ? "0 80px" : "0 150px", justifyContent: "center" }}>
      <BlurIn at={c[0].frame - 4}>
        <Eyebrow>The attribute channel is univariate</Eyebrow>
      </BlurIn>
      <Swap
        style={{ marginTop: 16 }}
        items={[
          { at: c[0].frame, node: <Headline size={portrait ? 80 : 72}>No machine learning required.</Headline> },
          { at: c[1].frame, node: <Headline size={portrait ? 80 : 72}>One threshold on request size.</Headline> },
        ]}
      />
      <div
        style={{
          marginTop: portrait ? 120 : 80,
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          alignItems: portrait ? "flex-start" : "center",
          gap: portrait ? 100 : 80,
        }}
      >
        {plot}
        {stat}
      </div>
    </AbsoluteFill>
  );
};
