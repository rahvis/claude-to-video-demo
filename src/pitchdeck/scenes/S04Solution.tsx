import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Glow, Headline, Icon } from "../components/ui";
import { C } from "../theme";

export const S04Solution: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tSetup = useEvent("setup");
  const tTransform = useEvent("transform");
  const tNoRetrain = useEvent("noRetrain");
  const tNoNewModel = useEvent("noNewModel");
  const tClosing = useEvent("closing");

  const setupIn = prog(f, tSetup, 26, EASE_IN_OUT);
  const transformP = prog(f, tTransform, 34, EASE_IN_OUT);
  const size = portrait ? 54 : 60;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tTransform} opacity={0.42} size={portrait ? 1300 : 1600} />
      <div style={{ padding: portrait ? "0 60px" : "0 150px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <BlurIn at={tSetup} y={20} dur={24} style={{ marginBottom: 56 }}>
          <Headline size={size} style={{ textAlign: "center" }}>The guarantee your model already had.</Headline>
        </BlurIn>

        <div style={{ display: "flex", alignItems: "center", gap: portrait ? 30 : 50, opacity: setupIn }}>
          <div
            style={{
              padding: "22px 34px",
              borderRadius: 24,
              background: C.card,
              opacity: 1 - transformP * 0.7,
              filter: `blur(${transformP * 3}px)`,
              transform: `scale(${1 - transformP * 0.08})`,
            }}
          >
            <div style={{ fontSize: portrait ? 42 : 50, fontWeight: 700, color: C.faint, fontVariantNumeric: "tabular-nums" }}>92%</div>
            <div style={{ fontSize: 15, color: C.faint, marginTop: 4 }}>confidence</div>
          </div>

          <div style={{ fontSize: portrait ? 32 : 40, color: C.dim, fontWeight: 300 }}>&#8594;</div>

          <div style={{ position: "relative" }}>
            <PulseRing at={tTransform} />
            <div
              style={{
                position: "relative",
                padding: "22px 34px",
                borderRadius: 24,
                background: C.blueFaint,
                border: `1px solid ${C.blue}44`,
                opacity: transformP,
                transform: `scale(${0.94 + 0.06 * transformP})`,
                boxShadow: transformP > 0.5 ? `0 0 ${transformP * 40}px ${C.blue}33` : undefined,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <Icon.Check size={34} color={C.blue} stroke={3} />
              <div>
                <div style={{ fontSize: portrait ? 42 : 50, fontWeight: 800, color: C.blue }}>95%</div>
                <div style={{ fontSize: 15, color: C.blue, marginTop: 4 }}>guaranteed coverage</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 54 }}>
          <NoItem label="No retraining." at={tNoRetrain} />
          <NoItem label="No new model." at={tNoNewModel} />
        </div>

        <div style={{ marginTop: 40, opacity: prog(f, tClosing, 22) }}>
          <Headline size={portrait ? 30 : 34} style={{ textAlign: "center", color: C.dim, fontWeight: 600 }}>
            The math was always there. Now it's proven.
          </Headline>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A ring that expands and fades once, like a confirmation pulse, behind the guarantee badge as it lands. */
const PulseRing: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const p = Math.min(1, Math.max(0, prog(f, at, 30)));
  if (p <= 0 || p >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 24,
        border: `2px solid ${C.blue}`,
        opacity: (1 - p) * 0.6,
        transform: `scale(${1 + p * 0.35})`,
        pointerEvents: "none",
      }}
    />
  );
};

const NoItem: React.FC<{ label: string; at: number }> = ({ label, at }) => (
  <BlurIn at={at} y={14} dur={18}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Icon.X size={24} color={C.faint} stroke={3} />
      <Headline size={38} style={{ color: C.dim }}>{label}</Headline>
    </div>
  </BlurIn>
);
