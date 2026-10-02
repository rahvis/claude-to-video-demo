import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Counter, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Body, Card, Glow, Headline, Mono, RangeBar } from "../components/ui";
import { C } from "../theme";

export const S03Problem: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tStat = useEvent("stat");
  const tRange = useEvent("range");
  const tCase = useEvent("case");
  const tClosing = useEvent("closing");

  const closing = prog(f, tClosing, 22);
  const caseIn = prog(f, tCase, 26, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tStat} opacity={0.4} size={portrait ? 1300 : 1600} />
      <div
        style={{
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          alignItems: "center",
          gap: portrait ? 50 : 100,
          padding: portrait ? "0 60px" : "0 140px",
          opacity: 1 - closing,
          filter: closing > 0 ? `blur(${closing * 16}px)` : undefined,
          transform: `scale(${1 - closing * 0.04})`,
        }}
      >
        <div style={{ textAlign: portrait ? "center" : "left" }}>
          <div style={{ fontSize: portrait ? 130 : 160, fontWeight: 800, letterSpacing: "-0.04em", color: C.fg, lineHeight: 1 }}>
            <Counter to={47} at={tStat} dur={30} suffix="%" />
          </div>
          <div style={{ marginTop: 14, maxWidth: 420 }}>
            <Body size={portrait ? 22 : 24} color={C.dim} style={{ fontWeight: 600 }}>
              already burned by generative AI in production
            </Body>
          </div>
          <div style={{ marginTop: 10 }}>
            <Mono size={15} color={C.faint}>McKinsey, State of AI, 2025</Mono>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ opacity: prog(f, tRange - 42, 20) }}>
            <Mono size={17} color={C.dim} style={{ marginBottom: 10, display: "block" }}>Real world hallucination rates</Mono>
            <RangeBar min={11} max={57} scaleMax={70} at={tRange} width={portrait ? 340 : 420} />
          </div>

          <div style={{ opacity: caseIn, transform: `translateY(${(1 - caseIn) * 20}px)` }}>
            <Card style={{ padding: "22px 26px", maxWidth: portrait ? 340 : 420 }}>
              <Mono size={15} color={C.blue} style={{ fontWeight: 700 }}>2024, Civil Resolution Tribunal</Mono>
              <div style={{ marginTop: 8 }}>
                <Body size={18} color={C.fg} style={{ fontWeight: 500 }}>
                  Air Canada was held responsible for a refund its own chatbot invented.
                </Body>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", display: "flex", opacity: closing }}>
        <Headline size={portrait ? 48 : 56} style={{ textAlign: "center", color: C.fg, maxWidth: 900, padding: "0 60px" }}>
          The confidence score never warned anyone.
        </Headline>
      </div>
    </AbsoluteFill>
  );
};
