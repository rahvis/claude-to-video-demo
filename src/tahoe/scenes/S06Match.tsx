import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, Counter, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Eyebrow, Glow, Headline, Mono } from "../components/ui";
import { C, gradientText } from "../theme";

const INSIGHTS = ["Strong skills match", "Bilingual proficiency", "Open to relocation"];

export const S06Match: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2)];
  const tCard = useEvent("card");
  const tScore = useEvent("score");
  const tReason = useEvent("reason");

  const cardIn = prog(f, tCard, 26, EASE_IN_OUT);
  const size = portrait ? 64 : 68;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tScore} opacity={0.24} size={portrait ? 1200 : 1500} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 56 : 100, padding: portrait ? "0 70px" : "0 160px" }}>
        <div style={{ maxWidth: portrait ? "100%" : 560 }}>
          <BlurIn at={c[0].frame - 4}>
            <Eyebrow>AI Match</Eyebrow>
          </BlurIn>
          <Swap
            style={{ marginTop: 14 }}
            items={[
              { at: c[0].frame, node: <Headline size={size}>Every candidate, ranked.</Headline> },
              { at: c[1].frame, node: <Headline size={size}>Ninety-eight percent match.</Headline> },
              { at: c[2].frame, node: <Headline size={size}>Not a guess. A reason why.</Headline> },
            ]}
          />
        </div>

        <div style={{ width: portrait ? 440 : 400, opacity: cardIn, transform: `translateY(${(1 - cardIn) * 26}px)` }}>
          <Card style={{ padding: "30px 30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${C.violet}, ${C.orange})` }} />
              <div>
                <div style={{ fontSize: 23, fontWeight: 650, color: C.fg }}>Priya Nair</div>
                <div style={{ fontSize: 17, color: C.dim }}>Staff Engineer · Stripe</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 40, fontWeight: 750, ...gradientText() }}>
                <Counter to={98} at={tScore} dur={26} suffix="%" />
              </div>
            </div>
            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
              {INSIGHTS.map((txt, i) => (
                <BlurIn key={txt} at={tReason + i * 6} y={12} dur={16}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.violet }} />
                    <Mono size={19} color={C.fg}>{txt}</Mono>
                  </div>
                </BlurIn>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AbsoluteFill>
  );
};
