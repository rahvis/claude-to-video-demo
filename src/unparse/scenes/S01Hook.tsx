import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, Counter, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Glow, Headline, Mono } from "../components/ui";
import { C } from "../theme";

export const S01Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2)];
  const tBubble = useEvent("bubble");
  const tPercent = useEvent("percent");

  const bubbleIn = prog(f, tBubble, 30, EASE_IN_OUT);
  const size = portrait ? 62 : 72;
  const paceSize = portrait ? 50 : 58;

  // The pain-point beat reveals line by line, synced to the words that carry it.
  const line1At = c[2].words[0].frame;
  const line2At = c[2].words[5].frame;
  const line3At = c[2].words[10].frame;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tBubble} opacity={0.2} size={portrait ? 1100 : 1400} />

      <div
        style={{
          position: "absolute",
          top: portrait ? 220 : 150,
          opacity: bubbleIn,
          transform: `translateY(${(1 - bubbleIn) * -18}px)`,
        }}
      >
        <Card style={{ padding: "20px 26px", display: "flex", alignItems: "center", gap: 16 }}>
          <Mono size={22} color={C.fg}>The payout has likely already cleared.</Mono>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              background: `${C.blue}14`,
              border: `1px solid ${C.blue}44`,
              fontFamily: "inherit",
              fontSize: 20,
              fontWeight: 700,
              color: C.blue,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Counter to={92} at={tPercent} dur={22} suffix="% confident" />
          </div>
        </Card>
      </div>

      <div style={{ marginTop: portrait ? 160 : 130, padding: portrait ? "0 70px" : "0 170px", textAlign: "center" }}>
        <Swap
          align="center"
          items={[
            { at: c[0].frame, node: <Headline size={size} style={{ textAlign: "center" }}>Every AI assistant hands you a confidence score.</Headline> },
            {
              at: c[1].frame,
              node: (
                <Headline size={size} style={{ textAlign: "center" }}>
                  Ninety-two percent, it says. But confident in what, exactly?
                </Headline>
              ),
            },
            {
              at: c[2].frame,
              node: (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <BlurIn at={line1At} y={16} dur={16}>
                    <Headline size={paceSize} style={{ textAlign: "center", color: C.dim }}>It doesn't travel between models.</Headline>
                  </BlurIn>
                  <BlurIn at={line2At} y={16} dur={16}>
                    <Headline size={paceSize} style={{ textAlign: "center", color: C.dim }}>It has no error bars.</Headline>
                  </BlurIn>
                  <BlurIn at={line3At} y={16} dur={16}>
                    <Headline size={paceSize} style={{ textAlign: "center" }}>And it goes stale without telling you.</Headline>
                  </BlurIn>
                </div>
              ),
            },
          ]}
        />
      </div>
    </AbsoluteFill>
  );
};
