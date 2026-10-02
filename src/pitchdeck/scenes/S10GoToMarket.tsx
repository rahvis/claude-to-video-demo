import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Badge, Body, Glow, Headline, Mono } from "../components/ui";
import { C } from "../theme";

const STEPS = [
  { n: 1, label: "Developer installs.", eventKey: "step1" as const },
  { n: 2, label: "Team adopts.", eventKey: "step2" as const },
  { n: 3, label: "Compliance signs off.", eventKey: "step3" as const },
];

export const S10GoToMarket: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tIntro = useEvent("intro");
  const tBeta = useEvent("beta");
  const times = { step1: useEvent("step1"), step2: useEvent("step2"), step3: useEvent("step3") };
  const tClosing = useEvent("closing");
  const size = portrait ? 46 : 52;
  const betaIn = prog(f, tBeta, 22, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tBeta} opacity={0.34} size={portrait ? 1200 : 1500} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: portrait ? "0 50px" : "0 130px", textAlign: "center" }}>
        <BlurIn at={tIntro} y={18} dur={22}>
          <Headline size={size} style={{ textAlign: "center" }}>Bottom up, one model at a time.</Headline>
        </BlurIn>

        <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: betaIn, transform: `translateY(${(1 - betaIn) * 16}px)`, marginTop: 32, marginBottom: 46 }}>
          <Badge>Beta. Live on PyPI.</Badge>
          <Mono size={16} color={C.dim} style={{ background: C.card, padding: "8px 16px", borderRadius: 999 }}>pip install cci-sdk</Mono>
        </div>

        <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 34 : 56 }}>
          {STEPS.map((s, i) => {
            const p = prog(f, times[s.eventKey], 24, EASE_IN_OUT);
            return (
              <React.Fragment key={s.label}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: p, transform: `translateY(${(1 - p) * 20}px) scale(${0.92 + 0.08 * p})` }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", border: `2px solid ${C.blue}55`, background: C.blueFaint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: C.blue }}>
                    {s.n}
                  </div>
                  <Body size={18} color={C.fg} style={{ fontWeight: 600, maxWidth: 200 }}>{s.label}</Body>
                </div>
                {i < STEPS.length - 1 && !portrait && <FlowConnector at={times[s.eventKey]} width={56} /> }
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ marginTop: 44, opacity: prog(f, tClosing, 22) }}>
          <Headline size={portrait ? 26 : 30} style={{ textAlign: "center", color: C.dim, fontWeight: 600 }}>
            It sells itself in.
          </Headline>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A short connector line with a small dot looping along it once the step it follows has landed, visualizing the hand-off between steps. */
const FlowConnector: React.FC<{ at: number; width: number }> = ({ at, width }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 24, EASE_IN_OUT);
  const loop = 46;
  const travel = ((f - at) % loop) / loop;
  const dotX = f >= at ? Math.max(2, Math.min(width - 2, travel * width)) : 2;
  return (
    <svg width={width} height={16} style={{ opacity: p, overflow: "visible" }}>
      <line x1={0} y1={8} x2={width} y2={8} stroke={C.track} strokeWidth={3} strokeLinecap="round" />
      {f >= at && <circle cx={dotX} cy={8} r={4} fill={C.blue} />}
    </svg>
  );
};
