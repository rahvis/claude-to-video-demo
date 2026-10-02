import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, Counter, EASE_IN_OUT, mix, prog, Swap } from "../lib/motion";
import { useCue, useEvent, useLayout } from "../lib/scene";
import { Card, Eyebrow, Headline, Mono } from "../components/ui";
import { C, MODES, MONO, gradientText } from "../theme";

// Real per-response outputs from the live deployment (paper, Appendix A). A category
// enters C(x) iff P̂ ≥ 1 − q̂ = 0.342 at the deployed q̂ = 0.6580.
const EX = [
  { q: "What does EIN stand for?", p: [62.16, 22.96, 14.88], outcome: "|C(x)| = 1  →  answers" },
  { q: "Do I need to register for sales tax in another state?", p: [7.82, 46.64, 45.54], outcome: "|C(x)| = 2  →  returns the set" },
  { q: "Should the deposit be refundable?", p: [34.02, 31.95, 34.03], outcome: "|C(x)| = 0  →  abstains" },
];
const THRESH = 34.2;

export const S05Conformal: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [0, 1, 2, 3, 4].map((i) => useCue(i));
  const tBars = useEvent("bars");
  const sets = [useEvent("set1"), useEvent("set2"), useEvent("set0")];
  const switches = [tBars, c[2].frame - 8, c[3].frame - 8];
  const stage = f >= switches[2] ? 2 : f >= switches[1] ? 1 : 0;
  const grow = prog(f, tBars, 26);
  const toCov = prog(f, c[4].frame - 6, 16, EASE_IN_OUT);

  const values = [0, 1, 2].map((j) => {
    let v = EX[0].p[j];
    v = mix(v, EX[1].p[j], prog(f, switches[1], 18, EASE_IN_OUT));
    v = mix(v, EX[2].p[j], prog(f, switches[2], 18, EASE_IN_OUT));
    return v * grow;
  });
  const member = [0, 1, 2].map((j) => (EX[stage].p[j] >= THRESH ? prog(f, sets[stage], 12) : 0));

  const trackW = portrait ? 920 : 520;
  const labelW = portrait ? 0 : 340;

  const bars = (
    <div style={{ width: portrait ? 920 : 1000 }}>
      <Swap
        items={EX.map((e, i) => ({
          at: switches[i],
          node: (
            <Mono size={portrait ? 30 : 28} color={C.dim} style={{ fontStyle: "italic" }}>
              “{e.q}”
            </Mono>
          ),
        }))}
      />
      <div style={{ position: "relative", marginTop: 34, display: "flex", flexDirection: "column", gap: portrait ? 40 : 40 }}>
        {MODES.map((m, j) => {
          const on = member[j];
          const fill = (
            <div style={{ width: trackW, height: 24, borderRadius: 12, background: "#1c1c1f", overflow: "hidden" }}>
              <div
                style={{
                  width: `${values[j]}%`,
                  height: "100%",
                  borderRadius: 12,
                  background: on > 0 ? m.color : `${m.color}55`,
                  opacity: 0.55 + 0.45 * on,
                  boxShadow: on > 0 ? `0 0 ${24 * on}px ${m.color}aa` : undefined,
                }}
              />
            </div>
          );
          const value = (
            <span style={{ fontFamily: MONO, fontSize: portrait ? 32 : 30, color: on > 0.5 ? C.fg : C.dim, width: 140, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {values[j].toFixed(2)}%
            </span>
          );
          const label = <span style={{ fontSize: portrait ? 34 : 33, fontWeight: 500, color: on > 0.5 ? m.color : C.fg, width: labelW || undefined }}>{m.label}</span>;
          return portrait ? (
            <div key={m.key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                {label}
                {value}
              </div>
              {fill}
            </div>
          ) : (
            <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {label}
              {fill}
              {value}
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: labelW + (THRESH / 100) * trackW,
            top: portrait ? 30 : -16,
            bottom: -16,
            borderLeft: `2px dashed ${C.teal}`,
            opacity: grow,
          }}
        />
      </div>
      <div style={{ marginLeft: labelW + (THRESH / 100) * trackW - 90, marginTop: 26, opacity: grow }}>
        <Mono size={22} color={C.teal}>
          1 − q̂ = 0.342
        </Mono>
      </div>
    </div>
  );

  const members = MODES.filter((_, j) => EX[stage].p[j] >= THRESH);
  const setPanel = (
    <div style={{ width: portrait ? 920 : 540 }}>
      <Card style={{ padding: "32px 36px", minHeight: portrait ? 200 : 250 }}>
        <Mono size={26} color={C.dim}>
          C(x) =
        </Mono>
        <div key={stage} style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
          {members.length === 0 ? (
            <BlurIn at={sets[stage]} dur={16} scale={0.9} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontFamily: MONO, fontSize: 52, color: C.dim }}>∅</span>
              <span style={{ fontSize: 30, fontWeight: 600, color: C.coral, border: `2px solid ${C.coral}88`, borderRadius: 999, padding: "10px 22px" }}>
                I don’t know
              </span>
            </BlurIn>
          ) : (
            members.map((m, i) => (
              <BlurIn key={m.key} at={sets[stage] + i * 4} dur={16} y={20} scale={0.9}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 30,
                    fontWeight: 600,
                    color: "#000",
                    background: m.color,
                    borderRadius: 999,
                    padding: "12px 24px",
                    boxShadow: `0 10px 40px ${m.color}55`,
                  }}
                >
                  {m.label}
                </span>
              </BlurIn>
            ))
          )}
        </div>
      </Card>
      <Swap
        style={{ marginTop: 22 }}
        items={EX.map((e, i) => ({ at: sets[i], node: <Mono size={26} color={C.fg}>{e.outcome}</Mono> }))}
      />
    </div>
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          padding: portrait ? "0 80px" : "0 150px",
          justifyContent: "center",
          opacity: 1 - toCov,
          filter: toCov > 0 ? `blur(${toCov * 12}px)` : undefined,
          transform: `scale(${1 - 0.04 * toCov})`,
        }}
      >
        <BlurIn at={c[0].frame - 4}>
          <Eyebrow>Conformal prediction</Eyebrow>
        </BlurIn>
        <Swap
          style={{ marginTop: 16 }}
          items={[
            { at: c[0].frame, node: <Headline size={portrait ? 74 : 72}>Every answer carries a calibrated set.</Headline> },
            { at: c[1].frame, node: <Headline size={portrait ? 74 : 72}>One mode: it answers.</Headline> },
            { at: c[2].frame, node: <Headline size={portrait ? 74 : 72}>Several: it says so.</Headline> },
            { at: c[3].frame, node: <Headline size={portrait ? 74 : 72}>None: it abstains.</Headline> },
          ]}
        />
        <div
          style={{
            marginTop: portrait ? 90 : 90,
            display: "flex",
            flexDirection: portrait ? "column" : "row",
            gap: portrait ? 80 : 70,
            alignItems: portrait ? "flex-start" : "center",
          }}
        >
          {bars}
          <BlurIn at={tBars + 6}>{setPanel}</BlurIn>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: toCov }}>
        <BlurIn at={c[4].frame} dur={22} scale={0.94}>
          <div style={{ fontSize: portrait ? 230 : 260, fontWeight: 700, letterSpacing: "-0.06em", lineHeight: 1, ...gradientText() }}>
            <Counter to={90} at={c[4].frame + 2} dur={30} decimals={1} suffix="%" />
          </div>
        </BlurIn>
        <BlurIn at={c[4].frame + 12}>
          <div style={{ marginTop: 26, fontSize: 40, fontWeight: 500, textAlign: "center", letterSpacing: "-0.02em" }}>
            empirical coverage at a 90% target
          </div>
        </BlurIn>
        <BlurIn at={c[4].frame + 22}>
          <div style={{ marginTop: 22, textAlign: "center", lineHeight: 1.6 }}>
            {(portrait
              ? ["α = 0.1 · n = 150 held-out prompts", "Clopper–Pearson 95% [0.840, 0.943]", "marginal coverage of the procedure,", "not a promise about any one answer"]
              : ["α = 0.1 · n = 150 held-out calibration prompts · Clopper–Pearson 95% [0.840, 0.943]", "marginal coverage of the procedure, not a promise about any one answer"]
            ).map((l) => (
              <div key={l}>
                <Mono size={portrait ? 28 : 24}>{l}</Mono>
              </div>
            ))}
          </div>
        </BlurIn>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
