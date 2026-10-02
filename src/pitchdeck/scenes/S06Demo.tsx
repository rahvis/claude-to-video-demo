import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BlurIn, Counter, EASE_IN_OUT, prog } from "../../lib/motion";
import { useEvent, useLayout } from "../../lib/scene";
import { Body, Card, Glow, Headline, Icon, Mono } from "../components/ui";
import { C } from "../theme";

const SET_CODE = "client.ask(Set, ticket)";
const GATE_CODE = "client.ask(Gate, routing)";

export const S06Demo: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
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
  const size = portrait ? 48 : 54;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Glow at={tBound} opacity={0.36} size={portrait ? 1200 : 1500} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: portrait ? 50 : 90, padding: portrait ? "0 60px" : "0 130px" }}>
        <div style={{ maxWidth: portrait ? "100%" : 440 }}>
          <BlurIn at={tTicket - 8} y={18} dur={22}>
            <Headline size={size}>Watch it decide.</Headline>
          </BlurIn>
          <div style={{ marginTop: 18, opacity: prog(f, tTypeGate, 24) }}>
            <Body size={19} color={C.dim} style={{ fontWeight: 500 }}>
              Same ticket. Two different guarantees.
            </Body>
          </div>
        </div>

        <div style={{ width: portrait ? 460 : 440, opacity: ticketIn, transform: `translateY(${(1 - ticketIn) * 26}px)` }}>
          <Card style={{ padding: 0, overflow: "hidden", border: `1px solid ${C.hairline}` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "16px 20px", borderBottom: `1px solid ${C.hairline}` }}>
              <Mono size={18} color={C.blue} style={{ fontWeight: 700 }}>ticket.py</Mono>
              <Mono size={13} color={C.dim} style={{ fontStyle: "italic" }}>
                "Our bank payout has been pending since Monday."
              </Mono>
            </div>
            <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <CodeLine text={SET_CODE.slice(0, setChars)} cursor={setChars > 0 && setChars < SET_CODE.length && f % 20 < 10} />
              <Result show={queueIn > 0.02} p={queueIn} color={C.blue} label="Set">
                <Mono size={16} color={C.fg}>billing, technical</Mono>
                <Mono size={13} color={C.dim} style={{ marginLeft: 10 }}>
                  <Counter to={90} at={tCoverage} dur={20} suffix="% coverage" /> &middot; n=1204
                </Mono>
              </Result>

              <div style={{ height: 1, background: C.hairline, margin: "2px 0" }} />

              <CodeLine text={GATE_CODE.slice(0, gateChars)} cursor={gateChars > 0 && gateChars < GATE_CODE.length && f % 20 < 10} />
              <Result show={decisionIn > 0.02} p={decisionIn} color={C.coral} label="Gate" icon={<Icon.X size={15} color={C.coral} stroke={2.8} />}>
                <Mono size={16} color={C.fg}>escalate</Mono>
                <Mono size={13} color={C.dim} style={{ marginLeft: 10 }}>approved: false</Mono>
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
    <Mono size={18} color={C.fg} style={{ whiteSpace: "pre" }}>
      <span style={{ color: C.dim }}>{"> "}</span>
      {text}
      {cursor ? "▍" : ""}
    </Mono>
  </div>
);

const Result: React.FC<{ show: boolean; p: number; color: string; label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ show, p, color, label, icon, children }) => (
  <div style={{ opacity: show ? p : 0, transform: `translateY(${(1 - p) * 10}px)`, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginLeft: 18 }}>
    <div style={{ padding: "4px 12px", borderRadius: 999, background: `${color}14`, border: `1px solid ${color}44`, flexShrink: 0 }}>
      <Mono size={14} color={color} style={{ fontWeight: 700 }}>{label}</Mono>
    </div>
    {icon}
    {children}
  </div>
);
