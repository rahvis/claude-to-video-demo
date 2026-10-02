import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Body, Card, Glow, Headline } from "../components/ui";
import { C } from "../theme";

const TIERS = [
  { name: "Developer", desc: "free to build on", eventKey: "devTier" as const },
  { name: "Team", desc: "scales with usage", eventKey: "teamTier" as const },
  { name: "Enterprise", desc: "runs in your own environment", eventKey: "entTier" as const },
];

export const S09Business: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tIntro = useEvent("intro");
  const times = { devTier: useEvent("devTier"), teamTier: useEvent("teamTier"), entTier: useEvent("entTier") };
  const tClosing = useEvent("closing");
  const size = portrait ? 48 : 54;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tIntro} opacity={0.32} size={portrait ? 1200 : 1500} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: portrait ? "0 50px" : "0 130px", textAlign: "center" }}>
        <BlurIn at={tIntro} y={18} dur={22} style={{ marginBottom: 46 }}>
          <Headline size={size} style={{ textAlign: "center" }}>Simple by design.</Headline>
        </BlurIn>

        <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", gap: 18 }}>
          {TIERS.map((t) => {
            const p = prog(f, times[t.eventKey], 24, EASE_IN_OUT);
            return (
              <div key={t.name} style={{ opacity: p, transform: `translateY(${(1 - p) * 18}px) scale(${0.96 + 0.04 * p})` }}>
                <Card style={{ padding: "26px 30px", width: portrait ? 320 : 260, textAlign: "left" }}>
                  <div style={{ fontSize: 23, fontWeight: 700, color: C.fg }}>{t.name}</div>
                  <Body size={15} color={C.dim} style={{ marginTop: 8 }}>{t.desc}</Body>
                </Card>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 40, opacity: prog(f, tClosing, 22) }}>
          <Headline size={portrait ? 26 : 30} style={{ textAlign: "center", color: C.dim, fontWeight: 600 }}>
            We built the hardest part first.
          </Headline>
        </div>
      </div>
    </AbsoluteFill>
  );
};
