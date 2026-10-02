import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { BlurIn, EASE, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Eyebrow, Headline, Icon, Mono } from "../components/ui";
import { C, MONO } from "../theme";

const HEX = "0123456789abcdef";
const PLAIN = [
  "employee=J.Rivera  dept=ops ",
  "salary=84,000  status=leave ",
  "note: requested FMLA 04/12  ",
  "prompt: Can I fire an employ",
  "case_id=7731  owner=HR-team ",
  "ssn=***-**-4417  dob=1988-0 ",
];

const Memory: React.FC<{ rows: string[]; enc: number; seed: string }> = ({ rows, enc, seed }) => {
  const f = useCurrentFrame();
  const tick = Math.floor(f / 3);
  return (
    <div style={{ fontFamily: MONO, fontSize: 17, lineHeight: 1.55, letterSpacing: "0.02em" }}>
      {rows.map((row, r) => (
        <div key={r} style={{ whiteSpace: "pre" }}>
          {row.split("").map((ch, i) => {
            const wave = enc * (row.length + 14) - (i + r * 2);
            if (wave <= 0) return <span key={i} style={{ color: "rgba(29,29,31,0.5)" }}>{ch}</span>;
            const h = HEX[Math.floor(random(`${seed}${r}-${i}-${tick}`) * 16)];
            return <span key={i} style={{ color: wave < 3 ? C.fg : `rgba(10,138,160,0.8)` }}>{h}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

const Chip: React.FC<{ size: number; glow: number }> = ({ size, glow }) => {
  const pins = 7;
  const pin = (side: "t" | "b" | "l" | "r", i: number) => {
    const step = size / (pins + 1);
    const along = step * (i + 1) - 5;
    const base: React.CSSProperties = { position: "absolute", background: "linear-gradient(180deg,#d2d2d7,#8e8e93)", borderRadius: 3 };
    if (side === "t") return { ...base, left: along, top: -22, width: 10, height: 18 };
    if (side === "b") return { ...base, left: along, bottom: -22, width: 10, height: 18 };
    if (side === "l") return { ...base, top: along, left: -22, width: 18, height: 10 };
    return { ...base, top: along, right: -22, width: 18, height: 10 };
  };
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {(["t", "b", "l", "r"] as const).flatMap((s) => Array.from({ length: pins }, (_, i) => <div key={s + i} style={pin(s, i)} />))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 34,
          background: "linear-gradient(145deg,#2d2d31 0%,#111113 70%)",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow: `0 30px 60px rgba(0,0,0,0.22), 0 0 ${50 + 50 * glow}px rgba(10,138,160,${0.1 + 0.25 * glow}), inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: size * 0.17,
          borderRadius: 20,
          background: "radial-gradient(circle at 30% 25%, #1d3d47 0%, #0a1316 75%)",
          border: `1px solid rgba(43,179,201,${0.3 + 0.4 * glow})`,
          color: "#f5f5f7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Icon.Lock size={30} color={glow > 0.5 ? "#2bb3c9" : "#8e8e93"} />
        <div style={{ fontSize: 19, letterSpacing: "0.24em", color: "#8e8e93", fontWeight: 600, marginTop: 6 }}>AMD</div>
        <div style={{ fontSize: 33, fontWeight: 700, letterSpacing: "-0.02em" }}>SEV-SNP</div>
      </div>
    </div>
  );
};

const Enclave: React.FC<{ size: number }> = ({ size }) => {
  const f = useCurrentFrame();
  const tChip = useEvent("chip");
  const tEnc = useEvent("encrypt");
  const tBlock = useEvent("block");
  const enc = prog(f, tEnc, 30, EASE_IN_OUT);
  const block = prog(f, tBlock, 12, EASE);
  const op = prog(f, tEnc - 10, 16);
  return (
    <div style={{ position: "relative", width: size, height: size + 130 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: op }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            borderRadius: 999,
            border: `1px solid ${C.hairline}`,
            background: C.card2,
            fontSize: 22,
            color: C.dim,
          }}
        >
          <Icon.Eye size={24} /> Cloud operator · hypervisor
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: size / 2 - 1,
          top: 58,
          height: (72 - 14) * op,
          borderLeft: `2px dashed ${C.faint}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: size / 2 - 22,
          top: 108,
          width: 44,
          height: 44,
          borderRadius: 22,
          background: "#fdecea",
          border: `2px solid ${C.coral}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: block,
          transform: `scale(${0.5 + 0.5 * block})`,
          zIndex: 2,
        }}
      >
        <Icon.X size={24} />
      </div>
      <BlurIn at={tChip} dur={24} y={50} blur={16} scale={0.96} style={{ position: "absolute", top: 130, left: 0 }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 44,
            border: `2px dashed rgba(10,138,160,${0.35 + 0.45 * enc})`,
            background: `rgba(10,138,160,${0.025 + 0.035 * enc})`,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mono size={17} color={C.teal} style={{ position: "absolute", top: 22, left: 28, letterSpacing: "0.12em", fontWeight: 500 }}>
            CONFIDENTIAL VM
          </Mono>
          <div style={{ position: "absolute", top: 58, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <Memory rows={PLAIN.slice(0, 3)} enc={enc} seed="a" />
          </div>
          <div style={{ position: "absolute", bottom: 26, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <Memory rows={PLAIN.slice(3)} enc={enc} seed="b" />
          </div>
          <Chip size={size * 0.42} glow={enc} />
        </div>
      </BlurIn>
    </div>
  );
};

const TokenCard: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 16);
  const rows: [string, string][] = [
    ["x-ms-attestation-type", "sevsnpvm"],
    ["launch measurement", "11920f61def8…559591c4"],
    ["secure boot · debuggable", "true · false"],
  ];
  return (
    <div style={{ opacity: p, transform: `scale(${1.08 - 0.08 * p})`, transformOrigin: "left center", filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined }}>
      <Card style={{ padding: "24px 30px", borderRadius: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Icon.Shield size={30} />
          <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-0.02em" }}>Attestation token</div>
          <Mono size={18} style={{ marginLeft: "auto" }}>Microsoft Azure Attestation</Mono>
        </div>
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 28, rowGap: 8 }}>
          {rows.map(([k, v], i) => (
            <React.Fragment key={k}>
              <BlurIn at={at + 8 + i * 4} dur={14} y={8} blur={6}>
                <Mono size={20}>{k}</Mono>
              </BlurIn>
              <BlurIn at={at + 8 + i * 4} dur={14} y={8} blur={6}>
                <Mono size={20} color={C.fg}>
                  {v}
                </Mono>
              </BlurIn>
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
};

export const S04Confidential: React.FC = () => {
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2)];
  const tChip = useEvent("chip");
  const tTok = useEvent("token");
  const hs = portrait ? 80 : 76;

  const text = (
    <div style={{ width: portrait ? 920 : 780 }}>
      <BlurIn at={tChip + 4}>
        <Eyebrow>Confidential computing</Eyebrow>
      </BlurIn>
      <Swap
        style={{ marginTop: 18 }}
        items={[
          { at: c[0].frame, node: <Headline size={hs}>Runs inside a hardware enclave.</Headline> },
          { at: c[1].frame, node: <Headline size={hs}>Encrypted. Even from the cloud operator.</Headline> },
          { at: c[2].frame, node: <Headline size={hs}>Proves what software is running.</Headline> },
        ]}
      />
      <BlurIn at={tChip + 14}>
        <div style={{ marginTop: 24, fontSize: 25, color: C.dim, letterSpacing: "-0.01em" }}>Gemma-3 1B · vLLM · AMD SEV-SNP · Azure confidential VM</div>
      </BlurIn>
      <div style={{ marginTop: 34, height: 250 }}>
        <TokenCard at={tTok} />
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: portrait ? "column" : "row",
        gap: portrait ? 70 : 130,
      }}
    >
      <Enclave size={portrait ? 600 : 560} />
      {text}
    </AbsoluteFill>
  );
};
