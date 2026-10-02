import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Headline, Icon, Mono } from "../../light/components/ui";
import { C, GRADIENT } from "../../light/theme";

// Paper Prop. 2: with the model behind a hosted API, the response size is chosen by the
// provider and crosses before the agent is scheduled again, so no release mechanism
// inside the guest can act on it.
const LANES = [
  { label: "structure", dir: 1 },
  { label: "timing", dir: 1 },
  { label: "request bytes", dir: 1 },
  { label: "response bytes", dir: -1 },
];

export const T09Boundary: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1)];
  const tDia = useEvent("diagram");
  const tOpen = useEvent("open");
  const tProv = useEvent("provider");
  const tNo = useEvent("nobound");
  const open = prog(f, tOpen, 14);
  const prov = prog(f, tProv, 16);
  const no = prog(f, tNo, 14);
  const pad = portrait ? 80 : 150;

  // geometry: agent box, a gap for the lanes, model box
  const L = portrait
    ? { agentW: 920, agentH: 330, gap: 520, modelW: 920, modelH: 250 }
    : { agentW: 560, agentH: 470, gap: 560, modelW: 440, modelH: 470 };
  const flowLen = portrait ? L.gap : L.gap;

  const agent = (
    <div
      style={{
        position: "relative",
        width: L.agentW,
        height: L.agentH,
        borderRadius: 44,
        border: `2px dashed rgba(10,138,160,0.7)`,
        background: "rgba(10,138,160,0.035)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Mono size={18} color={C.teal} style={{ position: "absolute", top: 24, left: 30, letterSpacing: "0.12em", fontWeight: 500 }}>
        CONFIDENTIAL VM
      </Mono>
      <Card style={{ padding: "26px 34px", display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: GRADIENT }} />
        <div>
          <div style={{ fontSize: 36, fontWeight: 650, letterSpacing: "-0.02em" }}>Agent</div>
          <Mono size={20}>composes each request</Mono>
        </div>
      </Card>
      <div
        style={{
          position: "absolute",
          bottom: portrait ? 22 : 30,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: no,
          transform: `scale(${1.1 - 0.1 * no})`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            borderRadius: 999,
            border: `2px solid ${C.coral}`,
            background: "#fdecea",
            color: C.coral,
            fontSize: 23,
            fontWeight: 600,
          }}
        >
          <Icon.X size={22} /> can’t pad what already crossed
        </div>
      </div>
    </div>
  );

  const model = (
    <Card
      style={{
        width: L.modelW,
        height: L.modelH,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        flexShrink: 0,
      }}
    >
      <svg width={64} height={44} viewBox="0 0 64 44" fill="none" stroke={C.fg} strokeWidth={3} strokeLinejoin="round">
        <path d="M18 40h30a12 12 0 000-24 16 16 0 00-30-2A12 12 0 0018 40z" />
      </svg>
      <div style={{ fontSize: 36, fontWeight: 650, letterSpacing: "-0.02em" }}>Hosted model</div>
      <Mono size={20}>outside the boundary</Mono>
      <div style={{ opacity: prov, marginTop: 6 }}>
        <Mono size={21} color={C.coral} style={{ fontWeight: 600 }}>
          picks the response size
        </Mono>
      </div>
    </Card>
  );

  // lanes crossing the trust boundary
  const lanes = (
    <div
      style={{
        position: "relative",
        width: portrait ? L.agentW : L.gap,
        height: portrait ? L.gap : L.agentH,
        display: "flex",
        flexDirection: portrait ? "row" : "column",
        justifyContent: "center",
        gap: portrait ? 0 : 34,
        flexShrink: 0,
      }}
    >
      {/* the boundary itself */}
      <div
        style={{
          position: "absolute",
          ...(portrait ? { left: -20, right: -20, top: "50%", borderTop: `2px dashed ${C.faint}` } : { top: -30, bottom: -30, left: "50%", borderLeft: `2px dashed ${C.faint}` }),
        }}
      />
      <div
        style={{
          position: "absolute",
          ...(portrait ? { left: "50%", top: -(L.agentH + 70), transform: "translateX(-50%)" } : { left: "50%", top: -84, transform: "translateX(-50%)" }),
          display: "flex",
          alignItems: "center",
          gap: 10,
          whiteSpace: "nowrap",
        }}
      >
        <Icon.Eye size={26} />
        <Mono size={20}>host sees all four, never a payload</Mono>
      </div>
      {LANES.map((ln, i) => {
        const draw = prog(f, tDia + 8 + i * 4, 20, EASE_IN_OUT);
        const isResp = ln.dir < 0;
        const color = isResp ? interpolateColors(open, [0, 1], [C.fg, C.coral]) : C.fg;
        const pulse = isResp ? open * (0.5 + 0.5 * Math.sin((f - tOpen) / 5)) : 0;
        const status = isResp ? (
          <span style={{ color: C.coral, fontWeight: 600, opacity: open }}>● open</span>
        ) : (
          <span style={{ color: C.green, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon.Lock size={18} color={C.green} /> constant
          </span>
        );
        if (portrait) {
          return (
            <div key={ln.label} style={{ position: "relative", width: L.agentW / 4, height: "100%", display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  position: "absolute",
                  top: isResp ? undefined : 0,
                  bottom: isResp ? 0 : undefined,
                  width: isResp ? 6 : 4,
                  height: `${draw * 100}%`,
                  borderRadius: 3,
                  background: color,
                  boxShadow: pulse ? `0 0 ${18 * pulse}px ${C.coral}` : undefined,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  [isResp ? "top" : "bottom"]: -2,
                  width: 0,
                  height: 0,
                  borderLeft: "12px solid transparent",
                  borderRight: "12px solid transparent",
                  [isResp ? "borderBottom" : "borderTop"]: `18px solid ${color}`,
                  opacity: draw > 0.95 ? 1 : 0,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  ...(isResp ? { bottom: "12%", right: "50%", marginRight: 18, textAlign: "right" as const } : { top: "12%", left: "50%", marginLeft: 18 }),
                  width: 200,
                  opacity: draw,
                }}
              >
                <Mono size={21} color={C.fg} style={{ whiteSpace: "nowrap" }}>
                  {ln.label}
                </Mono>
                <div style={{ fontSize: 19, marginTop: 4 }}>{status}</div>
              </div>
            </div>
          );
        }
        return (
          <div key={ln.label} style={{ position: "relative", height: 76 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", opacity: draw, padding: "0 6px" }}>
              <Mono size={22} color={C.fg}>
                {ln.label}
              </Mono>
              <span style={{ fontSize: 20 }}>{status}</span>
            </div>
            <div
              style={{
                position: "absolute",
                top: 44,
                left: isResp ? undefined : 0,
                right: isResp ? 0 : undefined,
                height: isResp ? 6 : 4,
                width: `${draw * (flowLen - 24)}px`,
                borderRadius: 3,
                background: color,
                boxShadow: pulse ? `0 0 ${18 * pulse}px ${C.coral}` : undefined,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 44 + (isResp ? 3 : 2) - 12,
                [isResp ? "left" : "right"]: -2,
                width: 0,
                height: 0,
                borderTop: "12px solid transparent",
                borderBottom: "12px solid transparent",
                [isResp ? "borderRight" : "borderLeft"]: `20px solid ${color}`,
                opacity: draw > 0.95 ? 1 : 0,
              }}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: portrait ? 200 : 100, left: pad, right: pad }}>
        <Swap
          items={[
            {
              at: c[0].frame,
              node: (
                <Headline size={portrait ? 80 : 72}>
                  The fourth: <span style={{ color: C.coral }}>the response.</span>
                </Headline>
              ),
            },
            { at: c[1].frame, node: <Headline size={portrait ? 80 : 72}>No defense inside the agent can bound it.</Headline> },
          ]}
        />
        <BlurIn at={tProv} dur={18} y={10}>
          <Mono size={portrait ? 25 : 23} style={{ display: "block", marginTop: 16 }}>
            its size is chosen by the model provider, and it crosses before the agent runs again
          </Mono>
        </BlurIn>
      </div>
      <BlurIn
        at={tDia}
        dur={24}
        y={40}
        scale={0.97}
        style={{
          position: "absolute",
          top: portrait ? 680 : 400,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center" }}>
          {agent}
          {lanes}
          {model}
        </div>
      </BlurIn>
    </AbsoluteFill>
  );
};
