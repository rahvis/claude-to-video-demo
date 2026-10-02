import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Eyebrow, Glow, Headline, Mono } from "../components/ui";
import { C } from "../theme";

const CHIPS = [
  { label: "LangChain", key: "c1" as const },
  { label: "LangGraph", key: "c2" as const },
  { label: "Google ADK", key: "c3" as const },
  { label: "Microsoft Agent Framework", key: "c4" as const },
];

export const S07Integrations: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c0 = useCue(0);
  const tChips = useEvent("chips");
  const times = { c1: useEvent("c1"), c2: useEvent("c2"), c3: useEvent("c3"), c4: useEvent("c4") };
  const chipsIn = prog(f, tChips, 26, EASE_IN_OUT);
  const size = portrait ? 60 : 68;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tChips} opacity={0.2} size={portrait ? 1100 : 1400} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: portrait ? "0 60px" : "0 140px", textAlign: "center" }}>
        <BlurIn at={c0.frame - 4}>
          <Eyebrow>Integrations</Eyebrow>
        </BlurIn>
        <BlurIn at={c0.frame} style={{ marginTop: 14 }}>
          <Headline size={size} style={{ textAlign: "center" }}>And it plugs straight into the stack you're already running.</Headline>
        </BlurIn>

        <div
          style={{
            marginTop: portrait ? 50 : 60,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
            opacity: chipsIn,
          }}
        >
          {CHIPS.map((chip) => {
            const p = prog(f, times[chip.key], 18);
            return (
              <div
                key={chip.label}
                style={{
                  padding: "16px 28px",
                  borderRadius: 999,
                  border: `1px solid ${C.hairline}`,
                  background: C.card,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 14}px) scale(${0.94 + 0.06 * p})`,
                }}
              >
                <Mono size={22} color={C.fg} style={{ fontWeight: 600 }}>{chip.label}</Mono>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
