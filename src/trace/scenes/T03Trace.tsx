import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Eyebrow, Headline, Mono } from "../../light/components/ui";
import { C } from "../../light/theme";
import { LegendChip, REQ, RESP, TraceChart } from "../components/Trace";

export const T03Trace: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [0, 1, 2, 3, 4].map((i) => useCue(i));
  const tPath = useEvent("path");
  const tSteps = useEvent("steps");
  const tTiming = useEvent("timing");
  const tBytes = useEvent("bytes");
  const tShape = useEvent("shape");
  const hs = portrait ? 76 : 72;

  const chips = [
    { label: "Steps", at: tSteps, swatch: <div style={{ width: 18, height: 18, borderRadius: 9, background: C.fg }} /> },
    { label: "Timing", at: tTiming, swatch: <div style={{ width: 30, height: 12, borderRadius: 6, border: `3px solid ${C.fg}` }} /> },
    { label: "Request bytes", at: tBytes, swatch: <div style={{ width: 16, height: 22, borderRadius: 5, background: REQ }} /> },
    { label: "Response bytes", at: tBytes + 12, swatch: <div style={{ width: 16, height: 22, borderRadius: 5, background: RESP }} /> },
  ];

  const shape = prog(f, tShape, 44, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{ padding: portrait ? "0 80px" : "0 150px", justifyContent: "center" }}>
      <BlurIn at={c[0].frame - 4}>
        <Eyebrow>The execution trace</Eyebrow>
      </BlurIn>
      <Swap
        style={{ marginTop: 16 }}
        items={[
          { at: c[0].frame, node: <Headline size={hs}>An agent decides its own computation.</Headline> },
          { at: c[1].frame, node: <Headline size={hs}>How many steps.</Headline> },
          { at: c[2].frame, node: <Headline size={hs}>How long each one takes.</Headline> },
          { at: c[3].frame, node: <Headline size={hs}>How many bytes it sends.</Headline> },
          {
            at: c[4].frame,
            node: (
              <Headline size={hs}>
                That shape encodes your <span style={{ color: C.coral }}>private data.</span>
              </Headline>
            ),
          },
        ]}
      />
      <div style={{ marginTop: portrait ? 120 : 64 }}>
        <TraceChart
          id="t03"
          width={portrait ? 920 : 1620}
          upMax={portrait ? 330 : 230}
          downMax={portrait ? 220 : 150}
          blockH={portrait ? 34 : 30}
          gap={portrait ? 12 : 16}
          appear={(i) => prog(f, tPath + i * 4, 14)}
          flash={(i) => 1 - prog(f, tPath + i * 4 + 6, 18)}
          numbers={(i) => prog(f, tSteps + i * 3, 12)}
          widthMix={prog(f, tTiming, 30, EASE_IN_OUT)}
          up={(i) => prog(f, tBytes + i * 3, 22)}
          down={(i) => prog(f, tBytes + 12 + i * 3, 22)}
          outline={shape}
          dim={shape * 0.7}
        />
      </div>
      <BlurIn at={tPath + 20} dur={20} y={16}>
        <div style={{ marginTop: portrait ? 110 : 46, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: portrait ? "flex-start" : "center" }}>
          {chips.map((ch) => (
            <LegendChip key={ch.label} label={ch.label} on={prog(f, ch.at, 14)} swatch={ch.swatch} size={portrait ? 28 : 26} />
          ))}
        </div>
      </BlurIn>
      <BlurIn at={tShape + 20} dur={20} y={12} style={{ marginTop: portrait ? 40 : 26, textAlign: portrait ? "left" : "center" }}>
        <Mono size={portrait ? 26 : 23}>chosen at runtime, conditioned on the private corpus and query</Mono>
      </BlurIn>
    </AbsoluteFill>
  );
};
