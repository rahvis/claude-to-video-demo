import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Glow, GrowthChart, Headline } from "../components/ui";
import { C } from "../theme";

const ROWS = [
  { label: "AI Trust, Risk and Security Management", today: 3.2, future: 21, futureLabel: "$21B", cagr: "21% CAGR" },
  { label: "LLM observability", today: 2.7, future: 9.3, futureLabel: "$9.3B", cagr: "36% CAGR" },
];

export const S07Market: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tIntro = useEvent("intro");
  const tChart = useEvent("chart");
  const tClosing = useEvent("closing");
  const size = portrait ? 46 : 52;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tChart} opacity={0.36} size={portrait ? 1300 : 1600} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: portrait ? "0 50px" : "0 130px", textAlign: "center" }}>
        <BlurIn at={tIntro} y={18} dur={22} style={{ marginBottom: 48 }}>
          <Headline size={size} style={{ textAlign: "center" }}>A market that already has a name.</Headline>
        </BlurIn>
        <GrowthChart rows={ROWS} max={24} at={tChart} width={portrait ? 360 : 780} />
        <div style={{ marginTop: 30, opacity: prog(f, tClosing, 22) }}>
          <Headline size={portrait ? 26 : 30} style={{ textAlign: "center", color: C.dim, fontWeight: 600 }}>
            Every LLM in production is a future customer.
          </Headline>
        </div>
      </div>
    </AbsoluteFill>
  );
};
