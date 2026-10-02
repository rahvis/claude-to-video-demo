import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Headline, Icon, Mono } from "../components/ui";
import { C, GRADIENT, MONO } from "../theme";

// Field names from the signed response payload (paper, Fig. 2); values from the
// medical-leave response in Appendix A.
const FIELDS: { k: string; v: string; kind: "s" | "n" | "a" }[] = [
  { k: "content", v: "\"Okay, this is a really important…\"", kind: "s" },
  { k: "prediction_set", v: "[\"Escalate\"]", kind: "a" },
  { k: "venn_abers", v: "[0.840, 1.000]", kind: "n" },
  { k: "e_value", v: "0.201", kind: "n" },
  { k: "calibration_fingerprint", v: "\"2399d3ac624333ff…\"", kind: "s" },
  { k: "maa_jwt", v: "\"eyJhbGciOiJSUzI1NiIs…\"", kind: "s" },
  { k: "signature", v: "\"580c856412cfc8c5…\"", kind: "s" },
];

const CHECKS = [
  { ev: "check1", title: "Signature verified in your browser", detail: "ECDSA P-256 · WebCrypto · over text + C(x) + fp" },
  { ev: "check2", title: "Nonce matches the commitment", detail: "H(pk ‖ fp ‖ α ‖ template) = attestation nonce" },
  { ev: "check3", title: "Fingerprint recomputed from the published set", detail: "reproducible by any third party" },
];

export const S08Verify: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2)];
  const tPay = useEvent("payload");
  const checkAt = [useEvent("check1"), useEvent("check2"), useEvent("check3")];
  const sig = prog(f, c[0].frame + 24, 16);
  const fs = portrait ? 26 : 25;

  const payload = (
    <Card style={{ padding: "30px 36px", width: portrait ? 920 : 820 }}>
      <Mono size={20} color={C.dim}>
        response payload
      </Mono>
      <div style={{ marginTop: 16, fontFamily: MONO, fontSize: fs, lineHeight: 1.62 }}>
        <div style={{ color: C.dim }}>{"{"}</div>
        {FIELDS.map((fl, i) => {
          const isSig = fl.k === "signature";
          return (
            <BlurIn key={fl.k} at={tPay + 4 + i * 3} dur={14} y={10} blur={6}>
              <div
                style={{
                  paddingLeft: 26,
                  marginLeft: -10,
                  marginRight: -10,
                  borderRadius: 10,
                  whiteSpace: "nowrap",
                  boxShadow: isSig ? `0 0 0 ${2 * sig}px rgba(94,92,230,${0.75 * sig})` : undefined,
                  background: isSig ? `rgba(94,92,230,${0.07 * sig})` : undefined,
                }}
              >
                <span style={{ color: C.teal }}>"{fl.k}"</span>
                <span style={{ color: C.dim }}>: </span>
                <span style={{ color: fl.kind === "n" ? C.amber : C.fg }}>{fl.v}</span>
                <span style={{ color: C.dim }}>{i < FIELDS.length - 1 ? "," : ""}</span>
              </div>
            </BlurIn>
          );
        })}
        <div style={{ color: C.dim }}>{"}"}</div>
      </div>
    </Card>
  );

  const checks = (
    <div style={{ display: "flex", flexDirection: "column", gap: 34, width: portrait ? 920 : 700 }}>
      {CHECKS.map((ck, i) => {
        const p = prog(f, checkAt[i], 14);
        return (
          <BlurIn key={ck.ev} at={checkAt[i] - 2} dur={16} y={18}>
            <div style={{ display: "flex", gap: 22, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  flexShrink: 0,
                  background: `rgba(26,158,90,${0.08 + 0.08 * p})`,
                  border: `2px solid ${C.green}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${0.6 + 0.4 * p})`,
                }}
              >
                <Icon.Check size={28} />
              </div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{ck.title}</div>
                <Mono size={21} style={{ display: "block", marginTop: 8 }}>
                  {ck.detail}
                </Mono>
              </div>
            </div>
          </BlurIn>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill style={{ padding: portrait ? "200px 80px 0" : "100px 150px 0" }}>
      <Swap
        items={[
          { at: c[0].frame, node: <Headline size={portrait ? 80 : 72}>Every response, signed.</Headline> },
          { at: c[1].frame, node: <Headline size={portrait ? 80 : 72}>Checked in your browser.</Headline> },
          { at: c[2].frame, node: <Headline size={portrait ? 80 : 72}>Checkable by anyone.</Headline> },
        ]}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          alignItems: portrait ? "flex-start" : "center",
          gap: portrait ? 70 : 80,
          paddingTop: portrait ? 90 : 0,
          paddingBottom: portrait ? 0 : 90,
        }}
      >
        <BlurIn at={tPay} dur={22} y={40} scale={0.97}>
          {payload}
        </BlurIn>
        {checks}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: GRADIENT, opacity: 0 }} />
    </AbsoluteFill>
  );
};
