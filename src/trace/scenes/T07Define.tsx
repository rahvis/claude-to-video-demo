import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Eyebrow, Headline, Mono } from "../../light/components/ui";
import { C, SANS } from "../../light/theme";
import { STEPS, TraceChart } from "../components/Trace";

// Definition 1 of the paper: the release M is (ε, δ)-trace-private w.r.t. a neighbor relation
// if Pr[M(x) ∈ S] ≤ e^ε Pr[M(x′) ∈ S] + δ for every measurable set S of variable-length traces.
const SIX = [STEPS[0], STEPS[1], STEPS[3], STEPS[4], STEPS[5], STEPS[6]];

const Formula: React.FC<{ size: number }> = ({ size }) => {
  const i = (s: string) => <span style={{ fontStyle: "italic" }}>{s}</span>;
  return (
    <div style={{ fontFamily: SANS, fontSize: size, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
      Pr[{i("M")}({i("x")}) ∈ {i("S")}] ≤ {i("e")}
      <sup style={{ fontSize: "0.6em" }}>ε</sup> Pr[{i("M")}({i("x′")}) ∈ {i("S")}] + δ
    </div>
  );
};

export const T07Define: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2)];
  const tFormula = useEvent("formula");
  const tTraces = useEvent("traces");
  const b = [useEvent("budget1"), useEvent("budget2")];
  const vw = portrait ? 920 : 860;
  const grow = prog(f, tTraces + 4, 26, EASE_IN_OUT);

  const text = (
    <div style={{ width: portrait ? 920 : 700 }}>
      <BlurIn at={tFormula + 2}>
        <Eyebrow>(ε, δ)-trace-privacy</Eyebrow>
      </BlurIn>
      <Swap
        style={{ marginTop: 16 }}
        items={[
          { at: c[0].frame, node: <Headline size={portrait ? 78 : 70}>Differential privacy over the execution itself.</Headline> },
          { at: c[1].frame, node: <Headline size={portrait ? 78 : 70}>Traces of any length. Chosen at runtime.</Headline> },
          { at: c[2].frame, node: <Headline size={portrait ? 78 : 70}>Separate budgets for membership and attributes.</Headline> },
        ]}
      />
    </div>
  );

  const trace = (label: string, n: number, steps: typeof STEPS, delay: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ width: 92 }}>
        <Mono size={26} color={C.fg} style={{ fontWeight: 600 }}>
          {label}
        </Mono>
        <Mono size={20} style={{ display: "block", marginTop: 4 }}>
          n = {n}
        </Mono>
      </div>
      <TraceChart
        id={`t07-${label}`}
        width={vw - 116}
        steps={steps}
        upMax={46}
        downMax={30}
        blockH={18}
        gap={10}
        appear={(i) => prog(f, tTraces + delay + i * 2, 12)}
        up={() => grow}
        down={() => grow}
      />
    </div>
  );

  const budget = (at: number, who: string, rel: string, desc: string) => (
    <BlurIn at={at} dur={18} y={20} scale={0.96}>
      <div
        style={{
          width: portrait ? 440 : 410,
          padding: "22px 26px",
          borderRadius: 26,
          border: `1.5px solid ${C.hairline}`,
          background: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 650, letterSpacing: "-0.02em" }}>{who}</div>
        <Mono size={24} color={C.periwinkle} style={{ display: "block", marginTop: 8 }}>
          {rel}
        </Mono>
        <Mono size={20} style={{ display: "block", marginTop: 6 }}>
          {desc}
        </Mono>
      </div>
    </BlurIn>
  );

  const visual = (
    <div style={{ width: vw, display: "flex", flexDirection: "column", gap: portrait ? 50 : 38 }}>
      <BlurIn at={tFormula} dur={22} y={30} scale={0.97}>
        <Card style={{ padding: "30px 36px" }}>
          <Mono size={20}>for every neighbor pair and every set of traces S</Mono>
          <div style={{ marginTop: 16 }}>
            <Formula size={portrait ? 50 : 48} />
          </div>
        </Card>
      </BlurIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, opacity: prog(f, tTraces - 4, 12) }}>
        {trace("T", 6, SIX, 0)}
        {trace("T′", 7, STEPS, 6)}
        <BlurIn at={tTraces + 16} dur={16} y={8}>
          <Mono size={21}>sample space ⊔ₙ Σⁿ × ℝⁿ≥0 × ℕⁿ × ℕⁿ · n is a stopping time</Mono>
        </BlurIn>
      </div>
      <div style={{ display: "flex", gap: portrait ? 40 : 40 }}>
        {budget(b[0], "Membership", "corpus neighbors  D ≃ D′", "one record differs")}
        {budget(b[1], "Attributes", "query neighbors  q ≃ q′", "one clause differs")}
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: portrait ? "column" : "row",
        gap: portrait ? 90 : 110,
      }}
    >
      {text}
      {visual}
    </AbsoluteFill>
  );
};
