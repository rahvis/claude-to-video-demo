import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Badge, Glow, Headline } from "../components/ui";
import { C, gradientText } from "../theme";

export const S11Ask: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const t1 = useEvent("line1");
  const t2 = useEvent("line2");
  const tPreseed = useEvent("preseed");
  const tMark = useEvent("mark");
  const tTagline = useEvent("tagline");
  const tCta = useEvent("cta");
  const out = prog(f, tMark - 14, 16, EASE_IN_OUT);
  const ctaIn = prog(f, tCta, 26, EASE_IN_OUT);
  const size = portrait ? 48 : 54;
  const markSize = portrait ? 62 : 74;
  const taglineSize = portrait ? 42 : 48;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tMark} opacity={0.5} size={portrait ? 1300 : 1600} />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - out,
          transform: `translateY(${-out * 30}px)`,
          filter: out > 0 ? `blur(${out * 14}px)` : undefined,
          textAlign: "center",
          padding: portrait ? "0 60px" : "0 140px",
        }}
      >
        <BlurIn at={t1} dur={22} y={26} blur={16}>
          <Headline size={size} style={{ color: C.dim }}>Every model already computes a score.</Headline>
        </BlurIn>
        <BlurIn at={t2} dur={22} y={26} blur={16}>
          <Headline size={size} style={{ marginTop: 12, ...gradientText() }}>We make it mean something.</Headline>
        </BlurIn>
        <div style={{ marginTop: 30, opacity: prog(f, tPreseed, 22) }}>
          <Badge>Pre-seed round, now open</Badge>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <BlurIn at={tMark} dur={26} y={28} blur={20} scale={0.94}>
          <div style={{ fontSize: markSize, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.05, textAlign: "center", color: C.fg }}>
            Conformal{portrait ? <br /> : " "}Logit Inference
          </div>
        </BlurIn>

        <BlurIn at={tTagline} dur={22} y={20} blur={14}>
          <div style={{ marginTop: portrait ? 26 : 22, fontSize: taglineSize, fontWeight: 600, textAlign: "center", color: C.dim }}>
            Not a confidence score. <span style={gradientText()}>A guarantee.</span>
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
          <span style={{ fontSize: 25, fontWeight: 700, color: "#fff" }}>Get in touch</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
