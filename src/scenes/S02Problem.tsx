import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog, Swap } from "../lib/motion";
import { useCue, useEvent, useLayout } from "../lib/scene";
import { C } from "../theme";

export const S02Problem: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tBig = useEvent("big");
  const tStrike = useEvent("strike");
  const c0 = useCue(0);
  const c1 = useCue(1);
  const lines = portrait ? ["AI can make", "mistakes."] : ["AI can make mistakes."];
  const dimmed = prog(f, tStrike + 4, 16);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <BlurIn at={tBig} dur={26} y={30} blur={20} scale={1.05}>
        {lines.map((l, i) => {
          const s = prog(f, tStrike + i * 5, 12, EASE_IN_OUT);
          return (
            <div
              key={l}
              style={{
                textAlign: "center",
                fontSize: portrait ? 128 : 138,
                fontWeight: 650,
                letterSpacing: "-0.05em",
                lineHeight: 1.06,
                color: interpolateColors(dimmed, [0, 1], [C.fg, "#5a5a5f"]),
              }}
            >
              <span style={{ position: "relative", display: "inline-block" }}>
                {l}
                <span
                  style={{
                    position: "absolute",
                    left: -14,
                    right: -14,
                    top: "53%",
                    height: 9,
                    borderRadius: 5,
                    background: C.coral,
                    transform: `scaleX(${s})`,
                    transformOrigin: "left center",
                    boxShadow: `0 0 24px ${C.coral}88`,
                  }}
                />
              </span>
            </div>
          );
        })}
      </BlurIn>
      <Swap
        align="center"
        style={{ marginTop: 56 }}
        items={[
          { at: c0.frame, node: <div style={{ fontSize: 46, color: C.dim, letterSpacing: "-0.02em" }}>It can never be wrong.</div> },
          { at: c1.frame, node: <div style={{ fontSize: 46, color: C.fg, fontWeight: 600, letterSpacing: "-0.02em" }}>That’s the problem.</div> },
        ]}
      />
    </AbsoluteFill>
  );
};
