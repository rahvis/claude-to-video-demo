import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, mix, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Eyebrow, Headline, Icon, Mono } from "../../light/components/ui";
import { C, GRADIENT } from "../../light/theme";

// Paper, Table 1: group-aware AUC from trace metadata alone on 6 independent groups,
// each against its own calibrated permutation null (p ≤ 0.0005).
const STATS = [
  { key: "attr", value: 0.784, nul: 0.6, label: "Sensitive attribute", ev: "count1" },
  { key: "memb", value: 0.721, nul: 0.58, label: "Membership", ev: "count2" },
];

const Stat: React.FC<{ at: number; value: number; nul: number; label: string; portrait: boolean }> = ({ at, value, nul, label, portrait }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 34, Easing.bezier(0.22, 1, 0.36, 1));
  const v = mix(0.5, value, p);
  const W = portrait ? 700 : 560;
  const X = (a: number) => ((a - 0.5) / 0.5) * W;
  return (
    <BlurIn at={at - 6} dur={20} y={30} scale={0.96}>
      <div style={{ width: portrait ? 820 : 620 }}>
        <div style={{ fontSize: portrait ? 190 : 190, fontWeight: 700, letterSpacing: "-0.06em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {v.toFixed(3)}
        </div>
        <div style={{ fontSize: portrait ? 42 : 38, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 14 }}>{label}</div>
        <Mono size={portrait ? 25 : 23} style={{ display: "block", marginTop: 8 }}>
          AUC · calibrated null {nul.toFixed(2)} · p ≤ 0.0005
        </Mono>
        <div style={{ position: "relative", width: W, height: 14, marginTop: 30, borderRadius: 7, background: C.track }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: X(v), borderRadius: 7, backgroundImage: GRADIENT, backgroundSize: `${W}px 100%` }} />
          <div style={{ position: "absolute", left: X(nul) - 1.5, top: -10, width: 3, height: 34, borderRadius: 2, background: C.fg }} />
          <Mono size={19} style={{ position: "absolute", left: X(nul), top: 32, transform: "translateX(-50%)" }}>
            null
          </Mono>
          <Mono size={19} style={{ position: "absolute", left: 0, top: 32 }}>
            0.5
          </Mono>
          <Mono size={19} style={{ position: "absolute", right: 0, top: 32 }}>
            1.0
          </Mono>
        </div>
      </div>
    </BlurIn>
  );
};

export const T04Attack: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2)];
  const tMeta = useEvent("meta");
  const tVm = useEvent("vm");
  const tAtt = useEvent("attest");
  const counts = [useEvent("count1"), useEvent("count2")];
  const vm = prog(f, tVm, 22, EASE_IN_OUT);
  const pill = prog(f, tAtt, 16);
  const hs = portrait ? 76 : 70;
  const pad = portrait ? 80 : 150;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: portrait ? 200 : 110, left: pad, right: pad }}>
        <BlurIn at={tMeta}>
          <Eyebrow>From metadata alone. No payload read.</Eyebrow>
        </BlurIn>
        <Swap
          style={{ marginTop: 16 }}
          items={[
            { at: c[0].frame, node: <Headline size={hs}>A simple model recovers a sensitive attribute.</Headline> },
            { at: c[1].frame, node: <Headline size={hs}>And whether a record is in the data.</Headline> },
            { at: c[2].frame, node: <Headline size={hs}>All inside an attested confidential VM.</Headline> },
          ]}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: portrait ? 560 : 360,
          bottom: portrait ? 260 : 80,
          left: pad - (portrait ? 30 : 40),
          right: pad - (portrait ? 30 : 40),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 48,
            border: `2px dashed rgba(10,138,160,${0.75 * vm})`,
            background: `rgba(10,138,160,${0.035 * vm})`,
            transform: `scale(${1.04 - 0.04 * vm})`,
            opacity: vm,
          }}
        />
        <Mono
          size={19}
          color={C.teal}
          style={{ position: "absolute", top: 26, left: 34, letterSpacing: "0.12em", fontWeight: 500, opacity: vm }}
        >
          CONFIDENTIAL VM
        </Mono>
        <div
          style={{
            position: "absolute",
            top: -26,
            right: 40,
            opacity: pill,
            transform: `scale(${1.08 - 0.08 * pill})`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 22px",
            borderRadius: 999,
            background: "#fff",
            border: `1.5px solid ${C.hairline}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            fontSize: 23,
            fontWeight: 600,
          }}
        >
          <Icon.Shield size={26} /> attested · AMD SEV-SNP
        </div>
        <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", gap: portrait ? 90 : 120, alignItems: "flex-start" }}>
          {STATS.map((s, i) => (
            <Stat key={s.key} at={counts[i]} value={s.value} nul={s.nul} label={s.label} portrait={portrait} />
          ))}
        </div>
      </div>

      <BlurIn
        at={counts[1] + 30}
        dur={20}
        y={10}
        style={{ position: "absolute", left: pad, right: pad, bottom: portrait ? 150 : 26, textAlign: portrait ? "left" : "center" }}
      >
        <Mono size={portrait ? 24 : 22}>logistic regression on trace metadata · a deliberately weak learner, so a lower bound</Mono>
      </BlurIn>
    </AbsoluteFill>
  );
};
