import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Card } from "../components/ui";
import { C, GRADIENT } from "../theme";

const DISCLAIMER = "AI can make mistakes.";

const AnswerCard: React.FC<{ at: number; q: string; a: string; tag: string; tagColor: string; hi: number; width: number }> = ({
  at,
  q,
  a,
  tag,
  tagColor,
  hi,
  width,
}) => (
  <BlurIn at={at} dur={24} y={44} blur={18} scale={0.96}>
    <Card style={{ width, padding: "34px 40px 28px", position: "relative" }}>
      <BlurIn at={at + 18} dur={16} y={8} style={{ position: "absolute", top: 40, left: 40 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: tagColor,
            border: `1.5px solid ${tagColor}66`,
            background: `${tagColor}14`,
            padding: "6px 14px",
            borderRadius: 999,
          }}
        >
          {tag}
        </div>
      </BlurIn>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ background: "#e8e8ed", borderRadius: 24, padding: "14px 22px", fontSize: 27, color: C.fg, maxWidth: "70%" }}>{q}</div>
      </div>
      <div style={{ marginTop: 26, display: "flex", gap: 18, alignItems: "flex-start" }}>
        <div style={{ width: 38, height: 38, borderRadius: 19, background: GRADIENT, flexShrink: 0, marginTop: 4 }} />
        <div style={{ fontSize: 33, lineHeight: 1.28, fontWeight: 500, color: C.fg, letterSpacing: "-0.015em" }}>{a}</div>
      </div>
      <div style={{ marginTop: 30, paddingTop: 18, borderTop: `1px solid ${C.hairline}` }}>
        <span
          style={{
            fontSize: 25,
            color: interpolateColors(hi, [0, 1], [C.dim, C.fg]),
            padding: "5px 12px",
            marginLeft: -12,
            borderRadius: 10,
            background: `rgba(196,118,0,${0.1 * hi})`,
            boxShadow: `0 0 0 ${2 * hi}px rgba(196,118,0,${0.65 * hi}), 0 0 ${26 * hi}px rgba(196,118,0,${0.18 * hi})`,
          }}
        >
          {DISCLAIMER}
        </span>
      </div>
    </Card>
  </BlurIn>
);

export const S01Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const tType = useEvent("type");
  const tCard1 = useEvent("card1");
  const tCard2 = useEvent("card2");
  const tSame = useEvent("same");

  const typed = Math.max(0, Math.min(DISCLAIMER.length, Math.floor((f - tType) / 1.4)));
  const typing = f >= tType && typed < DISCLAIMER.length;
  const caret = typing || Math.floor(f / 15) % 2 === 0;
  const away = prog(f, tCard1 - 6, 14, EASE_IN_OUT);
  const hi = prog(f, tSame, 14);
  const w = portrait ? 880 : 730;
  const pair = prog(f, tCard2 - 4, 22, EASE_IN_OUT);
  const shift = (1 - pair) * (portrait ? 175 : (w + 50) / 2);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - away,
          transform: `translateY(${away * 60}px) scale(${1 - away * 0.12})`,
          filter: away > 0 ? `blur(${away * 10}px)` : undefined,
        }}
      >
        <div style={{ fontSize: portrait ? 54 : 50, color: C.dim, letterSpacing: "-0.015em" }}>
          {DISCLAIMER.slice(0, typed)}
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: "1.05em",
              marginLeft: 5,
              verticalAlign: "-0.17em",
              background: C.fg,
              opacity: caret && f >= 2 ? 0.85 : 0,
            }}
          />
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: portrait ? "column" : "row",
          gap: portrait ? 44 : 50,
          paddingBottom: portrait ? 120 : 90,
        }}
      >
        <div style={{ transform: portrait ? `translateY(${shift}px)` : `translateX(${shift}px)` }}>
          <AnswerCard at={tCard1} q="What does EIN stand for?" a="Employer Identification Number." tag="Correct" tagColor={C.green} hi={hi} width={w} />
        </div>
        <AnswerCard
          at={tCard2}
          q="Source for that statistic?"
          a="Morgan et al., Journal of Applied Metrics, 2019."
          tag="Fabricated"
          tagColor={C.coral}
          hi={hi}
          width={w}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: portrait ? 330 : 110 }}>
        <BlurIn at={tSame + 6} dur={20}>
          <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em" }}>Same words. Every answer.</div>
        </BlurIn>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
