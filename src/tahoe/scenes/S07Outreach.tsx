import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, Counter, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Eyebrow, Glow, Headline, Icon, Mono } from "../components/ui";
import { C } from "../theme";

const STEPS = [
  { label: "Initial email", day: "Day 1" },
  { label: "Follow-up", day: "Day 3" },
  { label: "Final follow-up", day: "Day 7" },
];

export const S07Outreach: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2), useCue(3)];
  const tCompose = useEvent("compose");
  const tInbox = useEvent("inbox");
  const tDay = [useEvent("day1"), useEvent("day3"), useEvent("day7")];
  const tAuto = useEvent("auto");

  const composeIn = prog(f, tCompose, 26, EASE_IN_OUT);
  const size = portrait ? 60 : 64;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tInbox} opacity={0.24} size={portrait ? 1200 : 1500} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 56 : 100, padding: portrait ? "0 70px" : "0 150px" }}>
        <div style={{ maxWidth: portrait ? "100%" : 560 }}>
          <BlurIn at={c[0].frame - 4}>
            <Eyebrow>Outreach</Eyebrow>
          </BlurIn>
          <Swap
            style={{ marginTop: 14 }}
            items={[
              { at: c[0].frame, node: <Headline size={size}>Then Tahoe writes the outreach.</Headline> },
              { at: c[1].frame, node: <Headline size={size}>Sent from your own inbox.</Headline> },
              { at: c[2].frame, node: <Headline size={size}>Day one. Day three. Day seven.</Headline> },
              { at: c[3].frame, node: <Headline size={size}>Automatically.</Headline> },
            ]}
          />
        </div>

        <div style={{ width: portrait ? 460 : 440, opacity: composeIn, transform: `translateY(${(1 - composeIn) * 26}px)` }}>
          <Card style={{ padding: "28px 30px" }}>
            <div style={{ display: "flex", gap: 22, marginBottom: 22 }}>
              <Stat label="Sent" to={214} at={tAuto} />
              <Stat label="Opened" to={162} at={tAuto + 4} />
              <Stat label="Replied" to={38} at={tAuto + 8} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {STEPS.map((s, i) => {
                const on = f >= tDay[i];
                return (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderTop: i > 0 ? `1px solid ${C.hairline}` : undefined }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: on ? C.orange : C.track,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        opacity: prog(f, tDay[i], 14),
                        transform: `scale(${0.7 + 0.3 * prog(f, tDay[i], 14)})`,
                      }}
                    >
                      {on ? <Icon.Check size={16} color="#fff" stroke={3} /> : null}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Mono size={18} color={C.fg}>{s.label}</Mono>
                    </div>
                    <Mono size={16} color={C.dim}>{s.day}</Mono>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Stat: React.FC<{ label: string; to: number; at: number }> = ({ label, to, at }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 30, fontWeight: 700, color: C.fg, fontVariantNumeric: "tabular-nums" }}>
      <Counter to={to} at={at} dur={24} />
    </div>
    <div style={{ fontSize: 15, color: C.dim, marginTop: 2 }}>{label}</div>
  </div>
);
