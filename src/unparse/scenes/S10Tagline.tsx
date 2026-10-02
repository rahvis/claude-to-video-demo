import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Glow, Headline } from "../components/ui";
import { C, gradientText } from "../theme";

export const S10Tagline: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const t1 = useEvent("line1");
  const t2 = useEvent("line2");
  const tMark = useEvent("mark");
  const tCta = useEvent("cta");
  const out = prog(f, tMark - 14, 16, EASE_IN_OUT);
  const ctaIn = prog(f, tCta, 26, EASE_IN_OUT);
  const size = portrait ? 96 : 108;
  const markSize = portrait ? 66 : 78;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tMark} opacity={0.32} size={portrait ? 1200 : 1500} />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - out,
          transform: `translateY(${-out * 30}px)`,
          filter: out > 0 ? `blur(${out * 14}px)` : undefined,
          textAlign: "center",
          padding: portrait ? "0 60px" : "0 130px",
        }}
      >
        <BlurIn at={t1} dur={24} y={30} blur={18}>
          <Headline size={size * 0.5} style={{ letterSpacing: "-0.03em", color: C.dim }}>So the next time your model says it's confident,</Headline>
        </BlurIn>
        <BlurIn at={t2} dur={24} y={30} blur={18}>
          <Headline size={size * 0.5} style={{ letterSpacing: "-0.03em", marginTop: 12, ...gradientText() }}>you'll know exactly what that means.</Headline>
        </BlurIn>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <BlurIn at={tMark} dur={28} y={30} blur={20} scale={0.94}>
          <div style={{ fontSize: markSize, fontWeight: 750, letterSpacing: "-0.04em", lineHeight: 1.05, textAlign: "center", color: C.fg }}>
            Conformal{portrait ? <br /> : " "}Logit Inference
          </div>
        </BlurIn>

        <div
          style={{
            marginTop: portrait ? 50 : 44,
            opacity: ctaIn,
            transform: `translateY(${(1 - ctaIn) * 16}px)`,
            padding: "16px 34px",
            borderRadius: 999,
            background: C.blue,
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 600, color: "#fff" }}>Get started today</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
