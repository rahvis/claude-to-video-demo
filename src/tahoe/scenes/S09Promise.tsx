import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Headline, Icon } from "../components/ui";
import { C, GRADIENT } from "../theme";

const STEPS = [
  { label: "Search.", Icon: Icon.Search, color: C.violet, eventKey: "w1" as const },
  { label: "Save.", Icon: Icon.Bookmark, color: C.pink, eventKey: "w2" as const },
  { label: "Reach out.", Icon: Icon.Send, color: C.orange, eventKey: "w3" as const },
];

export const S09Promise: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const times = { w1: useEvent("w1"), w2: useEvent("w2"), w3: useEvent("w3") };
  const c3 = useCue(3);
  const tRule = useEvent("rule");
  const rule = prog(f, tRule, 30, EASE_IN_OUT);
  const size = portrait ? 76 : 84;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 46 : 90 }}>
        {STEPS.map(({ label, Icon: I, color, eventKey }) => {
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
              <div style={{ width: 88, height: 88, borderRadius: "50%", background: `${color}14`, border: `2px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <I size={40} color={color} />
              </div>
              <Headline size={size} style={{ color }}>{label}</Headline>
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
