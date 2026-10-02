import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Glow, Headline } from "../components/ui";
import { C, gradientText } from "../theme";

export const S10Tagline: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const t1 = useEvent("line1");
  const t2 = useEvent("line2");
  const tMark = useEvent("mark");
  const tWo = useEvent("wo");
  const out = prog(f, tMark - 14, 16, EASE_IN_OUT);
  const woIn = prog(f, tWo, 26, EASE_IN_OUT);
  const size = portrait ? 108 : 118;
  const markSize = portrait ? 132 : 150;

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
        }}
      >
        <BlurIn at={t1} dur={24} y={30} blur={18}>
          <Headline size={size} style={{ letterSpacing: "-0.05em" }}>Not another tab to manage.</Headline>
        </BlurIn>
        <BlurIn at={t2} dur={24} y={30} blur={18}>
          <Headline size={size} style={{ letterSpacing: "-0.05em", marginTop: 12, ...gradientText() }}>
            A recruiter's{portrait ? <br /> : " "}unfair advantage.
          </Headline>
        </BlurIn>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <BlurIn at={tMark} dur={28} y={30} blur={20} scale={0.92}>
          <div style={{ display: "flex", alignItems: "center", gap: portrait ? 20 : 28 }}>
            <div style={{ width: markSize, height: markSize, borderRadius: "50%", overflow: "hidden", flexShrink: 0, boxShadow: `0 20px 60px ${C.violet}33` }}>
              <Img src={staticFile("tahoe/img/cat-mark.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ fontSize: portrait ? 108 : 128, fontWeight: 750, letterSpacing: "-0.05em", lineHeight: 1, ...gradientText() }}>TahoeAI</div>
          </div>
        </BlurIn>

        <div
          style={{
            marginTop: portrait ? 66 : 58,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: woIn,
            transform: `translateY(${(1 - woIn) * 16}px)`,
          }}
        >
          <span style={{ fontSize: 26, color: C.dim, fontWeight: 500 }}>powered by</span>
          <Img src={staticFile("tahoe/img/workonward-logo.svg")} style={{ height: 28 }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
