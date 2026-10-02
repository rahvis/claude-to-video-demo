import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Glow } from "../components/ui";
import { C, gradientText } from "../theme";

const WORDS = ["Conformal", "Confidential", "Inference"];

export const S03Title: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const at = [useEvent("impact"), useEvent("w2"), useEvent("w3")];
  const tIntro = useEvent("intro");
  const acr = prog(f, useEvent("acronym"), 22, EASE_IN_OUT);
  const size = portrait ? 156 : 172;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={at[0]} size={portrait ? 1300 : 1500} opacity={0.4} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <BlurIn at={tIntro} dur={22}>
          <div style={{ fontSize: 38, color: C.dim, fontWeight: 500, letterSpacing: "-0.015em", marginBottom: 30 }}>Introducing</div>
        </BlurIn>
        {WORDS.map((w, i) => (
          <BlurIn key={w} at={at[i]} dur={26} y={40} blur={24} scale={0.93}>
            <div style={{ fontSize: size, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 0.98, textAlign: "center" }}>
              <span style={{ position: "relative", display: "inline-block" }}>
                {w[0]}
                <span style={{ position: "absolute", left: 0, top: 0, opacity: acr, ...gradientText(120) }}>{w[0]}</span>
              </span>
              <span style={{ opacity: 1 - 0.8 * acr }}>{w.slice(1)}</span>
            </div>
          </BlurIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};
