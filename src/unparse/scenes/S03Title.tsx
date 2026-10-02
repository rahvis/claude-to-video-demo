import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Glow } from "../components/ui";
import { C, GRADIENT, gradientText } from "../theme";

export const S03Title: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tIntro = useEvent("intro");
  const tImpact = useEvent("impact");
  const tUnderline = useEvent("underline");
  const lineP = prog(f, tUnderline, 26, EASE_IN_OUT);
  const size = portrait ? 96 : 122;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tImpact} size={portrait ? 1300 : 1600} opacity={0.4} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <BlurIn at={tIntro} dur={22}>
          <div style={{ fontSize: 38, color: C.dim, fontWeight: 500, letterSpacing: "-0.015em", marginBottom: 26 }}>Introducing</div>
        </BlurIn>
        <BlurIn at={tImpact} dur={28} y={44} blur={26} scale={0.9}>
          <div style={{ fontSize: size, fontWeight: 750, letterSpacing: "-0.045em", lineHeight: 1.02, textAlign: "center", ...gradientText() }}>
            Conformal{portrait ? <br /> : " "}Logit Inference
          </div>
        </BlurIn>
        <div
          style={{
            marginTop: portrait ? 30 : 38,
            width: portrait ? 320 : 420,
            height: 5,
            borderRadius: 3,
            background: GRADIENT,
            transform: `scaleX(${lineP})`,
            boxShadow: `0 0 24px ${C.blue}55`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
