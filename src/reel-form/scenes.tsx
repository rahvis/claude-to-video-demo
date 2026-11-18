import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { mix, prog } from "../lib/motion";
import { useEvent, useSceneData } from "../lib/scene";
import { clamp } from "../seeker/theme";
import { useLang } from "../reel/Film";
import { CatMark, Check, Cursor, FACE, In, WorkOnward, Wordmark } from "../reel/kit";
import { STAT, useCopy } from "./copy";

// "The Form" (Auto Apply reel, 9:16). Extreme close-ups of one job application form in black monospace with a
// caution-yellow highlight; whip-pans between fields. Upload the resume, then type it again; every field, again;
// about 44 minutes an application, 62.6 applications, 46 hours (United Way NCA, May 2026). Then Tahoe's auto-apply
// fills the same form from your profile on the company's own site, shows each answer's source, asks you what it
// can't answer ("Needs you"), and waits for your review before Send. Evening comes back.

const K = { paper: "#FFFFFF", ink: "#0A0A0A", grey: "#9B9B9B", line: "#E3E3E3", yellow: "#FFE500", purple: "#7C3AED", tint: "#F3EEFF", green: "#16A34A" };
const mono = (ko: boolean) => (ko ? FACE.kr : FACE.mono);

/** Each scene enters with a whip-pan: a fast slide from the right with horizontal motion blur. */
const Whip: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = K.paper }) => {
  const f = useCurrentFrame();
  const p = prog(f, 0, 9, Easing.bezier(0.2, 0.8, 0.2, 1));
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - p) * 700}px)`, filter: p < 1 ? `blur(${(1 - p) * 18}px)` : undefined }}>{children}</div>
    </div>
  );
};

const Caret: React.FC<{ h: number; color?: string }> = ({ h, color = K.ink }) => {
  const f = useCurrentFrame();
  return <span style={{ display: "inline-block", width: Math.max(4, h * 0.07), height: h, background: color, verticalAlign: "middle", marginLeft: 4, opacity: Math.floor(f / 8) % 2 ? 0 : 1 }} />;
};

/** Text that types itself from `at`, `cps` characters per frame. */
const Typed: React.FC<{ text: string; at: number; cps?: number; caret?: boolean; h?: number }> = ({ text, at, cps = 0.9, caret, h = 40 }) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((f - at) * cps)));
  return (
    <>
      {text.slice(0, n)}
      {caret && f >= at && n < text.length ? <Caret h={h} /> : null}
    </>
  );
};

/* ================================================================== upload: then type it again */

export const Upload: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const drop = useEvent("drop");
  const done = useEvent("done");
  const whip = useEvent("whip");
  const caret = useEvent("caret");
  const fileY = interpolate(f, [drop - 10, drop], [-500, 0], { ...clamp, easing: Easing.bezier(0.5, 0, 0.8, 0.5) });
  const bar = prog(f, drop, done - drop, Easing.linear);
  const w = prog(f, whip, 10, Easing.bezier(0.6, 0, 0.2, 1));
  return (
    <Whip>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${-w * 1080}px)`, filter: w > 0 && w < 1 ? `blur(${Math.sin(w * Math.PI) * 20}px)` : undefined }}>
        <div style={{ position: "absolute", left: 70, top: 300, fontFamily: mono(ko), fontSize: 56, fontWeight: 700, color: K.ink }}>{c.upload}</div>
        <div style={{ position: "absolute", left: 70, top: 420, width: 940, height: 760, border: `6px dashed ${K.ink}`, borderRadius: 30, display: "grid", placeItems: "center" }}>
          <div style={{ transform: `translateY(${fileY}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            <div style={{ position: "relative", width: 230, height: 290, background: "#fff", border: `6px solid ${K.ink}`, borderRadius: 18 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{ position: "absolute", left: 34, top: 60 + i * 40, width: i % 2 ? 110 : 160, height: 14, background: K.ink, borderRadius: 7, opacity: 0.8 }} />
              ))}
              {f >= done ? (
                <div style={{ position: "absolute", right: -34, bottom: -34, width: 100, height: 100, borderRadius: 50, background: K.green, display: "grid", placeItems: "center", transform: `scale(${prog(f, done, 10, Easing.bezier(0.2, 0.9, 0.3, 1.5))})` }}>
                  <Check size={70} p={prog(f, done + 2, 10)} width={3.6} />
                </div>
              ) : null}
            </div>
            <div style={{ fontFamily: FACE.mono, fontSize: 40, color: K.ink }}>{c.file}</div>
            <div style={{ width: 560, height: 22, borderRadius: 11, background: K.line, overflow: "hidden" }}>
              <div style={{ width: `${bar * 100}%`, height: "100%", background: K.ink }} />
            </div>
          </div>
        </div>
      </div>
      {/* the next field, after the whip */}
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - w) * 1080}px)`, filter: w > 0 && w < 1 ? `blur(${Math.sin(w * Math.PI) * 20}px)` : undefined }}>
        <div style={{ position: "absolute", left: 70, top: 300, display: "flex", alignItems: "baseline", gap: 24 }}>
          <div style={{ fontFamily: mono(ko), fontSize: 64, fontWeight: 700, color: K.ink }}>{c.history}</div>
          <div style={{ fontFamily: mono(ko), fontSize: 34, color: "#D61F1F" }}>* {c.required}</div>
        </div>
        <div style={{ position: "absolute", left: 70, top: 430, width: 940, height: 960, border: `6px solid ${K.ink}`, borderRadius: 26, background: K.yellow, padding: 50, boxSizing: "border-box" }}>
          {f >= caret ? <Caret h={110} /> : null}
        </div>
      </div>
    </Whip>
  );
};

/* ================================================================== again: every field, then they all clear */

export const Again: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const name = useEvent("name");
  const email = useEvent("email");
  const jobs = useEvent("jobs");
  const reset = useEvent("reset");
  const starts = [name, name + 8, email, jobs, jobs + 12, jobs + 24];
  const wipe = prog(f, reset, 8, Easing.bezier(0.6, 0, 0.4, 1));
  // the camera rides down the form with the typing
  const active = starts.filter((s) => f >= s).length - 1;
  const camY = f >= reset ? mix(-Math.max(0, active - 2) * 190, 0, wipe) : -Math.max(0, active - 2) * 190;
  return (
    <Whip>
      <div style={{ position: "absolute", left: 70, top: 300, width: 940, transform: `translateY(${camY}px)` }}>
        {c.fields.map((fl, i) => {
          const on = f >= starts[i] && f < reset;
          return (
            <div key={fl.label} style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: mono(ko), fontSize: 36, color: K.grey, marginBottom: 12 }}>{fl.label}</div>
              <div style={{ height: 120, border: `5px solid ${on && i === active ? K.ink : "#CFCFCF"}`, borderRadius: 20, background: on && i === active ? K.yellow : "#fff", display: "flex", alignItems: "center", padding: "0 34px", fontFamily: FACE.mono, fontSize: 50, color: K.ink, whiteSpace: "nowrap", overflow: "hidden" }}>
                {f >= starts[i] && f < reset ? <Typed text={fl.value} at={starts[i]} cps={1.4} caret={i === active} h={60} /> : null}
              </div>
            </div>
          );
        })}
      </div>
      {/* "Again.": everything clears in one flash */}
      {f >= reset ? <div style={{ position: "absolute", inset: 0, background: K.ink, opacity: 0.85 * (1 - prog(f, reset + 2, 10)) }} /> : null}
    </Whip>
  );
};

/* ================================================================== hours: 44 min x 62.6 = 46 hours */

export const Hours: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const clock = useEvent("clock");
  const times = useEvent("times");
  const total = useEvent("total");
  const mins = Math.round(interpolate(f, [clock, clock + 34], [0, STAT.minutes], { ...clamp, easing: Easing.bezier(0.3, 0, 0.3, 1) }));
  const shrink = prog(f, total - 6, 14, Easing.bezier(0.6, 0, 0.2, 1));
  return (
    <Whip bg={K.ink}>
      <div style={{ position: "absolute", left: 60, top: 300, width: 960, transform: `scale(${mix(1, 0.62, shrink)}) translateY(${-shrink * 120}px)`, transformOrigin: "0 0" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 24, padding: "20px 40px", background: K.yellow, borderRadius: 24 }}>
          <span style={{ fontFamily: FACE.mono, fontSize: 250, fontWeight: 700, color: K.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{mins}</span>
        </div>
        <div style={{ fontFamily: mono(ko), fontSize: 52, color: "#fff", marginTop: 26 }}>{c.per}</div>
        <In at={times} y={30} style={{ marginTop: 60, display: "flex", alignItems: "baseline", gap: 26, fontFamily: FACE.mono, color: "#fff" }}>
          <span style={{ fontSize: 120, color: K.grey }}>×</span>
          <span style={{ fontSize: 170, fontWeight: 700 }}>{STAT.apps}</span>
          <span style={{ fontFamily: mono(ko), fontSize: 52 }}>{c.times}</span>
        </In>
      </div>
      {f >= total - 2 ? (
        <div style={{ position: "absolute", left: 60, top: 870, width: 960 }}>
          <div style={{ height: 8, background: "#fff", width: `${prog(f, total - 2, 10) * 100}%` }} />
          <In at={total} y={50} dur={14}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 30, marginTop: 30 }}>
              <span style={{ fontFamily: FACE.mono, fontSize: 330, fontWeight: 700, color: K.yellow, lineHeight: 1, letterSpacing: "-0.04em" }}>{STAT.hours}</span>
              <span style={{ fontFamily: mono(ko), fontSize: 80, fontWeight: 700, color: K.yellow }}>{c.total}</span>
            </div>
          </In>
          <In at={total + 10} y={10} style={{ marginTop: 40, fontFamily: ko ? FACE.kr : FACE.text, fontSize: 26, color: K.grey }}>
            {STAT.source[ko ? "ko" : "en"]}
          </In>
        </div>
      ) : null}
    </Whip>
  );
};

/* ================================================================== auto: the same form fills itself, sources shown */

const SOURCES = [0, 0, 1, 0, 0, 0];

export const Auto: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const mark = useEvent("mark");
  const fill = useEvent("fill");
  const site = useEvent("site");
  const { durationInFrames } = useSceneData();
  const head = prog(f, mark, 14, Easing.bezier(0.2, 0.9, 0.3, 1.2));
  const camY = interpolate(f, [fill + 20, durationInFrames], [0, -330], { ...clamp, easing: Easing.bezier(0.4, 0, 0.4, 1) });
  return (
    <Whip>
      {/* the company's own page header */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 250, height: 110, borderBottom: `3px solid ${K.line}`, display: "flex", alignItems: "center", gap: 20, padding: "0 70px", background: "#FAFAFA" }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg,#0F766E,#2DD4BF)" }} />
        <div style={{ fontFamily: ko ? FACE.kr : FACE.text, fontSize: 36, fontWeight: 600, color: K.ink, opacity: 0.4 + 0.6 * prog(f, site, 10) }}>{c.company}</div>
      </div>
      {/* Tahoe's auto-apply bar */}
      <div style={{ position: "absolute", left: 50, right: 50, top: 390, height: 120, borderRadius: 30, background: K.purple, display: "flex", alignItems: "center", gap: 22, padding: "0 30px", transform: `scale(${head})`, opacity: head, boxShadow: "0 20px 40px rgba(124,58,237,0.3)" }}>
        <CatMark size={76} glow={0.3} />
        <div style={{ fontFamily: ko ? FACE.kr : FACE.text, fontSize: 44, fontWeight: 700, color: "#fff" }}>{c.autoApply}</div>
        <div style={{ flex: 1 }} />
        <Wordmark size={44} color="#fff" spark="#FDE68A" />
      </div>
      <div style={{ position: "absolute", left: 70, top: 560, width: 940, height: 900, overflow: "hidden" }}>
        <div style={{ transform: `translateY(${camY}px)` }}>
          {c.fields.map((fl, i) => {
            const at = fill + i * 7;
            const done = f >= at + fl.value.length / 3;
            return (
              <div key={fl.label} style={{ marginBottom: 30 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <div style={{ fontFamily: mono(ko), fontSize: 32, color: K.grey }}>{fl.label}</div>
                  {done ? (
                    <div style={{ fontFamily: ko ? FACE.kr : FACE.text, fontSize: 25, fontWeight: 600, color: K.purple, padding: "6px 16px", borderRadius: 999, background: K.tint, opacity: prog(f, at + fl.value.length / 3, 8) }}>
                      {SOURCES[i] ? c.fromProfile : c.fromResume}
                    </div>
                  ) : null}
                </div>
                <div style={{ height: 104, border: `4px solid ${done ? K.purple : "#D4D4D4"}`, borderRadius: 18, display: "flex", alignItems: "center", padding: "0 30px", fontFamily: FACE.mono, fontSize: 44, color: K.ink, whiteSpace: "nowrap", overflow: "hidden" }}>
                  {f >= at ? <Typed text={fl.value} at={at} cps={3} /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Whip>
  );
};

/* ================================================================== asks: "Needs you", then your review and Send */

export const Asks: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const needs = useEvent("needs");
  const review = useEvent("review");
  const send = useEvent("send");
  const sent = useEvent("sent");
  const sheet = prog(f, review, 16, Easing.bezier(0.2, 0.9, 0.3, 1));
  const cur = interpolate(f, [send - 16, send - 2], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const press = interpolate(f, [send - 2, send, send + 5], [0, 1, 0], clamp);
  const isSent = f >= sent;
  return (
    <Whip>
      {/* the one question it can't answer */}
      <div style={{ position: "absolute", left: 70, top: 300, width: 940, transform: `translateY(${-sheet * 60}px)`, opacity: 1 - 0.5 * sheet }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: mono(ko), fontSize: 34, color: K.ink, fontWeight: 700, maxWidth: 640 }}>{c.question}</div>
          <div style={{ fontFamily: ko ? FACE.kr : FACE.text, fontSize: 28, fontWeight: 700, color: K.ink, padding: "10px 22px", borderRadius: 999, background: K.yellow, transform: `scale(${prog(f, needs, 10, Easing.bezier(0.2, 0.9, 0.3, 1.6))})` }}>{c.needsYou}</div>
        </div>
        <div style={{ height: 300, border: `5px solid ${K.ink}`, borderRadius: 22, background: f >= needs ? "#FFFBD1" : "#fff", padding: 34, boxSizing: "border-box" }}>
          {f >= needs ? <Caret h={56} /> : null}
        </div>
      </div>
      {/* the review sheet */}
      <div style={{ position: "absolute", left: 50, right: 50, top: 720, transform: `translateY(${(1 - sheet) * 1200}px)`, borderRadius: 40, background: "#fff", boxShadow: "0 -20px 60px rgba(0,0,0,0.18)", border: `3px solid ${K.line}`, padding: "40px 44px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <CatMark size={64} glow={0.2} />
          <div style={{ fontFamily: ko ? FACE.kr : FACE.text, fontSize: 40, fontWeight: 700, color: K.ink, flex: 1 }}>{c.ready}</div>
        </div>
        {c.fields.slice(0, 4).map((fl) => (
          <div key={fl.label} style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 24, fontFamily: FACE.mono, fontSize: 32, color: K.ink }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: K.tint, display: "grid", placeItems: "center" }}>
              <Check size={30} p={1} color={K.purple} width={3.4} />
            </div>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fl.value}</span>
          </div>
        ))}
        <div style={{ marginTop: 40, height: 120, borderRadius: 60, background: isSent ? K.green : K.purple, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: ko ? FACE.kr : FACE.text, fontSize: 46, fontWeight: 700, color: "#fff", transform: `scale(${1 - 0.05 * press})` }}>
          {isSent ? <Check size={56} p={prog(f, sent, 10)} width={3.6} /> : null}
          {isSent ? c.sent : c.send}
        </div>
      </div>
      {sheet > 0.9 ? <Cursor x={mix(900, 600, cur)} y={mix(1700, 1215, cur)} color={K.ink} size={1.6} press={press} /> : null}
    </Whip>
  );
};

/* ================================================================== close: evening comes back */

export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const dusk = useEvent("dusk");
  const lockup = useEvent("lockup");
  const line = useEvent("line");
  const d = prog(f, dusk - 10, 40, Easing.bezier(0.4, 0, 0.2, 1));
  return (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${d > 0 ? `rgba(46,26,90,${d})` : "#fff"} 0%, rgba(255,140,90,${0.9 * d}) 70%, rgba(255,200,120,${d}) 100%)`, backgroundColor: "#fff" }}>
      <div style={{ position: "absolute", left: 800, top: mix(1560, 1290, d), width: 180, height: 180, borderRadius: 90, background: "#FFD27A", opacity: d, boxShadow: "0 0 120px rgba(255,190,90,0.8)" }} />
      <In at={dusk} y={30} style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", justifyContent: "center" }}>
        <CatMark size={200} glow={0.8} />
      </In>
      <In at={dusk + 6} y={24} style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center" }}>
        <Wordmark size={124} color="#fff" spark={K.yellow} />
      </In>
      <In at={lockup} y={20} style={{ position: "absolute", left: 110, right: 110, top: 990, textAlign: "center", fontFamily: ko ? FACE.kr : FACE.mono, fontSize: ko ? 44 : 42, lineHeight: 1.35, color: "#fff", fontWeight: 600 }}>
        {c.end}
      </In>
      <In at={line} y={10} style={{ position: "absolute", left: 0, right: 0, top: 1340, display: "flex", justifyContent: "center", filter: "brightness(0) invert(1)", opacity: 0.85 }}>
        <WorkOnward size={28} />
      </In>
    </div>
  );
};

export const FORM_SCENES: Record<string, React.FC> = { upload: Upload, again: Again, hours: Hours, auto: Auto, asks: Asks, close: Close };
