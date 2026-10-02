import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../lib/motion";
import { useCue, useEvent, useLayout } from "../lib/scene";
import { Glow, Headline } from "../components/ui";
import { C, GRADIENT, gradientText } from "../theme";

export const S10Tagline: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const t1 = useEvent("line1");
  const t2 = useEvent("line2");
  const tMark = useEvent("mark");
  const words = useCue(2).words;
  const out = prog(f, tMark - 12, 14, EASE_IN_OUT);
  const rule = prog(f, words[2].frame + 14, 30, EASE_IN_OUT);
  const size = portrait ? 116 : 128;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tMark} opacity={0.3} size={portrait ? 1200 : 1500} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - out,
          transform: `translateY(${-out * 30}px)`,
          filter: out > 0 ? `blur(${out * 14}px)` : undefined,
          textAlign: "center",
        }}
      >
        <BlurIn at={t1} dur={24} y={30} blur={18}>
          <Headline size={size} style={{ letterSpacing: "-0.05em" }}>
            Not a disclaimer.
          </Headline>
        </BlurIn>
        <BlurIn at={t2} dur={24} y={30} blur={18}>
          <Headline size={size} style={{ letterSpacing: "-0.05em", marginTop: 12, ...gradientText() }}>
            A claim you{portrait ? <br /> : " "}can check.
          </Headline>
        </BlurIn>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 0 : 28 }}>
          {["Conformal", "Confidential", "Inference"].map((w, i) => (
            <BlurIn key={w} at={words[i].frame - 2} dur={26} y={30} blur={20} scale={0.95}>
              <div style={{ fontSize: portrait ? 136 : 100, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1.02, color: C.fg }}>{w}</div>
            </BlurIn>
          ))}
        </div>
        <div style={{ marginTop: portrait ? 44 : 38, width: portrait ? 560 : 900, height: 5, borderRadius: 3, background: GRADIENT, transform: `scaleX(${rule})` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
