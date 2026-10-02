import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Eyebrow, Glow, Headline, Icon, Mono } from "../components/ui";
import { C } from "../theme";

export const S05Extension: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2), useCue(3)];
  const tPanel = useEvent("panel");
  const tClick = useEvent("click");
  const tSaved = useEvent("saved");
  const tEmail = useEvent("revealEmail");
  const tPhone = useEvent("revealPhone");
  const tInstant = useEvent("instant");

  const panelIn = prog(f, tPanel, 26, EASE_IN_OUT);
  const savedIn = prog(f, tSaved, 18);
  const emailIn = prog(f, tEmail, 16);
  const phoneIn = prog(f, tPhone, 16);
  const glow = prog(f, tInstant, 20);

  const size = portrait ? 62 : 66;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tSaved} opacity={0.26} size={portrait ? 1200 : 1500} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 56 : 100, padding: portrait ? "0 70px" : "0 150px" }}>
        <div style={{ maxWidth: portrait ? "100%" : 620 }}>
          <BlurIn at={c[0].frame - 4}>
            <Eyebrow>One-click capture</Eyebrow>
          </BlurIn>
          <Swap
            style={{ marginTop: 14 }}
            items={[
              { at: c[0].frame, node: <Headline size={size}>Right inside LinkedIn.</Headline> },
              { at: c[1].frame, node: <Headline size={size}>One click saves the profile.</Headline> },
              { at: c[2].frame, node: <Headline size={size}>Reveal an email. A phone number.</Headline> },
              { at: c[3].frame, node: <Headline size={size} style={{ boxShadow: `0 0 ${glow * 40}px ${C.violet}55` }}>Instantly.</Headline> },
            ]}
          />
        </div>

        <div
          style={{
            width: portrait ? 460 : 420,
            opacity: panelIn,
            transform: `translateX(${(1 - panelIn) * 30}px) scale(${0.94 + 0.06 * panelIn})`,
          }}
        >
          <Card style={{ padding: 0, overflow: "hidden", border: `1px solid ${C.hairline}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.hairline}` }}>
              <Mono size={20} color={C.violet} style={{ fontWeight: 600 }}>tahoe ✦</Mono>
              <Icon.X size={16} color={C.dim} stroke={2.2} />
            </div>
            <div style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${C.violet}, ${C.pink})` }} />
                <div>
                  <div style={{ fontSize: 22, fontWeight: 650, color: C.fg }}>Jordan Reyes</div>
                  <div style={{ fontSize: 17, color: C.dim }}>Senior Product Designer · Figma</div>
                </div>
              </div>

              <Row show={f >= tClick} label="Profile detected" icon={<Icon.Check size={20} color={C.green} />} />
              <Row show={savedIn > 0.05} label="Saved to Tahoe" icon={<Icon.Bookmark size={20} color={C.violet} />} highlight />

              <div style={{ height: 1, background: C.hairline, margin: "18px 0" }} />

              <RevealRow show={emailIn > 0.05} p={emailIn} icon={<Icon.Mail size={18} color={C.fg} />} label="Company email" value="jordan@figma.com" />
              <RevealRow show={phoneIn > 0.05} p={phoneIn} icon={<Icon.Phone size={18} color={C.fg} />} label="Mobile" value="+1 (415) 555-0148" />
            </div>
          </Card>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Row: React.FC<{ show: boolean; label: string; icon: React.ReactNode; highlight?: boolean }> = ({ show, label, icon, highlight }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 16,
      opacity: show ? 1 : 0,
      transform: `translateY(${show ? 0 : 8}px)`,
      transition: undefined,
    }}
  >
    {icon}
    <span style={{ fontSize: 19, fontWeight: highlight ? 600 : 500, color: highlight ? C.violet : C.fg }}>{label}</span>
  </div>
);

const RevealRow: React.FC<{ show: boolean; p: number; icon: React.ReactNode; label: string; value: string }> = ({ show, p, icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, opacity: show ? 1 : 0, transform: `translateY(${(1 - p) * 8}px)` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {icon}
      <span style={{ fontSize: 18, color: C.dim }}>{label}</span>
    </div>
    <Mono size={17} color={p > 0.6 ? C.fg : C.dim}>{p > 0.4 ? value : "•••••••••••"}</Mono>
  </div>
);
