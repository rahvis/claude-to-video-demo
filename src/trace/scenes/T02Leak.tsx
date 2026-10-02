import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BlurIn, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { C } from "../../light/theme";

export const T02Leak: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tBig = useEvent("big");
  const tDrip = useEvent("drip");
  const c = [useCue(0), useCue(1), useCue(2)];
  const words = c[0].words;
  const size = portrait ? 150 : 150;

  // the full stop swells, lets go and falls like a drop
  const swell = prog(f, tDrip - 10, 10);
  const fall = interpolate(f, [tDrip, tDrip + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const drop = (
    <span
      style={{
        display: "inline-block",
        color: C.coral,
        transformOrigin: "50% 30%",
        transform: `translateY(${fall * 520 + swell * 6}px) scale(${1 - 0.1 * fall}, ${1 + 0.25 * swell + 0.5 * fall})`,
        opacity: 1 - prog(f, tDrip + 14, 8),
      }}
    >
      .
    </span>
  );

  const word = (i: number, text: string, style?: React.CSSProperties) => (
    <BlurIn inline at={Math.min(words[i].frame, tBig + 20) - 2} dur={16} y={40} blur={18} scale={1.06} style={style}>
      {text}
    </BlurIn>
  );

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", fontSize: size, fontWeight: 650, letterSpacing: "-0.05em", lineHeight: 1.06, color: C.fg }}>
        {word(0, "And")} {word(1, "it")}
        {portrait ? <br /> : " "}
        {word(2, "still")}{" "}
        <BlurIn inline at={words[3].frame - 2} dur={16} y={40} blur={18} scale={1.06}>
          <span style={{ color: C.coral }}>leaks</span>
          {drop}
        </BlurIn>
      </div>
      <Swap
        align="center"
        style={{ marginTop: 64 }}
        items={[
          { at: c[1].frame, node: <div style={{ fontSize: portrait ? 50 : 48, color: C.dim, letterSpacing: "-0.02em" }}>Not through what it says.</div> },
          { at: c[2].frame, node: <div style={{ fontSize: portrait ? 50 : 48, color: C.fg, fontWeight: 600, letterSpacing: "-0.02em" }}>Through how it works.</div> },
        ]}
      />
    </AbsoluteFill>
  );
};
