import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, Counter, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Eyebrow, Glow, Headline, Mono } from "../components/ui";
import { C } from "../theme";

const KPIS = [
  { label: "Applications", to: 1204 },
  { label: "Response rate", to: 41, suffix: "%" },
  { label: "Interview rate", to: 22, suffix: "%" },
  { label: "Hires", to: 9 },
];
const SLICES = [
  { label: "Search", value: 46, color: C.violet },
  { label: "Outreach", value: 31, color: C.orange },
  { label: "Referrals", value: 15, color: C.pink },
  { label: "Other", value: 8, color: C.track },
];

export const S08Analytics: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1)];
  const tTiles = useEvent("tiles");
  const tRing = useEvent("ring");

  const tilesIn = prog(f, tTiles, 26, EASE_IN_OUT);
  const ringP = prog(f, tRing, 40, EASE_IN_OUT);
  const size = portrait ? 62 : 68;

  const R = 70;
  const CIRC = 2 * Math.PI * R;
  let acc = 0;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tRing} opacity={0.22} size={portrait ? 1200 : 1500} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 56 : 90, padding: portrait ? "0 70px" : "0 150px" }}>
        <div style={{ maxWidth: portrait ? "100%" : 520 }}>
          <BlurIn at={c[0].frame - 4}>
            <Eyebrow>Analytics</Eyebrow>
          </BlurIn>
          <Swap
            style={{ marginTop: 14 }}
            items={[
              { at: c[0].frame, node: <Headline size={size}>Every hire, measured.</Headline> },
              { at: c[1].frame, node: <Headline size={size}>From first search to signed offer.</Headline> },
            ]}
          />

          <div style={{ marginTop: 46, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, opacity: tilesIn, transform: `translateY(${(1 - tilesIn) * 20}px)` }}>
            {KPIS.map((k) => (
              <Card key={k.label} style={{ padding: "20px 22px", borderRadius: 22 }}>
                <div style={{ fontSize: 34, fontWeight: 700, color: C.fg, fontVariantNumeric: "tabular-nums" }}>
                  <Counter to={k.to} at={tTiles + 6} dur={30} suffix={k.suffix ?? ""} />
                </div>
                <div style={{ fontSize: 16, color: C.dim, marginTop: 4 }}>{k.label}</div>
              </Card>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: ringP }}>
          <svg width={220} height={220} viewBox="0 0 220 220">
            <circle cx={110} cy={110} r={R} fill="none" stroke={C.track} strokeWidth={22} />
            {SLICES.map((s) => {
              const len = (s.value / 100) * CIRC * ringP;
              const dash = `${len} ${CIRC - len}`;
              const offset = -acc;
              acc += (s.value / 100) * CIRC * ringP;
              return (
                <circle
                  key={s.label}
                  cx={110}
                  cy={110}
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={22}
                  strokeDasharray={dash}
                  strokeDashoffset={offset}
                  transform="rotate(-90 110 110)"
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
            {SLICES.map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                <Mono size={17} color={C.dim}>{s.label} · {s.value}%</Mono>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
