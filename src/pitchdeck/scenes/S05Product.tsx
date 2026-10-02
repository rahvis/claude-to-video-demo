import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Body, Card, Glow, Headline, Mono } from "../components/ui";
import { C } from "../theme";

const PRIMITIVES = ["Belief", "Set", "Interval", "Gate", "Claim", "Judge", "Route"];

const ENGINES = [
  { name: "Conformal prediction", desc: "guaranteed coverage", eventKey: "e1" as const },
  { name: "Venn-Abers calibration", desc: "trustworthy probabilities", eventKey: "e2" as const },
  { name: "E-values", desc: "tests that never overclaim", eventKey: "e3" as const },
];

export const S05Product: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tList = useEvent("list");
  const tItems = useEvent("items");
  const times = { e1: useEvent("e1"), e2: useEvent("e2"), e3: useEvent("e3") };
  const tAcademic = useEvent("academic");
  const tClosing = useEvent("closing");

  const listIn = prog(f, tList, 26, EASE_IN_OUT);
  const size = portrait ? 46 : 52;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tAcademic} opacity={0.36} size={portrait ? 1300 : 1600} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: portrait ? "0 50px" : "0 130px", textAlign: "center" }}>
        <BlurIn at={tList} y={18} dur={22} style={{ marginBottom: 50 }}>
          <Headline size={size} style={{ textAlign: "center" }}>Ask a sharper question.</Headline>
        </BlurIn>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, opacity: listIn, marginBottom: 50 }}>
          {PRIMITIVES.map((p, i) => (
            <BlurIn key={p} at={tItems + i * 4} y={12} dur={16} inline>
              <div style={{ padding: "10px 22px", borderRadius: 999, border: `1px solid ${C.hairline}`, background: C.card }}>
                <Mono size={19} color={C.blue} style={{ fontWeight: 700 }}>{p}</Mono>
              </div>
            </BlurIn>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", gap: 18 }}>
          {ENGINES.map((e) => {
            const p = prog(f, times[e.eventKey], 26, EASE_IN_OUT);
            return (
              <div key={e.name} style={{ opacity: p, transform: `translateY(${(1 - p) * 18}px) scale(${0.96 + 0.04 * p})` }}>
                <Card style={{ padding: "22px 26px", width: portrait ? 320 : 260, textAlign: "left" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.fg, fontFamily: "inherit" }}>{e.name}</div>
                  <Body size={14} color={C.dim} style={{ marginTop: 6 }}>{e.desc}</Body>
                </Card>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 34, opacity: prog(f, tAcademic, 22) }}>
          <Mono size={15} color={C.faint}>Research spanning MIT, Stanford, Berkeley, and Google</Mono>
        </div>
        <div style={{ marginTop: 20, opacity: prog(f, tClosing, 22) }}>
          <Headline size={portrait ? 28 : 32} style={{ textAlign: "center", color: C.dim, fontWeight: 600 }}>
            Decades of statistics. Pointed at LLMs.
          </Headline>
        </div>
      </div>
    </AbsoluteFill>
  );
};
