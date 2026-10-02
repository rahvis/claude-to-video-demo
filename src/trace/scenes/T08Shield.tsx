import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Headline, Icon, Mono } from "../../light/components/ui";
import { C, GRADIENT, gradientText } from "../../light/theme";
import { REQ, RESP } from "../components/Trace";

// Paper §4: structure canonicalization, a public per-step deadline and padding to a public
// ceiling make the agent-composed coordinates constant: (0, 0) under both relations (Prop. 1).
const ROWS = [
  { key: "structure", title: "Structure", before: "step sequence and length", after: "fixed public plan", lock: "lock1" },
  { key: "timing", title: "Timing", before: "per-step wall clock", after: "public deadline", lock: "lock2" },
  { key: "request", title: "Request bytes", before: "what the agent sends", after: "padded to a public ceiling", lock: "lock3" },
  { key: "response", title: "Response bytes", before: "what the provider returns", after: "", lock: null },
] as const;

const GLYPH: Record<string, React.ReactNode> = {
  structure: (
    <svg width={34} height={34} viewBox="0 0 36 36">
      <line x1="6" y1="18" x2="30" y2="18" stroke={C.fg} strokeWidth="3" />
      {[6, 18, 30].map((x) => (
        <circle key={x} cx={x} cy="18" r="5" fill={C.fg} />
      ))}
    </svg>
  ),
  timing: (
    <svg width={34} height={34} viewBox="0 0 36 36" fill="none" stroke={C.fg} strokeWidth="3" strokeLinecap="round">
      <circle cx="18" cy="18" r="13" />
      <path d="M18 10v8l6 4" />
    </svg>
  ),
  request: <div style={{ width: 16, height: 26, borderRadius: 5, background: REQ }} />,
  response: <div style={{ width: 16, height: 26, borderRadius: 5, background: RESP }} />,
};

const Pill: React.FC<{ closed: number }> = ({ closed }) => (
  <div style={{ position: "relative", width: 170, height: 56 }}>
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        height: 56,
        padding: "0 24px",
        borderRadius: 28,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 25,
        fontWeight: 650,
        background: "#fff4e0",
        color: C.amber,
        opacity: 1 - closed,
        transform: `scale(${1 - 0.2 * closed})`,
      }}
    >
      <div style={{ width: 11, height: 11, borderRadius: 6, background: C.amber }} />
      Open
    </div>
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        height: 56,
        padding: "0 24px",
        borderRadius: 28,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 25,
        fontWeight: 650,
        background: "#e6f5ec",
        color: C.green,
        opacity: closed,
        transform: `scale(${0.7 + 0.3 * closed + 0.08 * Math.sin(Math.PI * closed)})`,
      }}
    >
      <Icon.Lock size={22} color={C.green} />
      Closed
    </div>
  </div>
);

export const T08Shield: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [0, 1, 2, 3, 4].map((i) => useCue(i));
  const tShield = useEvent("shield");
  const tCard = useEvent("card");
  const tZero = useEvent("zero");
  const locks = { lock1: useEvent("lock1"), lock2: useEvent("lock2"), lock3: useEvent("lock3") };
  const hs = portrait ? 80 : 72;
  const pad = portrait ? 80 : 150;
  const cardW = portrait ? 920 : 1000;
  const rowH = portrait ? 144 : 118;
  const bracket = prog(f, tZero - 4, 20, EASE_IN_OUT);

  const shieldIcon = (
    <svg width={44} height={52} viewBox="0 0 220 260">
      <defs>
        <linearGradient id="t08-sh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.teal} />
          <stop offset="0.55" stopColor={C.periwinkle} />
          <stop offset="1" stopColor={C.coral} />
        </linearGradient>
      </defs>
      <path d="M110 8 L200 42 V124 C200 186 160 228 110 252 C60 228 20 186 20 124 V42 Z" fill="url(#t08-sh)" />
      {[64, 100, 136].map((x) => (
        <rect key={x} x={x} y={105} width={20} height={64} rx={10} fill="#fff" />
      ))}
    </svg>
  );

  const card = (
    <BlurIn at={tCard} dur={24} y={40} scale={0.97}>
      <div
        style={{
          width: cardW,
          borderRadius: 34,
          background: "#fff",
          border: `1.5px solid ${C.hairline}`,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 24px 60px rgba(0,0,0,0.07)",
          overflow: "hidden",
        }}
      >
        {ROWS.map((r, i) => {
          const k = r.lock ? prog(f, locks[r.lock], 12) : 0;
          const flash = r.lock ? Math.sin(Math.PI * prog(f, locks[r.lock], 26)) : 0;
          const ra = prog(f, tCard + 6 + i * 3, 16);
          return (
            <div
              key={r.key}
              style={{
                position: "relative",
                height: rowH,
                display: "flex",
                alignItems: "center",
                padding: "0 36px",
                borderTop: i ? `1.5px solid ${C.hairline}` : undefined,
                background: `rgba(26,158,90,${0.1 * flash})`,
                opacity: ra,
                transform: `translateY(${(1 - ra) * 14}px)`,
              }}
            >
              <div style={{ width: 66, height: 66, borderRadius: 33, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {GLYPH[r.key]}
              </div>
              <div style={{ marginLeft: 26, flex: 1 }}>
                <div style={{ fontSize: portrait ? 36 : 35, fontWeight: 650, letterSpacing: "-0.02em" }}>{r.title}</div>
                <div style={{ position: "relative", height: 32, marginTop: 4 }}>
                  <Mono size={portrait ? 23 : 22} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - k, transform: `translateY(${-12 * k}px)`, whiteSpace: "nowrap" }}>
                    {r.before}
                  </Mono>
                  {r.after && (
                    <Mono size={portrait ? 23 : 22} color={C.green} style={{ position: "absolute", left: 0, top: 0, opacity: k, transform: `translateY(${12 * (1 - k)}px)`, whiteSpace: "nowrap" }}>
                      {r.after}
                    </Mono>
                  )}
                </div>
              </div>
              <Pill closed={k} />
            </div>
          );
        })}
      </div>
    </BlurIn>
  );

  const zero = (
    <div style={{ opacity: prog(f, tZero + 4, 16), transform: `translateX(${(1 - prog(f, tZero + 4, 20)) * -20}px)` }}>
      <div style={{ fontSize: portrait ? 96 : 96, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, ...gradientText() }}>(0, 0)</div>
      <Mono size={portrait ? 24 : 22} style={{ display: "block", marginTop: 10, lineHeight: 1.5 }}>
        under both relations,{portrait ? " " : <br />}for groups of any size
      </Mono>
    </div>
  );

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: portrait ? 200 : 100, left: pad, right: pad }}>
        <BlurIn at={tShield} dur={20}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {shieldIcon}
            <div style={{ fontSize: 34, fontWeight: 650, letterSpacing: "-0.02em", ...gradientText() }}>TraceShield</div>
          </div>
        </BlurIn>
        <Swap
          style={{ marginTop: 18 }}
          items={[
            { at: c[0].frame, node: <Headline size={hs}>It reshapes the agent, not the log.</Headline> },
            { at: c[1].frame, node: <Headline size={hs}>A fixed plan.</Headline> },
            { at: c[2].frame, node: <Headline size={hs}>A public deadline.</Headline> },
            { at: c[3].frame, node: <Headline size={hs}>Padded requests.</Headline> },
            { at: c[4].frame, node: <Headline size={hs}>Three channels. Provably zero.</Headline> },
          ]}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: portrait ? 640 : 330,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          alignItems: portrait ? "center" : "flex-start",
          justifyContent: "center",
          gap: portrait ? 60 : 34,
        }}
      >
        {card}
        {portrait ? (
          <div style={{ width: cardW, display: "flex", alignItems: "center", gap: 30 }}>
            <div style={{ width: 6, height: 150, borderRadius: 3, background: GRADIENT, transform: `scaleY(${bracket})` }} />
            {zero}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 30, height: rowH * 3, marginTop: 0 }}>
            <svg width={30} height={rowH * 3} style={{ overflow: "visible" }}>
              <path
                d={`M2 14 H24 V${rowH * 3 - 14} H2`}
                fill="none"
                stroke={C.fg}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={rowH * 3 + 40}
                strokeDashoffset={interpolate(bracket, [0, 1], [rowH * 3 + 40, 0])}
              />
            </svg>
            <div style={{ width: 300 }}>{zero}</div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
