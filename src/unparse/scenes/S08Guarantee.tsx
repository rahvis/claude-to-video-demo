import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, mix, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Eyebrow, Glow, Headline, Mono } from "../components/ui";
import { C } from "../theme";

export const S08Guarantee: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2)];
  const tRing = useEvent("ring");
  const tPct = useEvent("pct");
  const tVerify = useEvent("verify");

  const ringP = prog(f, tRing, 40, EASE_IN_OUT);
  const size = portrait ? 58 : 62;

  const R = 130;
  const CIRC = 2 * Math.PI * R;
  const filled = CIRC * 0.95 * ringP;
  const pctValue = mix(0, 95, prog(f, tPct, 30, EASE_IN_OUT));

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tPct} opacity={0.26} size={portrait ? 1300 : 1600} />
      <div style={{ padding: portrait ? "0 60px" : "0 150px", textAlign: "center" }}>
        <BlurIn at={c[0].frame - 4}>
          <Eyebrow>Coverage guarantee</Eyebrow>
        </BlurIn>
        <Swap
          align="center"
          style={{ marginTop: 14 }}
          items={[
            { at: c[0].frame, node: <Headline size={size} style={{ textAlign: "center" }}>The promise is simple: right at least ninety-five percent of the time.</Headline> },
            { at: c[1].frame, node: <Headline size={size} style={{ textAlign: "center", color: C.dim }}>And it's not just a promise.</Headline> },
            { at: c[2].frame, node: <Headline size={size} style={{ textAlign: "center" }}>It's a guarantee you can verify yourself.</Headline> },
          ]}
        />
      </div>

      <div style={{ marginTop: portrait ? 60 : 70, display: "flex", flexDirection: "column", alignItems: "center", opacity: ringP }}>
        <svg width={300} height={300} viewBox="0 0 300 300">
          <circle cx={150} cy={150} r={R} fill="none" stroke={C.track} strokeWidth={20} />
          <circle
            cx={150}
            cy={150}
            r={R}
            fill="none"
            stroke={C.blue}
            strokeWidth={20}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRC - filled}`}
            transform="rotate(-90 150 150)"
          />
          <text x={150} y={162} textAnchor="middle" fontFamily="inherit" fontSize={64} fontWeight={750} fill={C.fg} style={{ fontVariantNumeric: "tabular-nums" }}>
            {pctValue.toFixed(0)}%
          </text>
        </svg>
        <div style={{ marginTop: 8, opacity: prog(f, tVerify, 20) }}>
          <Mono size={20} color={C.dim}>guaranteed coverage, from held-out data</Mono>
        </div>
      </div>
    </AbsoluteFill>
  );
};
