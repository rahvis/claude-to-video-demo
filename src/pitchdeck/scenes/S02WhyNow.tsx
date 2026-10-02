import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, Counter, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Badge, Body, Glow, GrowthCurve, Headline, Mono } from "../components/ui";
import { C } from "../theme";

export const S02WhyNow: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tHeadline = useEvent("headline");
  const tEu = useEvent("badgeEu");
  const tGartner = useEvent("badgeGartner");
  const tStat = useEvent("stat");
  const tClosing = useEvent("closing");

  const euIn = prog(f, tEu, 22, EASE_IN_OUT);
  const gartnerIn = prog(f, tGartner, 22, EASE_IN_OUT);
  const statIn = prog(f, tStat, 26, EASE_IN_OUT);
  const closing = prog(f, tClosing, 22);
  const curveW = portrait ? 320 : 420;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tStat} opacity={0.42} size={portrait ? 1300 : 1600} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: portrait ? "0 60px" : "0 150px", textAlign: "center" }}>
        <BlurIn at={tHeadline} y={20} dur={22}>
          <Headline size={portrait ? 56 : 62} style={{ textAlign: "center" }}>The window is open, and closing.</Headline>
        </BlurIn>

        <div style={{ display: "flex", gap: 16, opacity: euIn, transform: `translateY(${(1 - euIn) * 16}px)`, marginTop: 40, marginBottom: 40 }}>
          <div style={{ opacity: euIn }}><Badge>EU AI Act, Article 15</Badge></div>
          <div style={{ opacity: gartnerIn, transform: `translateY(${(1 - gartnerIn) * 12}px)` }}>
            <Badge bg={C.card} color={C.dim}>Gartner: AI TRiSM</Badge>
          </div>
        </div>

        <div style={{ opacity: statIn, transform: `translateY(${(1 - statIn) * 20}px)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 8 }}>
            <Mono size={22} color={C.faint} style={{ fontWeight: 700 }}>
              $<Counter to={3.2} at={tStat} dur={24} decimals={1} />B
            </Mono>
            <span style={{ color: C.faint, fontSize: 18 }}>&#8594;</span>
            <div style={{ fontSize: portrait ? 54 : 64, fontWeight: 800, color: C.blue, letterSpacing: "-0.03em" }}>
              $<Counter to={21} at={tStat + 8} dur={28} />B
            </div>
          </div>
          <GrowthCurve from={3.2} to={21} at={tStat + 4} width={curveW} height={110} />
          <div style={{ display: "flex", justifyContent: "space-between", width: curveW, marginTop: 6 }}>
            <Body size={14} color={C.faint} style={{ fontWeight: 500 }}>2025</Body>
            <Body size={14} color={C.blue} style={{ fontWeight: 600 }}>2035</Body>
          </div>
        </div>

        <div style={{ marginTop: 36, opacity: closing }}>
          <Headline size={portrait ? 32 : 36} style={{ textAlign: "center", color: C.dim, fontWeight: 600, maxWidth: 760 }}>
            Most systems have nothing to show for it.
          </Headline>
        </div>
      </div>
    </AbsoluteFill>
  );
};
