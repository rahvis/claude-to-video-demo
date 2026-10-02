import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, Counter, EASE_IN_OUT, prog, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Eyebrow, Glow, Headline, Icon, Mono } from "../components/ui";
import { C } from "../theme";

const SET_CODE = "client.ask(Set, ticket)";
const GATE_CODE = "client.ask(Gate, routing)";

export const S05Demo: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2), useCue(3), useCue(4), useCue(5)];
  const tTicket = useEvent("ticket");
  const tTypeSet = useEvent("typeSet");
  const tQueue = useEvent("queue");
  const tCoverage = useEvent("coverage");
  const tTypeGate = useEvent("typeGate");
  const tDecision = useEvent("decision");
  const tBound = useEvent("bound");

  const ticketIn = prog(f, tTicket, 26, EASE_IN_OUT);
  const setChars = Math.max(0, Math.min(SET_CODE.length, Math.floor((f - tTypeSet) / 1.6)));
  const gateChars = Math.max(0, Math.min(GATE_CODE.length, Math.floor((f - tTypeGate) / 1.6)));
  const queueIn = prog(f, tQueue, 16);
  const decisionIn = prog(f, tDecision, 16);
  const size = portrait ? 54 : 58;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tBound} opacity={0.24} size={portrait ? 1200 : 1500} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 50 : 90, padding: portrait ? "0 60px" : "0 130px" }}>
        <div style={{ maxWidth: portrait ? "100%" : 500 }}>
          <BlurIn at={c[0].frame - 4}>
            <Eyebrow>Live demo</Eyebrow>
          </BlurIn>
          <Swap
            style={{ marginTop: 14 }}
            items={[
              { at: c[0].frame, node: <Headline size={size}>Here's what that looks like.</Headline> },
              { at: c[1].frame, node: <Headline size={size}>A support ticket comes in.</Headline> },
              { at: c[2].frame, node: <Headline size={size}>Ask for a Set, and it tells you which queue this belongs in.</Headline> },
              { at: c[3].frame, node: <Headline size={size}>Billing, with ninety percent coverage, guaranteed.</Headline> },
              { at: c[4].frame, node: <Headline size={size}>Ask for a Gate, and it decides whether to approve that routing.</Headline> },
              { at: c[5].frame, node: <Headline size={size}>This time, it escalates: not a guess, a bound you can defend.</Headline> },
            ]}
          />
        </div>

        <div style={{ width: portrait ? 480 : 460, opacity: ticketIn, transform: `translateY(${(1 - ticketIn) * 26}px)` }}>
          <Card style={{ padding: 0, overflow: "hidden", border: `1px solid ${C.hairline}` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "16px 20px", borderBottom: `1px solid ${C.hairline}` }}>
              <Mono size={18} color={C.blue} style={{ fontWeight: 600 }}>ticket.py</Mono>
              <Mono size={14} color={C.dim} style={{ fontStyle: "italic" }}>
                “Our bank payout has been pending since Monday.”
              </Mono>
            </div>
            <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <CodeLine text={SET_CODE.slice(0, setChars)} cursor={setChars > 0 && setChars < SET_CODE.length && f % 20 < 10} />
              <Result show={queueIn > 0.02} p={queueIn} color={C.blue} label="Set">
                <Mono size={17} color={C.fg}>billing, technical</Mono>
                <Mono size={14} color={C.dim} style={{ marginLeft: 10 }}>
                  · <Counter to={90} at={tCoverage} dur={20} suffix="% coverage" /> · n=1204
                </Mono>
              </Result>

              <div style={{ height: 1, background: C.hairline, margin: "2px 0" }} />

              <CodeLine text={GATE_CODE.slice(0, gateChars)} cursor={gateChars > 0 && gateChars < GATE_CODE.length && f % 20 < 10} />
              <Result show={decisionIn > 0.02} p={decisionIn} color={C.coral} label="Gate" icon={<Icon.X size={16} color={C.coral} stroke={2.8} />}>
                <Mono size={17} color={C.fg}>escalate</Mono>
                <Mono size={14} color={C.dim} style={{ marginLeft: 10 }}>· approved: false</Mono>
              </Result>
            </div>
          </Card>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CodeLine: React.FC<{ text: string; cursor: boolean }> = ({ text, cursor }) => (
  <div>
    <Mono size={19} color={C.fg} style={{ whiteSpace: "pre" }}>
      <span style={{ color: C.dim }}>{"> "}</span>
      {text}
      {cursor ? "▍" : ""}
    </Mono>
  </div>
);

const Result: React.FC<{ show: boolean; p: number; color: string; label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ show, p, color, label, icon, children }) => (
  <div style={{ opacity: show ? p : 0, transform: `translateY(${(1 - p) * 10}px)`, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginLeft: 18 }}>
    <div style={{ padding: "4px 12px", borderRadius: 999, background: `${color}14`, border: `1px solid ${color}44`, flexShrink: 0 }}>
      <Mono size={15} color={color} style={{ fontWeight: 600 }}>{label}</Mono>
    </div>
    {icon}
    {children}
  </div>
);
