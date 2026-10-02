import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Eyebrow, Glow, Headline, Mono } from "../components/ui";
import { C } from "../theme";

const ENGINES = [
  { name: "Conformal prediction", desc: "prediction sets with guaranteed coverage", key: "e1" as const },
  { name: "Venn-Abers calibration", desc: "well-calibrated probabilities, any model", key: "e2" as const },
  { name: "E-values", desc: "anytime-valid tests that never overclaim", key: "e3" as const },
];

export const S06Engines: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2), useCue(3)];
  const tTiles = useEvent("tiles");
  const times = { e1: useEvent("e1"), e2: useEvent("e2"), e3: useEvent("e3") };

  const tilesIn = prog(f, tTiles, 26, EASE_IN_OUT);
  const size = portrait ? 56 : 62;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tTiles} opacity={0.22} size={portrait ? 1200 : 1500} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: portrait ? "0 60px" : "0 140px", textAlign: "center" }}>
        <BlurIn at={c[0].frame - 4}>
          <Eyebrow>Under the hood</Eyebrow>
        </BlurIn>
        <Swap
          align="center"
          style={{ marginTop: 14 }}
          items={[
            { at: c[0].frame, node: <Headline size={size} style={{ textAlign: "center" }}>Underneath, three statistical engines do the heavy lifting.</Headline> },
            { at: c[1].frame, node: <Headline size={size} style={{ textAlign: "center" }}>Conformal prediction, for guaranteed coverage.</Headline> },
            { at: c[2].frame, node: <Headline size={size} style={{ textAlign: "center" }}>Venn-Abers calibration, for probabilities you can trust.</Headline> },
            { at: c[3].frame, node: <Headline size={size} style={{ textAlign: "center" }}>And e-values, for tests that never overclaim.</Headline> },
          ]}
        />

        <div
          style={{
            marginTop: portrait ? 56 : 64,
            display: "flex",
            flexDirection: portrait ? "column" : "row",
            gap: 20,
            opacity: tilesIn,
            transform: `translateY(${(1 - tilesIn) * 20}px)`,
          }}
        >
          {ENGINES.map((e) => {
            const active = f >= times[e.key];
            return (
              <Card
                key={e.name}
                style={{
                  padding: "26px 28px",
                  width: portrait ? 460 : 320,
                  textAlign: "left",
                  border: `1px solid ${active ? `${C.blue}55` : C.hairline}`,
                  boxShadow: active ? `0 1px 2px rgba(0,0,0,0.04), 0 18px 50px ${C.blue}22` : undefined,
                  transition: undefined,
                  opacity: active ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 650, color: active ? C.blue : C.fg }}>{e.name}</div>
                <Mono size={16} color={C.dim} style={{ marginTop: 8, display: "block" }}>{e.desc}</Mono>
              </Card>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
