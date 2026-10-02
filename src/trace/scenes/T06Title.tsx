import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { C, gradientText } from "../../light/theme";
import { Mark } from "../components/Trace";

export const T06Title: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tIntro = useEvent("intro");
  const at = [useEvent("impact"), useEvent("w2")];
  const sheen = prog(f, useEvent("sheen"), 24, EASE_IN_OUT);
  const size = portrait ? 200 : 210;
  const grow = (i: number) =>
    interpolate(f, [at[0] - 6 + i * 2, at[0] + 10 + i * 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.34, 1.56, 0.64, 1) });

  const word = (w: string, i: number) => (
    <BlurIn key={w} at={at[i]} dur={26} y={40} blur={24} scale={0.93} inline={!portrait}>
      <div style={{ fontSize: size, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 0.98, textAlign: "center", position: "relative" }}>
        <span style={{ opacity: i === 1 ? 1 - sheen : 1 }}>{w}</span>
        {i === 1 && <span style={{ position: "absolute", left: 0, top: 0, paddingRight: "0.12em", opacity: sheen, ...gradientText(100) }}>{w}</span>}
      </div>
    </BlurIn>
  );

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ marginBottom: 44 }}>
          <Mark size={portrait ? 150 : 130} grow={grow} />
        </div>
        <BlurIn at={tIntro} dur={22}>
          <div style={{ fontSize: 40, color: C.dim, fontWeight: 500, letterSpacing: "-0.015em", marginBottom: 26 }}>Introducing</div>
        </BlurIn>
        <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 0 : "0.24em", fontSize: size }}>
          {["Trace", "Privacy"].map(word)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
