import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EASE_IN_OUT, prog } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Headline } from "../components/ui";
import { C, GRADIENT } from "../theme";

const STEPS = [
  { n: 1, label: "Bring the model you already use.", eventKey: "w1" as const },
  { n: 2, label: "Calibrate it once.", eventKey: "w2" as const },
  { n: 3, label: "Query it with guarantees.", eventKey: "w3" as const },
];

export const S09Promise: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const times = { w1: useEvent("w1"), w2: useEvent("w2"), w3: useEvent("w3") };
  const c3 = useCue(3);
  const tRule = useEvent("rule");
  const rule = prog(f, tRule, 30, EASE_IN_OUT);
  const size = portrait ? 60 : 68;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 46 : 90 }}>
        {STEPS.map(({ n, label, eventKey }) => {
          const t = times[eventKey];
          const p = prog(f, t, 24, EASE_IN_OUT);
          return (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
                opacity: p,
                transform: `translateY(${(1 - p) * 26}px) scale(${0.9 + 0.1 * p})`,
              }}
            >
              <div
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: "50%",
                  border: `2px solid ${C.blue}55`,
                  background: `${C.blue}0d`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  fontWeight: 700,
                  color: C.blue,
                }}
              >
                {n}
              </div>
              <Headline size={size} style={{ maxWidth: 340, textAlign: "center" }}>{label}</Headline>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: portrait ? 260 : 200,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          opacity: prog(f, c3.frame, 22),
        }}
      >
        <div style={{ width: portrait ? 420 : 600, height: 4, borderRadius: 3, background: GRADIENT, transform: `scaleX(${rule})`, margin: "0 auto 26px" }} />
        <div style={{ fontSize: portrait ? 34 : 38, fontWeight: 500, color: C.dim }}>That's the whole workflow.</div>
      </div>
    </AbsoluteFill>
  );
};
