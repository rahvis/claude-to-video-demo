import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Glow, Headline, Mono } from "../components/ui";
import { C } from "../theme";

const TABS = ["Sourcing", "Boolean.txt", "LinkedIn", "Sheet3", "Sheet3 (2)", "untitled", "candidates_v9", "ATS", "Gmail", "new tab"];

export const S01Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait, w } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2)];
  const tTabs = useEvent("tabs");
  const tBoolean = useEvent("boolean");
  const tOutdated = useEvent("outdated");

  const tabsIn = prog(f, tTabs, 40, EASE_IN_OUT);
  const glitch = Math.sin(f / 2) * (f > tBoolean && f < tBoolean + 26 ? 3 : 0);

  const size = portrait ? 66 : 74;
  const maxTabs = portrait ? 8 : 14;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tTabs} opacity={0.22} size={portrait ? 1100 : 1400} />

      {/* clutter: a fan of browser tabs */}
      <div
        style={{
          position: "absolute",
          top: portrait ? 210 : 150,
          left: "50%",
          display: "flex",
          gap: 8,
          transform: `translateX(-50%) translateY(${(1 - tabsIn) * -20}px)`,
          opacity: tabsIn,
        }}
      >
        {TABS.slice(0, maxTabs).map((t, i) => (
          <div
            key={t}
            style={{
              width: portrait ? 78 : 108,
              padding: "10px 12px",
              background: C.card,
              border: `1px solid ${C.hairline}`,
              borderRadius: 10,
              transform: `translateY(${Math.sin(i * 1.3) * 6}px)`,
            }}
          >
            <Mono size={12} color={C.dim} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
              {t}
            </Mono>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 40, borderRadius: 10, background: C.orange }}>
          <span style={{ color: "#fff", fontSize: 18, fontWeight: 700, fontFamily: "inherit" }}>15</span>
        </div>
      </div>

      <div style={{ marginTop: portrait ? 140 : 120, padding: portrait ? "0 70px" : "0 160px", textAlign: "center" }}>
        <Swap
          align="center"
          items={[
            { at: c[0].frame, node: <Headline size={size} style={{ textAlign: "center" }}>Somewhere right now, a recruiter has fifteen tabs open.</Headline> },
            {
              at: c[1].frame,
              node: (
                <div>
                  <Headline size={size} style={{ textAlign: "center" }}>
                    A Boolean string only a machine could love.
                  </Headline>
                  <div style={{ transform: `translateX(${glitch}px)`, marginTop: 30 }}>
                    <Mono size={portrait ? 24 : 28} color={C.dim} style={{ display: "inline-block", background: C.card, padding: "14px 22px", borderRadius: 14, border: `1px solid ${C.hairline}` }}>
                      {'("VP Sales" OR "Head of Sales") AND (SaaS) NOT (recruiter)'}
                    </Mono>
                  </div>
                </div>
              ),
            },
            {
              at: c[2].frame,
              node: (
                <div>
                  <Headline size={size} style={{ textAlign: "center" }}>
                    And a spreadsheet that's already out of date.
                  </Headline>
                  <div style={{ marginTop: 30, display: "flex", justifyContent: "center", opacity: prog(f, tOutdated, 20) }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: `${C.coral}14`, border: `1px solid ${C.coral}44`, borderRadius: 999, padding: "10px 20px" }}>
                      <Mono size={22} color={C.coral}>Last synced 42 days ago</Mono>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </AbsoluteFill>
  );
};
