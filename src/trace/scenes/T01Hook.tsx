import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog, Words } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Headline, Icon, Mono } from "../../light/components/ui";
import { C, MONO } from "../../light/theme";

const HEX = "0123456789abcdef";

// A synthetic record of the kind the paper's clinical crew reads (referral, notes, prior therapy, payer policy).
const ROWS: [string, string][] = [
  ["referral", "oncology · priority review"],
  ["clinical note", "HER2-positive · ECOG 1"],
  ["prior therapy", "trastuzumab · 2 cycles"],
  ["coverage", "prior authorization required"],
];

const PROTECT = [
  { ev: "enc", title: "Encrypted", detail: "content confidentiality" },
  { ev: "obl", title: "Oblivious", detail: "access patterns hidden" },
  { ev: "dp", title: "Differentially private", detail: "outputs privatized" },
];

const Value: React.FC<{ text: string; enc: number; seed: string }> = ({ text, enc, seed }) => {
  const f = useCurrentFrame();
  const tick = Math.floor(f / 3);
  return (
    <span style={{ whiteSpace: "pre" }}>
      {text.split("").map((ch, i) => {
        const wave = enc * (text.length + 10) - i;
        if (wave <= 0 || ch === " ") return <span key={i}>{ch}</span>;
        return (
          <span key={i} style={{ fontFamily: MONO, color: wave < 3 ? C.fg : `${C.teal}cc` }}>
            {HEX[Math.floor(random(`${seed}-${i}-${tick}`) * 16)]}
          </span>
        );
      })}
    </span>
  );
};

export const T01Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c0 = useCue(0);
  const tRec = useEvent("record");
  const tEnc = useEvent("enc");
  const at = [tEnc, useEvent("obl"), useEvent("dp")];
  const enc = prog(f, tEnc, 26, EASE_IN_OUT);
  const lock = prog(f, tEnc + 4, 14);
  const w = portrait ? 920 : 840;

  const record = (
    <BlurIn at={tRec} dur={24} y={40} blur={16} scale={0.96}>
      <Card style={{ width: w, padding: "34px 40px 30px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", width: 26, height: 26 }}>
            <div style={{ position: "absolute", inset: 0, opacity: 1 - lock }}>
              <Icon.Eye size={26} color={C.dim} />
            </div>
            <div style={{ position: "absolute", inset: 0, opacity: lock }}>
              <Icon.Lock size={26} color={C.teal} />
            </div>
          </div>
          <Mono size={21} color={lock > 0.5 ? C.teal : C.dim} style={{ letterSpacing: "0.12em", fontWeight: 500 }}>
            PRIVATE CORPUS
          </Mono>
        </div>
        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 30, rowGap: portrait ? 22 : 18, alignItems: "baseline" }}>
          {ROWS.map(([k, v], i) => (
            <React.Fragment key={k}>
              <BlurIn at={tRec + 8 + i * 3} dur={14} y={8} blur={6}>
                <Mono size={portrait ? 27 : 24}>{k}</Mono>
              </BlurIn>
              <BlurIn at={tRec + 8 + i * 3} dur={14} y={8} blur={6}>
                <div style={{ fontSize: portrait ? 37 : 33, fontWeight: 500, letterSpacing: "-0.015em", color: C.fg }}>
                  <Value text={v} enc={enc} seed={`r${i}`} />
                </div>
              </BlurIn>
            </React.Fragment>
          ))}
        </div>
      </Card>
    </BlurIn>
  );

  const shields = (
    <div style={{ display: "flex", flexDirection: "column", gap: portrait ? 44 : 40, width: portrait ? 920 : 580 }}>
      {PROTECT.map((p, i) => {
        const k = prog(f, at[i], 14);
        return (
          <BlurIn key={p.ev} at={at[i] - 2} dur={16} y={18}>
            <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  flexShrink: 0,
                  background: `rgba(26,158,90,${0.08 + 0.08 * k})`,
                  border: `2px solid ${C.green}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${0.6 + 0.4 * k})`,
                }}
              >
                <Icon.Check size={32} />
              </div>
              <div>
                <div style={{ fontSize: portrait ? 54 : 46, fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{p.title}</div>
                <Mono size={portrait ? 26 : 23} style={{ display: "block", marginTop: 6 }}>
                  {p.detail}
                </Mono>
              </div>
            </div>
          </BlurIn>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: portrait ? "0 80px" : "0 150px" }}>
      <div style={{ textAlign: "center", width: portrait ? 920 : 1620 }}>
        <Headline size={portrait ? 80 : 76}>
          <Words text={c0.text} at={c0.frame} frames={c0.words.map((w) => w.frame)} />
        </Headline>
      </div>
      <div
        style={{
          marginTop: portrait ? 130 : 96,
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          alignItems: portrait ? "flex-start" : "center",
          gap: portrait ? 90 : 110,
        }}
      >
        {record}
        {shields}
      </div>
    </AbsoluteFill>
  );
};
