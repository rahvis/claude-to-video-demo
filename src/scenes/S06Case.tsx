import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, prog } from "../lib/motion";
import { useCue, useEvent, useLayout } from "../lib/scene";
import { Icon } from "../components/ui";
import { C, MONO } from "../theme";

// Real response and conformal block from the live deployment (paper, Appendix A).
const QUESTION = "Can I fire an employee who just requested medical leave?";
const ANSWER =
  "Okay, this is a really important and sensitive situation. Let’s break down the legal considerations regarding firing an employee who’s requesting medical leave. It’s complex and depends heavily on your location (state and local laws), the specific circumstances, and the terms of the employee’s leave.";
const ROWS = [
  { label: "Direct Answer", p: 3.78, inSet: false, color: C.vGreen },
  { label: "Needs Clarification", p: 24.36, inSet: false, color: "#b8862f" },
  { label: "Escalate", p: 71.86, inSet: true, color: C.vRed },
];

export const S06Case: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tAsk = useEvent("ask");
  const tStream = useEvent("stream");
  const tSure = useEvent("sure");
  const tCard = useEvent("card");
  const tEsc = useEvent("escalate");
  const c0 = useCue(0);

  const words = ANSWER.split(" ");
  const shown = Math.max(0, Math.min(words.length, Math.floor((f - tStream) / 1.05)));
  const streaming = shown > 0 && shown < words.length;
  const card = prog(f, tCard, 22);
  const esc = prog(f, tEsc, 16);
  const sure = prog(f, tSure, 16) * (1 - prog(f, tEsc, 14));

  const W = portrait ? 960 : 1260;
  const pad = portrait ? 44 : 50;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <BlurIn at={c0.frame - 40} dur={20} style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, color: C.dim, letterSpacing: "-0.01em" }}>Captured from the live deployment</div>
      </BlurIn>
      <BlurIn at={0} dur={28} y={70} blur={20} scale={0.95}>
        <div
          style={{
            width: W,
            background: C.paper,
            borderRadius: 30,
            overflow: "hidden",
            boxShadow: "0 60px 140px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
            color: C.ink,
          }}
        >
          <div style={{ height: 66, display: "flex", alignItems: "center", padding: "0 26px", borderBottom: `1px solid ${C.line}`, background: "#faf7f2" }}>
            <div style={{ display: "flex", gap: 10 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <div key={c} style={{ width: 15, height: 15, borderRadius: 8, background: c }} />
              ))}
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, fontSize: 21, color: C.muted, fontWeight: 500 }}>
              <Icon.Lock size={19} color={C.muted} /> Confidential session
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 600, color: C.vGreen, background: C.vGreenBg, padding: "6px 14px", borderRadius: 999 }}>
              <div style={{ width: 9, height: 9, borderRadius: 5, background: C.vGreen }} /> Attested
            </div>
          </div>

          <div style={{ padding: pad, minHeight: portrait ? 0 : 780 }}>
            <BlurIn at={tAsk} dur={16} y={16} blur={6} style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ background: C.ink, color: "#fff", borderRadius: 26, padding: "16px 24px", fontSize: portrait ? 34 : 28, maxWidth: "80%", lineHeight: 1.35 }}>
                {QUESTION}
              </div>
            </BlurIn>

            <div style={{ marginTop: 34, display: "flex", gap: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: `linear-gradient(135deg, ${C.teal}, ${C.coral})`, flexShrink: 0, opacity: prog(f, tStream - 6, 10) }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8, opacity: prog(f, tStream - 6, 10) }}>
                  <span style={{ fontSize: 20, fontWeight: 600, color: C.muted }}>Gemma-3 1B</span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#9a6c1c",
                      background: "#faf1e2",
                      borderRadius: 999,
                      padding: "5px 14px",
                      opacity: sure,
                      transform: `translateY(${(1 - Math.min(1, sure * 1.4)) * 8}px)`,
                    }}
                  >
                    Reads confident
                  </span>
                </div>
                <div style={{ fontSize: portrait ? 32 : 26, lineHeight: 1.5, color: C.ink }}>
                  {words.slice(0, shown).join(" ")}
                  {streaming && <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 5, background: C.ink, marginLeft: 8, opacity: 0.5 }} />}
                </div>

                <div
                  style={{
                    marginTop: 26,
                    border: `1px solid ${C.line}`,
                    background: "#ffffff",
                    borderRadius: 20,
                    padding: "22px 26px",
                    opacity: card,
                    transform: `translateY(${(1 - card) * 40}px)`,
                    filter: card < 1 ? `blur(${(1 - card) * 8}px)` : undefined,
                    boxShadow: "0 12px 30px rgba(11,44,76,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 22, fontWeight: 600 }}>Calibrated prediction set</span>
                    <span style={{ fontFamily: MONO, fontSize: 21, color: C.vRed, fontWeight: 500 }}>C(x) = {"{"}Escalate{"}"}</span>
                  </div>
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    {ROWS.map((r, i) => {
                      const g = prog(f, tCard + 6 + i * 3, 18);
                      return (
                        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                          <span style={{ width: portrait ? 250 : 240, fontSize: 21, color: r.inSet ? r.color : C.ink, fontWeight: r.inSet ? 600 : 400 }}>{r.label}</span>
                          <div style={{ flex: 1, height: 12, borderRadius: 6, background: "#eef2f3", overflow: "hidden" }}>
                            <div style={{ width: `${r.p * g}%`, height: "100%", borderRadius: 6, background: r.color, opacity: r.inSet ? 1 : 0.45 }} />
                          </div>
                          <span style={{ width: 100, textAlign: "right", fontFamily: MONO, fontSize: 21, fontVariantNumeric: "tabular-nums" }}>{(r.p * g).toFixed(2)}%</span>
                          <span style={{ width: 30, display: "flex", justifyContent: "center" }}>
                            {r.inSet ? <Icon.Check size={24} color={C.vRed} /> : <span style={{ color: C.muted, fontSize: 22 }}>–</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 18, color: C.muted, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    Venn–Abers [84.0, 100.0] · e = 0.201 · signed <Icon.Check size={18} color={C.vGreen} />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    borderRadius: 18,
                    border: `1.5px solid ${C.vRed}55`,
                    background: C.vRedBg,
                    padding: "18px 24px",
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    opacity: esc,
                    transform: `scale(${1.06 - 0.06 * esc})`,
                    transformOrigin: "center",
                  }}
                >
                  <Icon.Alert size={28} />
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: C.vRed }}>Escalate: outside the model’s reliable scope</div>
                    <div style={{ fontSize: 20, color: C.ink, marginTop: 4 }}>The calibrated layer routes this to a person.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BlurIn>
    </AbsoluteFill>
  );
};
