import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Body, Glow, Headline, Quadrant } from "../components/ui";
import { C } from "../theme";

const OTHERS = [
  { label: "Arize", x: 0.16, y: 0.32 },
  { label: "Galileo", x: 0.32, y: 0.15 },
  { label: "Patronus", x: 0.13, y: 0.52 },
  { label: "Guardrails AI", x: 0.36, y: 0.64 },
  { label: "Weights & Biases", x: 0.3, y: 0.4 },
];
const US = { label: "Conformal Logit Inference", x: 0.78, y: 0.82 };

export const S08Competition: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tOpen = useEvent("open");
  const tArize = useEvent("arize");
  const tUs = useEvent("us");
  const size = portrait ? 42 : 46;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tArize} opacity={0.3} size={portrait ? 1200 : 1500} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 40 : 80, padding: portrait ? "0 50px" : "0 120px" }}>
        <div style={{ maxWidth: portrait ? "100%" : 420 }}>
          <BlurIn at={tOpen} y={18} dur={22}>
            <Headline size={size}>Everyone measures.</Headline>
          </BlurIn>
          <BlurIn at={tOpen + 6} y={18} dur={22} style={{ marginTop: 4 }}>
            <Headline size={size} style={{ color: C.blue }}>No one guarantees.</Headline>
          </BlurIn>
          <div style={{ marginTop: 24, opacity: prog(f, tUs, 22) }}>
            <Body size={19} color={C.dim} style={{ fontWeight: 500 }}>
              That gap is exactly where we sit.
            </Body>
          </div>
        </div>
        <Quadrant others={OTHERS} us={US} at={tArize} size={portrait ? 380 : 480} />
      </div>
    </AbsoluteFill>
  );
};
