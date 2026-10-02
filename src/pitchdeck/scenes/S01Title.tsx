import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Body, Card, Glow, Mono } from "../components/ui";
import { C, gradientText } from "../theme";

const GLITCH_VALUES = [92, 61, 84, 47, 92, 70, 92];

export const S01Title: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tHold = useEvent("hold");
  const tDoubt = useEvent("doubt");
  const tImpact = useEvent("impact");
  const tSubline = useEvent("subline");
  const markSize = portrait ? 82 : 98;

  const cardIn = prog(f, tHold, 26, EASE_IN_OUT);
  const cardOut = prog(f, tImpact - 20, 20, EASE_IN_OUT);
  const inGlitch = f >= tDoubt && f < tImpact - 6;
  const glitchIdx = Math.floor((f - tDoubt) / 5) % GLITCH_VALUES.length;
  const shownValue = f < tDoubt ? 92 : inGlitch ? GLITCH_VALUES[glitchIdx] : 92;
  const shake = inGlitch ? (Math.floor(f / 2) % 2 === 0 ? 2 : -2) : 0;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tImpact} opacity={0.6} size={portrait ? 1300 : 1700} />

      <div
        style={{
          position: "absolute",
          opacity: cardIn * (1 - cardOut),
          transform: `translateY(${(1 - cardIn) * 18 - cardOut * 14}px) scale(${1 - cardOut * 0.05})`,
          filter: cardOut > 0 ? `blur(${cardOut * 10}px)` : undefined,
        }}
      >
        <Card style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 18 }}>
          <Body size={20} color={C.fg} style={{ fontWeight: 600 }}>
            "Yes, I'm confident about that."
          </Body>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              background: inGlitch ? C.track : C.blueFaint,
              border: `1px solid ${inGlitch ? C.grey : C.blue}55`,
              transform: `translateX(${shake}px)`,
              flexShrink: 0,
            }}
          >
            <Mono size={19} color={inGlitch ? C.greyText : C.blue} style={{ fontWeight: 700 }}>
              {shownValue}% confident
            </Mono>
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: portrait ? "0 70px" : "0 190px" }}>
        <BlurIn at={tImpact} dur={30} y={40} blur={22} scale={0.92}>
          <div style={{ fontSize: markSize, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.02, textAlign: "center", ...gradientText() }}>
            Conformal{portrait ? <br /> : " "}Logit Inference
          </div>
        </BlurIn>
        <div style={{ marginTop: portrait ? 30 : 34, opacity: prog(f, tSubline, 22, EASE_IN_OUT) }}>
          <Body size={portrait ? 26 : 30} color={C.dim} style={{ textAlign: "center", fontWeight: 600 }}>
            A confidence score you can actually verify.
          </Body>
        </div>
      </div>
    </AbsoluteFill>
  );
};
