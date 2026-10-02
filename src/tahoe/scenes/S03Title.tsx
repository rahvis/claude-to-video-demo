import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Glow } from "../components/ui";
import { C, gradientText } from "../theme";

export const S03Title: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tIntro = useEvent("intro");
  const tImpact = useEvent("impact");
  const tMark = useEvent("mark");
  const markP = prog(f, tMark, 24, EASE_IN_OUT);
  const size = portrait ? 150 : 176;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tImpact} size={portrait ? 1300 : 1600} opacity={0.42} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <BlurIn at={tIntro} dur={22}>
          <div style={{ fontSize: 38, color: C.dim, fontWeight: 500, letterSpacing: "-0.015em", marginBottom: 26 }}>Introducing</div>
        </BlurIn>
        <div style={{ display: "flex", alignItems: "center", gap: portrait ? 24 : 34 }}>
          <BlurIn at={tImpact} dur={28} y={44} blur={26} scale={0.9}>
            <div style={{ fontSize: size, fontWeight: 750, letterSpacing: "-0.055em", lineHeight: 0.98, ...gradientText() }}>TahoeAI</div>
          </BlurIn>
          <div
            style={{
              width: portrait ? 100 : 128,
              height: portrait ? 100 : 128,
              borderRadius: "50%",
              overflow: "hidden",
              opacity: markP,
              transform: `scale(${0.6 + 0.4 * markP}) rotate(${(1 - markP) * -18}deg)`,
              boxShadow: `0 18px 50px ${C.violet}33`,
              flexShrink: 0,
            }}
          >
            <Img src={staticFile("tahoe/img/cat-mark.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
