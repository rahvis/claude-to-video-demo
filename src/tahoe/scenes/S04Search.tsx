import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, Counter, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Eyebrow, Glow, Headline, Icon, Mono } from "../components/ui";
import { C } from "../theme";

const QUERY = "Senior product designers in Austin with fintech experience";
const FILTERS = ["Location", "Experience", "Skills", "Boolean"];

export const S04Search: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2)];
  const tBar = useEvent("bar");
  const tType = useEvent("type");
  const tFilters = useEvent("filtersOut");
  const tCount = useEvent("count");

  const barIn = prog(f, tBar, 26, EASE_IN_OUT);
  const chars = Math.max(0, Math.floor((f - tType) / 1.8));
  const typed = QUERY.slice(0, chars);
  const cursorOn = f % 20 < 10 && chars < QUERY.length;
  const filtersOut = prog(f, tFilters, 20);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tCount} opacity={0.24} size={portrait ? 1200 : 1500} />
      <div style={{ padding: portrait ? "0 70px" : "0 170px", width: "100%" }}>
        <BlurIn at={c[0].frame - 6}>
          <Eyebrow>AI Search</Eyebrow>
        </BlurIn>
        <Swap
          style={{ marginTop: 14 }}
          items={[
            { at: c[0].frame, node: <Headline size={portrait ? 66 : 70}>Describe who you need. In plain English.</Headline> },
            { at: c[1].frame, node: <Headline size={portrait ? 66 : 70}>No filters. No Boolean.</Headline> },
          ]}
        />

        <div
          style={{
            marginTop: portrait ? 70 : 64,
            opacity: barIn * (1 - prog(f, c[2].frame - 4, 16)),
            transform: `translateY(${(1 - barIn) * 24}px)`,
          }}
        >
          <Card style={{ padding: portrait ? "22px 26px" : "24px 30px", display: "flex", alignItems: "center", gap: 20, width: portrait ? "100%" : 980, boxSizing: "border-box" }}>
            <div style={{ width: portrait ? 52 : 60, height: portrait ? 52 : 60, borderRadius: "50%", background: `${C.violet}17`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon.Search size={portrait ? 24 : 28} color={C.violet} stroke={2.8} />
            </div>
            <Mono size={portrait ? 21 : 30} color={C.fg} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", flex: 1, minWidth: 0, lineHeight: 1.3 }}>
              {typed}
              {cursorOn ? "▍" : " "}
            </Mono>
          </Card>

          <div style={{ marginTop: 26, display: "flex", flexWrap: "wrap", gap: 12 }}>
            {FILTERS.map((chip, i) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: `1px solid ${C.hairline}`,
                  opacity: 1 - filtersOut,
                  transform: `translateY(${filtersOut * -10}px) scale(${1 - filtersOut * 0.1})`,
                  textDecoration: filtersOut > 0.5 ? "line-through" : undefined,
                }}
              >
                <Mono size={22} color={C.dim}>{chip}</Mono>
                {filtersOut > 0.3 && <Icon.X size={14} color={C.coral} stroke={2.4} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", opacity: prog(f, c[2].frame - 2, 20) }}>
          <Mono size={portrait ? 30 : 32} color={C.dim} style={{ textAlign: "center", maxWidth: portrait ? 780 : 1000 }}>
            “{QUERY}”
          </Mono>
          <div style={{ marginTop: 34, fontSize: portrait ? 150 : 190, fontWeight: 750, letterSpacing: "-0.05em", color: C.fg }}>
            <Counter to={800} at={tCount} dur={34} suffix="M+" />
          </div>
          <div style={{ marginTop: 10, fontSize: 34, fontWeight: 500, color: C.dim }}>profiles searched, instantly</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
