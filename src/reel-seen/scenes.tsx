import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { Counter, mix, prog } from "../lib/motion";
import { useEvent, useSceneData } from "../lib/scene";
import { beatFrame, sceneSpan, useLang, useReel } from "../reel/Film";
import { CatMark, FACE, In, WorkOnward, Wordmark } from "../reel/kit";
import { STAT, useCopy } from "./copy";

// "Seen" (search reel, 30 s, 9:16). One continuous take of a dark chat app: you message a company about your
// application, follow up, send "test"; typing dots tease and vanish. 81% of US candidates were rejected without
// speaking to anyone (Greenhouse, Oct 2026). Then a new thread: Tahoe, with today's matches and why each one fits.
// The thread is the reel's backdrop (drawn once for the whole film); scenes only add the stat and the end card.

const K = { bg: "#0D0D12", head: "#15151C", line: "#24242E", them: "#24242E", me1: "#8B5CF6", me2: "#6D28D9", text: "#F2F2F7", sub: "#8E8E9E", card: "#1A1A23", green: "#34D399", purple: "#A78BFA" };

const font = (ko: boolean) => (ko ? FACE.kr : FACE.text);
const LINE = 50;
const FS = 38;

type Item = { at: number; h: number; node: React.ReactNode; until?: number };

const Bubble: React.FC<{ me?: boolean; lines: string[]; ko: boolean; bold?: number; dots?: boolean }> = ({ me, lines, ko, bold }) => (
  <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", padding: "0 44px" }}>
    <div
      style={{
        maxWidth: 760,
        padding: "22px 30px",
        borderRadius: 36,
        borderBottomRightRadius: me ? 10 : 36,
        borderBottomLeftRadius: me ? 36 : 10,
        background: me ? `linear-gradient(180deg, ${K.me1}, ${K.me2})` : K.them,
        color: K.text,
        fontFamily: font(ko),
        fontSize: FS,
        lineHeight: `${LINE}px`,
        letterSpacing: ko ? "-0.01em" : "-0.005em",
      }}
    >
      {lines.map((l, i) => (
        <div key={i} style={{ fontWeight: bold === i ? 700 : 400, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 16 }}>
          {bold !== undefined && i > bold ? <span style={{ width: 12, height: 12, borderRadius: 6, background: K.green, flex: "none" }} /> : null}
          {l}
        </div>
      ))}
    </div>
  </div>
);

const Meta: React.FC<{ text: string; ko: boolean; align: "center" | "right" }> = ({ text, ko, align }) => (
  <div style={{ textAlign: align, padding: "0 52px", fontFamily: font(ko), fontSize: 25, color: K.sub, fontWeight: 500 }}>{text}</div>
);

const Typing: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ padding: "0 44px" }}>
      <div style={{ display: "inline-flex", gap: 10, padding: "26px 30px", borderRadius: 36, borderBottomLeftRadius: 10, background: K.them }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: K.sub, opacity: 0.4 + 0.6 * Math.max(0, Math.sin((f / 5) - i * 0.9)) }} />
        ))}
      </div>
    </div>
  );
};

const MatchCard: React.FC<{ job: string; meta: string; pill: string; strong: boolean; ko: boolean; compact?: boolean }> = ({ job, meta, pill, strong, ko, compact }) => (
  <div style={{ padding: "0 44px" }}>
    <div style={{ width: 840, boxSizing: "border-box", padding: compact ? "22px 28px" : "30px 32px", borderRadius: 30, background: K.card, border: `2px solid ${K.line}`, display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ width: compact ? 70 : 92, height: compact ? 70 : 92, borderRadius: 22, background: strong ? "linear-gradient(135deg,#1D4ED8,#60A5FA)" : "linear-gradient(135deg,#C2410C,#FB923C)", flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: ko ? FACE.kr : FACE.display, fontSize: compact ? 36 : 44, fontWeight: 600, color: K.text, whiteSpace: "nowrap" }}>{job}</div>
        <div style={{ fontFamily: font(ko), fontSize: compact ? 26 : 30, color: K.sub, marginTop: 6, whiteSpace: "nowrap" }}>{meta}</div>
      </div>
      <div style={{ padding: "10px 20px", borderRadius: 999, background: strong ? "rgba(52,211,153,0.16)" : "rgba(167,139,250,0.16)", color: strong ? K.green : K.purple, fontFamily: font(ko), fontSize: 25, fontWeight: 700, whiteSpace: "nowrap" }}>{pill}</div>
    </div>
  </div>
);

const bubbleH = (lines: number) => lines * LINE + 44;
const GAP = 16;
const BOTTOM = 1360;

/** Stack items bottom-up: each arrives (grows to its height over a few frames), older ones scroll up. */
const Stack: React.FC<{ items: Item[] }> = ({ items }) => {
  const f = useCurrentFrame();
  const shown = items.map((it) => ({ ...it, e: prog(f, it.at, 12, Easing.bezier(0.2, 0.9, 0.3, 1)) * (it.until === undefined ? 1 : 1 - prog(f, it.until, 8)) }));
  let y = BOTTOM;
  const placed: React.ReactNode[] = [];
  for (let i = shown.length - 1; i >= 0; i--) {
    const it = shown[i];
    if (it.e <= 0) continue;
    y -= (it.h + GAP) * it.e;
    const fadeTop = Math.min(1, Math.max(0, (y - 360) / 80));
    placed.push(
      <div key={i} style={{ position: "absolute", left: 0, right: 0, top: y, opacity: it.e * fadeTop, transform: `translateY(${(1 - it.e) * 30}px) scale(${mix(0.96, 1, it.e)})`, transformOrigin: "50% 100%" }}>
        {it.node}
      </div>,
    );
  }
  return <>{placed}</>;
};

const Header: React.FC<{ tahoe: boolean; ko: boolean; name: string; sub: string }> = ({ tahoe, ko, name, sub }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 240, height: 128, background: K.head, borderBottom: `1.5px solid ${K.line}`, display: "flex", alignItems: "center", gap: 22, padding: "0 40px" }}>
    <svg width={30} height={44} viewBox="0 0 30 44">
      <path d="M24 4 L6 22 L24 40" fill="none" stroke={K.purple} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {tahoe ? <CatMark size={78} glow={0.4} /> : <div style={{ width: 78, height: 78, borderRadius: 39, background: "linear-gradient(135deg,#0F766E,#2DD4BF)", display: "grid", placeItems: "center", color: "#fff", fontFamily: FACE.display, fontWeight: 700, fontSize: 38 }}>J</div>}
    <div>
      <div style={{ fontFamily: tahoe ? FACE.brand : font(ko), fontSize: tahoe ? 40 : 36, fontWeight: tahoe ? 700 : 600, color: K.text }}>{name}</div>
      <div style={{ fontFamily: font(ko), fontSize: 25, color: tahoe ? K.green : K.sub, marginTop: 2 }}>{sub}</div>
    </div>
  </div>
);

/** The whole chat, frame by frame: thread with the company, then the switch to Tahoe's thread. */
export const Thread: React.FC = () => {
  const f = useCurrentFrame();
  const info = useReel();
  const c = useCopy();
  const ko = useLang() === "ko";
  const t = (s: string, n: string) => beatFrame(info, s, n);
  const [silFrom, silLen] = sceneSpan(info, "silence");
  const [closeFrom] = sceneSpan(info, "close");

  const dotsOn = t("applied", "dots");
  const dotsOff = t("silence", "dotsOff");
  const a: Item[] = [
    { at: t("applied", "m1") - 6, h: 60, node: <Meta text={c.day1} ko={ko} align="center" /> },
    { at: t("applied", "m1"), h: bubbleH(c.m1.length), node: <Bubble me lines={c.m1} ko={ko} /> },
    { at: t("applied", "m1") + 14, h: 34, node: <Meta text={c.delivered} ko={ko} align="right" /> },
    { at: t("applied", "day2"), h: 60, node: <Meta text={c.day2} ko={ko} align="center" /> },
    { at: t("applied", "m2"), h: bubbleH(c.m2.length), node: <Bubble me lines={c.m2} ko={ko} /> },
    { at: t("applied", "m2") + 14, h: 34, node: <Meta text={c.delivered} ko={ko} align="right" /> },
    { at: t("applied", "day3"), h: 60, node: <Meta text={c.day3} ko={ko} align="center" /> },
    { at: t("applied", "m3"), h: bubbleH(1), node: <Bubble me lines={c.m3} ko={ko} /> },
    { at: t("applied", "m3") + 12, h: 34, node: <Meta text={c.delivered} ko={ko} align="right" /> },
    { at: dotsOn, until: dotsOff, h: 68, node: <Typing /> },
  ];

  const b: Item[] = [
    { at: t("why", "t1"), h: bubbleH(1), node: <Bubble lines={c.t1} ko={ko} /> },
    { at: t("why", "card"), h: 152, node: <MatchCard job={c.job} meta={c.jobMeta} pill={c.strong} strong ko={ko} /> },
    { at: t("why", "why"), h: bubbleH(4), node: <Bubble lines={[c.whyTitle, ...c.why]} bold={0} ko={ko} /> },
    { at: t("why", "more1"), h: 118, node: <MatchCard job={c.more[0].job} meta={c.more[0].meta} pill={c.good} strong={false} ko={ko} compact /> },
    { at: t("why", "more2"), h: 118, node: <MatchCard job={c.more[1].job} meta={c.more[1].meta} pill={c.good} strong={false} ko={ko} compact /> },
  ];

  const sw = prog(f, t("turn", "mark") - 8, 18, Easing.bezier(0.6, 0, 0.2, 1));
  const dim = prog(f, silFrom, 12) * (1 - prog(f, silFrom + silLen - 10, 10));
  const out = prog(f, t("close", "end"), 16);
  const pre = f < closeFrom ? 0 : out;

  return (
    <div style={{ position: "absolute", inset: 0, background: K.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - 0.75 * pre, filter: pre > 0 ? `blur(${pre * 14}px)` : undefined }}>
        {/* thread A: the company */}
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${-sw * 1080}px)`, opacity: 1 - dim * 0.94 }}>
          <Stack items={a} />
          <Header tahoe={false} ko={ko} name={c.company} sub={c.active} />
        </div>
        {/* thread B: Tahoe */}
        {sw > 0 ? (
          <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - sw) * 1080}px)` }}>
            <Stack items={b} />
            <Header tahoe ko={ko} name={c.tahoe} sub={c.online} />
          </div>
        ) : null}
        {/* the message bar */}
        <div style={{ position: "absolute", left: 40, right: 40, top: 1390, height: 84, borderRadius: 42, background: K.head, border: `1.5px solid ${K.line}`, display: "flex", alignItems: "center", padding: "0 14px 0 34px", fontFamily: font(ko), fontSize: 32, color: K.sub }}>
          <div style={{ flex: 1 }}>{c.message}</div>
          <div style={{ width: 60, height: 60, borderRadius: 30, background: K.me2, display: "grid", placeItems: "center" }}>
            <svg width={26} height={26} viewBox="0 0 24 24">
              <path d="M12 19 V5 M5 12 L12 5 L19 12" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================================================================== scenes: only the stat and the end card */

const Nothing: React.FC = () => null;

export const Silence: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const { durationInFrames } = useSceneData();
  const stat = useEvent("stat");
  const label = useEvent("label");
  const out = prog(f, durationInFrames - 24, 12);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <In at={stat} y={40} style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center" }}>
        <div style={{ fontFamily: FACE.display, fontSize: 330, fontWeight: 700, color: K.text, letterSpacing: "-0.05em", lineHeight: 1 }}>
          <Counter to={STAT.value} at={stat} dur={30} suffix="%" />
        </div>
      </In>
      <In at={label} y={24} style={{ position: "absolute", left: 90, right: 90, top: 930, textAlign: "center" }}>
        {c.statLabel.map((l, i) => (
          <div key={i} style={{ fontFamily: font(ko), fontSize: 46, lineHeight: 1.3, color: i === 1 ? K.text : "#C9C9D6", fontWeight: i === 1 ? 600 : 400 }}>
            {l}
          </div>
        ))}
      </In>
      <In at={label + 10} y={10} style={{ position: "absolute", left: 0, right: 0, top: 1170, textAlign: "center", fontFamily: font(ko), fontSize: 26, color: K.sub }}>
        {STAT.source[ko ? "ko" : "en"]}
      </In>
    </div>
  );
};

export const Close: React.FC = () => {
  const c = useCopy();
  const ko = useLang() === "ko";
  const end = useEvent("end");
  const lockup = useEvent("lockup");
  const line = useEvent("line");
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <In at={end + 4} y={30} style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
        <CatMark size={210} glow={1} ring="rgba(167,139,250,0.35)" />
      </In>
      <In at={end + 10} y={24} style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", justifyContent: "center" }}>
        <Wordmark size={120} color={K.text} spark={K.purple} />
      </In>
      <In at={lockup} y={20} style={{ position: "absolute", left: 0, right: 0, top: 1060, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "26px 46px", borderRadius: 44, borderBottomRightRadius: 12, background: `linear-gradient(180deg, ${K.me1}, ${K.me2})`, color: "#fff", fontFamily: font(ko), fontSize: 46, fontWeight: 600 }}>{c.trial}</div>
      </In>
      <In at={line} y={10} style={{ position: "absolute", left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center", filter: "invert(1) hue-rotate(180deg)" }}>
        <WorkOnward size={28} />
      </In>
    </div>
  );
};

export const SEEN_SCENES: Record<string, React.FC> = { applied: Nothing, silence: Silence, turn: Nothing, why: Nothing, close: Close };
