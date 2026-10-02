import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Eyebrow, Glow, Headline, Mono } from "../components/ui";
import { C } from "../theme";

const PRIMITIVES = [
  { name: "Belief", desc: "a calibrated probability" },
  { name: "Set", desc: "the calibrated candidates" },
  { name: "Interval", desc: "a numeric range with coverage" },
  { name: "Gate", desc: "approve, escalate, or abstain" },
  { name: "Claim", desc: "true or false, held to an error rate" },
  { name: "Judge", desc: "a ranked, defensible verdict" },
  { name: "Route", desc: "the queue with a bound on error" },
];

export const S04Primitives: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2)];
  const tList = useEvent("list");
  const tItems = useEvent("items");

  const listIn = prog(f, tList, 26, EASE_IN_OUT);
  const size = portrait ? 56 : 62;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tItems} opacity={0.22} size={portrait ? 1200 : 1500} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 50 : 100, padding: portrait ? "0 60px" : "0 150px" }}>
        <div style={{ maxWidth: portrait ? "100%" : 520 }}>
          <BlurIn at={c[0].frame - 4}>
            <Eyebrow>Typed primitives</Eyebrow>
          </BlurIn>
          <Swap
            style={{ marginTop: 14 }}
            items={[
              { at: c[0].frame, node: <Headline size={size}>Instead of one flat number, ask a sharper question.</Headline> },
              { at: c[1].frame, node: <Headline size={size}>A Belief, a Set, a Gate: seven typed answers, all from one SDK call.</Headline> },
              { at: c[2].frame, node: <Headline size={size}>Guarantees, not guesses.</Headline> },
            ]}
          />
        </div>

        <div style={{ width: portrait ? "100%" : 480, opacity: listIn, transform: `translateY(${(1 - listIn) * 24}px)` }}>
          <Card style={{ padding: "10px 8px" }}>
            {PRIMITIVES.map((p, i) => (
              <BlurIn key={p.name} at={tItems + i * 5} y={10} dur={16}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 14,
                    padding: "14px 22px",
                    borderTop: i > 0 ? `1px solid ${C.hairline}` : undefined,
                  }}
                >
                  <Mono size={19} color={C.blue} style={{ fontWeight: 600, width: 96, flexShrink: 0 }}>{p.name}</Mono>
                  <Mono size={17} color={C.dim}>{p.desc}</Mono>
                </div>
              </BlurIn>
            ))}
          </Card>
        </div>
      </div>
    </AbsoluteFill>
  );
};
