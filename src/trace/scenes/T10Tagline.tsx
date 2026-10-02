import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Headline } from "../../light/components/ui";
import { C, GRADIENT, gradientText } from "../../light/theme";
import { Mark } from "../components/Trace";

export const T10Tagline: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const t1 = useEvent("line1");
  const t2 = useEvent("line2");
  const tMark = useEvent("mark");
  const words = useCue(2).words;
  const out = prog(f, tMark - 12, 14, EASE_IN_OUT);
  const rule = prog(f, words[1].frame + 14, 30, EASE_IN_OUT);
  const size = portrait ? 112 : 118;
  const grow = (i: number) =>
    interpolate(f, [tMark - 4 + i * 2, tMark + 12 + i * 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.34, 1.56, 0.64, 1) });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - out,
          transform: `translateY(${-out * 30}px)`,
          filter: out > 0 ? `blur(${out * 14}px)` : undefined,
          textAlign: "center",
        }}
      >
        <BlurIn at={t1} dur={24} y={30} blur={18}>
          <Headline size={size} style={{ letterSpacing: "-0.05em" }}>
            How you call{portrait ? <br /> : " "}a hosted model
          </Headline>
        </BlurIn>
        <BlurIn at={t2} dur={24} y={30} blur={18}>
          <Headline size={size} style={{ letterSpacing: "-0.05em", marginTop: 12, ...gradientText() }}>
            is a privacy{portrait ? <br /> : " "}decision.
          </Headline>
        </BlurIn>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ marginBottom: portrait ? 50 : 40 }}>
          <Mark size={portrait ? 150 : 120} grow={grow} />
        </div>
        <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 0 : 30 }}>
          {["Trace", "Privacy"].map((w, i) => (
            <BlurIn key={w} at={words[i].frame - 2} dur={26} y={30} blur={20} scale={0.95}>
              <div style={{ fontSize: portrait ? 150 : 130, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1.02, color: C.fg }}>{w}</div>
            </BlurIn>
          ))}
        </div>
        <div style={{ marginTop: portrait ? 44 : 38, width: portrait ? 560 : 820, height: 5, borderRadius: 3, background: GRADIENT, transform: `scaleX(${rule})` }} />
        <BlurIn at={words[1].frame + 26} dur={24} y={14}>
          <div style={{ marginTop: 34, fontSize: portrait ? 38 : 36, fontWeight: 500, color: C.dim, letterSpacing: "-0.015em", textAlign: "center" }}>
            Differential privacy for{portrait ? <br /> : " "}adaptive agent execution
          </div>
        </BlurIn>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
