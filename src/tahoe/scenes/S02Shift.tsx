import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Glow, Headline } from "../components/ui";
import { C, gradientText } from "../theme";

export const S02Shift: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c0 = useCue(0);
  const c1 = useCue(1);
  const tStrike = useEvent("strike");
  const tPivot = useEvent("pivot");
  const strike = prog(f, tStrike, 22, EASE_IN_OUT);
  const size = portrait ? 78 : 88;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tPivot} opacity={0.24} size={portrait ? 1000 : 1300} />
      <div style={{ padding: portrait ? "0 80px" : "0 200px", textAlign: "center" }}>
        <BlurIn at={c0.frame} y={26} blur={16}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Headline size={size} style={{ textAlign: "center", color: C.dim }}>
              Sourcing shouldn't feel like data entry.
            </Headline>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "52%",
                height: 5,
                borderRadius: 3,
                background: C.coral,
                width: `${strike * 100}%`,
                boxShadow: `0 0 20px ${C.coral}66`,
              }}
            />
          </div>
        </BlurIn>
        <BlurIn at={c1.frame} y={26} blur={16} style={{ marginTop: 30 }}>
          <Headline size={size} style={{ textAlign: "center", ...gradientText() }}>
            So we rebuilt it.
          </Headline>
        </BlurIn>
      </div>
    </AbsoluteFill>
  );
};
