import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { mix, prog } from "../lib/motion";
import { useEvent, useSceneData } from "../lib/scene";
import { clamp } from "../seeker/theme";
import { beatFrame, sceneSpan, useLang, useReel } from "../reel/Film";
import { CatMark, Check, FACE, In, WorkOnward, Wordmark } from "../reel/kit";
import { STAT, useCopy } from "./copy";

// "Night Shift" (Auto Apply reel, 9:16). One continuous sky seen through a window, indigo night to dawn over the
// whole reel (the backdrop); scenes dissolve by light (src/reel/shells.tsx Dissolve). Four applications tonight and
// a laptop closing; a search now runs a median 11.9 weeks (BLS, Oct 2026); the moon becomes Tahoe's mark; each
// morning Tahoe picks from your newest matches and fills them in; you review them with coffee and send the ones you
// like. Get some sleep.

const NIGHT = { top: [11, 16, 51], bot: [44, 32, 96] };
const DAWN = { top: [120, 170, 235], bot: [255, 196, 150] };
const lerpC = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(mix(v, b[i], t))).join(",")})`;
const ui = (ko: boolean) => (ko ? FACE.kr : FACE.text);

/** 0 = deep night, 1 = full morning, for any film frame. */
const useDawn = () => {
  const info = useReel();
  const f = useCurrentFrame();
  const [mFrom] = sceneSpan(info, "morning");
  const [cFrom, cLen] = sceneSpan(info, "close");
  return { f, d: interpolate(f, [mFrom - 20, cFrom + cLen * 0.3], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.35, 1) }), info };
};

const SKYLINE = (() => {
  const out: { x: number; w: number; h: number }[] = [];
  let x = -20;
  let i = 0;
  while (x < 1100) {
    const w = 70 + random(`bw${i}`) * 90;
    out.push({ x, w, h: 120 + random(`bh${i}`) * 260 });
    x += w + 6;
    i++;
  }
  return out;
})();

export const Sky: React.FC = () => {
  const { f, d, info } = useDawn();
  const mark = beatFrame(info, "shift", "mark");
  const moonGone = prog(f, mark - 6, 18);
  const sun = d;
  const stars = Array.from({ length: 90 }, (_, i) => {
    const x = random(`sx${i}`) * 1080;
    const y = 260 + random(`sy${i}`) * 1050;
    const tw = 0.5 + 0.5 * Math.sin(f / (8 + random(`st${i}`) * 10) + i);
    return <circle key={i} cx={x} cy={y} r={1 + random(`sr${i}`) * 2.2} fill="#fff" opacity={(0.35 + 0.65 * tw) * (1 - d * 1.4)} />;
  });
  // the moon arcs across the top; at the mark it becomes Tahoe's cat
  // a low moon over the skyline on the right (clear of the clock and the calendar), then it rises to the centre for the mark
  const [shiftFrom] = sceneSpan(info, "shift");
  const glide = prog(f, shiftFrom - 4, Math.max(8, mark - shiftFrom), Easing.bezier(0.4, 0, 0.2, 1));
  const drift = prog(f, 0, shiftFrom, Easing.linear);
  const mx = mix(mix(930, 900, drift), 540, glide);
  const my = mix(mix(1060, 1010, drift), 560, glide);
  return (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${lerpC(NIGHT.top, DAWN.top, d)} 0%, ${lerpC(NIGHT.bot, DAWN.bot, d)} 78%)`, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {stars}
        {/* the sun comes up behind the city */}
        <circle cx={760} cy={mix(1620, 1210, sun)} r={130} fill="#FFD48A" opacity={sun} />
        <circle cx={760} cy={mix(1620, 1210, sun)} r={260} fill="#FFD48A" opacity={sun * 0.25} />
      </svg>
      {/* moon */}
      <div style={{ position: "absolute", left: mx - 90, top: my - 90, width: 180, height: 180, borderRadius: 90, background: "radial-gradient(circle at 38% 36%, #FFFDF2 0%, #F1E9C9 60%, #D9CFA8 100%)", boxShadow: "0 0 90px rgba(255,248,220,0.55)", opacity: 1 - moonGone, transform: `scale(${1 - 0.2 * moonGone})` }} />
      {/* city skyline, windows going dark through the night and warm again at dawn */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {SKYLINE.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={1500 - b.h} width={b.w} height={b.h + 40} fill={lerpC([20, 18, 48], [96, 72, 98], d)} />
            {Array.from({ length: Math.floor(b.h / 34) * 3 }, (_, k) => {
              const col = k % 3;
              const row = Math.floor(k / 3);
              const on = random(`win${i}${k}`) < (f < 200 ? 0.45 - f / 900 : 0.2) + 0.35 * d;
              return on ? <rect key={k} x={b.x + 12 + col * ((b.w - 24) / 3)} y={1500 - b.h + 18 + row * 34} width={(b.w - 24) / 3 - 10} height={16} fill={d > 0.5 ? "#FFE8B0" : "#FFD27A"} opacity={0.75} /> : null;
            })}
          </g>
        ))}
      </svg>
      {/* the window: wall around the edges and a deep sill */}
      <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 46px ${lerpC([8, 9, 22], [92, 70, 56], d)}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1500, bottom: 0, background: `linear-gradient(180deg, ${lerpC([28, 26, 52], [214, 176, 140], d)} 0%, ${lerpC([14, 13, 30], [150, 112, 86], d)} 100%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1490, height: 16, background: lerpC([40, 38, 70], [236, 206, 170], d) }} />
      {/* film grain */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.1, mixBlendMode: "overlay" }}>
        <filter id="ngrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={f % 6} />
        </filter>
        <rect width={1080} height={1920} filter="url(#ngrain)" />
      </svg>
    </div>
  );
};

/* ================================================================== late: four tonight, the laptop closes */

export const Late: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const sent = useEvent("sent");
  const shut = useEvent("shut");
  const lid = prog(f, shut, 22, Easing.bezier(0.5, 0, 0.3, 1));
  const n = Math.min(4, Math.max(0, Math.floor((f - sent) / 5) + 1));
  return (
    <>
      <In at={8} y={20} style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: FACE.display, fontSize: 120, fontWeight: 300, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.02em" }}>
        {c.time}
      </In>
      {/* laptop on the sill */}
      <div style={{ position: "absolute", left: 250, top: 1080, width: 580, height: 420 }}>
        <div style={{ position: "absolute", left: 40, bottom: 40, width: 500, height: 330, transformOrigin: "50% 100%", transform: `perspective(900px) rotateX(${lid * 86}deg)`, borderRadius: 18, background: "#1C1B2E", border: "8px solid #2E2C48", boxShadow: `0 0 ${120 * (1 - lid)}px rgba(150,170,255,${0.45 * (1 - lid)})` }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#2B2F6B,#1C1F44)", opacity: 1 - lid, padding: 30, boxSizing: "border-box" }}>
            <div style={{ fontFamily: FACE.display, fontSize: 120, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{f >= sent ? n : 0}</div>
            <div style={{ fontFamily: ui(ko), fontSize: 32, color: "#C7CBFF", marginTop: 10 }}>{c.sentToday}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ width: 90, height: 16, borderRadius: 8, background: i < n && f >= sent ? "#8B5CF6" : "rgba(255,255,255,0.15)" }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, bottom: 20, width: 580, height: 26, borderRadius: 13, background: "#2E2C48" }} />
      </div>
    </>
  );
};

/* ================================================================== months: weeks riffle by, 11.9 */

export const Months: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const riffle = useEvent("riffle");
  const num = useEvent("num");
  const wk = Math.min(12, Math.max(1, Math.floor((f - riffle) / 2.4) + 1));
  const settled = f >= num;
  return (
    <>
      <div style={{ position: "absolute", left: 290, top: 420, width: 500, height: 560 }}>
        {/* torn pages flying off */}
        {Array.from({ length: 11 }, (_, i) => {
          const at = riffle + i * 2.4;
          const p = prog(f, at, 30, Easing.bezier(0.3, 0, 0.6, 1));
          if (p <= 0 || p >= 1) return null;
          return <div key={i} style={{ position: "absolute", inset: 0, borderRadius: 24, background: "#F5F1E6", transform: `translate(${p * (random(`pg${i}`) - 0.3) * 900}px, ${-p * 600}px) rotate(${p * (random(`pr${i}`) - 0.5) * 120}deg)`, opacity: 1 - p }} />;
        })}
        <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "#FBF8EF", boxShadow: "0 30px 60px rgba(0,0,0,0.35)", overflow: "hidden", textAlign: "center" }}>
          <div style={{ height: 110, background: "#7C3AED" }} />
          {settled ? (
            <In at={num} y={20} dur={14}>
              <div style={{ fontFamily: FACE.display, fontSize: 200, fontWeight: 700, color: "#1F1B33", letterSpacing: "-0.04em", marginTop: 40, lineHeight: 1 }}>{STAT.value}</div>
              <div style={{ fontFamily: ui(ko), fontSize: 60, fontWeight: 600, color: "#1F1B33" }}>{c.weeks}</div>
            </In>
          ) : (
            <div style={{ fontFamily: FACE.display, fontSize: 230, fontWeight: 700, color: "#1F1B33", marginTop: 60, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {f >= riffle ? wk : 1}
              <div style={{ fontFamily: ui(ko), fontSize: 48, fontWeight: 600, color: "#6B6488", marginTop: 10 }}>{c.week}</div>
            </div>
          )}
        </div>
      </div>
      <In at={num + 8} y={16} style={{ position: "absolute", left: 0, right: 0, top: 1040, textAlign: "center" }}>
        <div style={{ fontFamily: ui(ko), fontSize: 46, color: "#fff", fontWeight: 500 }}>{c.statLabel}</div>
        <div style={{ fontFamily: ui(ko), fontSize: 26, color: "rgba(255,255,255,0.65)", marginTop: 14 }}>{STAT.source[ko ? "ko" : "en"]}</div>
      </In>
    </>
  );
};

/* ================================================================== shift: the moon becomes Tahoe */

export const Shift: React.FC = () => {
  const f = useCurrentFrame();
  const mark = useEvent("mark");
  const p = prog(f, mark - 4, 22, Easing.bezier(0.2, 0.9, 0.3, 1.1));
  const ring = prog(f, mark, 40);
  return (
    <>
      <div style={{ position: "absolute", left: 540 - 140, top: 560 - 140, width: 280, height: 280, transform: `scale(${mix(0.6, 1, p)})`, opacity: p }}>
        <CatMark size={280} glow={1.2} ring="rgba(255,248,220,0.5)" />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={540} cy={560} r={mix(150, 420, ring)} fill="none" stroke="#FFF7DC" strokeWidth={3} opacity={(1 - ring) * 0.7 * (f >= mark ? 1 : 0)} />
      </svg>
      <In at={mark + 8} y={20} style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center" }}>
        <Wordmark size={120} color="#fff" spark="#FDE68A" />
      </In>
    </>
  );
};

/* ================================================================== morning: it picks matches and fills them in */

const JobRow: React.FC<{ title: string; meta: string; hue: string; ko: boolean; children?: React.ReactNode; style?: React.CSSProperties }> = ({ title, meta, hue, ko, children, style }) => (
  <div style={{ width: 900, boxSizing: "border-box", padding: "26px 30px", borderRadius: 32, background: "rgba(255,255,255,0.94)", boxShadow: "0 20px 50px rgba(30,20,60,0.25)", ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <div style={{ width: 78, height: 78, borderRadius: 20, background: hue, flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: ko ? FACE.kr : FACE.display, fontSize: 42, fontWeight: 600, color: "#1F1B33", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontFamily: ui(ko), fontSize: 27, color: "#6B6488", marginTop: 4 }}>{meta}</div>
      </div>
      {children}
    </div>
  </div>
);

const HUES = ["linear-gradient(135deg,#1D4ED8,#60A5FA)", "linear-gradient(135deg,#C2410C,#FB923C)", "linear-gradient(135deg,#0369A1,#38BDF8)"];

export const Morning: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const picks = useEvent("picks");
  const fills = useEvent("fills");
  const ready = useEvent("ready");
  return (
    <div style={{ position: "absolute", left: 90, top: 330 }}>
      {c.jobs.map((j, i) => {
        const p = prog(f, picks + i * 6, 16, Easing.bezier(0.2, 0.9, 0.3, 1.1));
        const fill = prog(f, fills + i * 5, 26, Easing.bezier(0.4, 0, 0.3, 1));
        const r = f >= ready + i * 4;
        return (
          <div key={j.title} style={{ marginBottom: 36, transform: `translateY(${(1 - p) * -200}px)`, opacity: p }}>
            <JobRow title={j.title} meta={j.meta} hue={HUES[i]} ko={ko}>
              <div style={{ fontFamily: ui(ko), fontSize: 24, fontWeight: 700, padding: "8px 16px", borderRadius: 999, background: r ? "#EDE9FE" : "#DCFCE7", color: r ? "#6D28D9" : "#15803D", whiteSpace: "nowrap" }}>{r ? c.ready : c.strong}</div>
            </JobRow>
            <div style={{ margin: "14px 30px 0", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.35)", overflow: "hidden" }}>
              <div style={{ width: `${fill * 100}%`, height: "100%", background: "#fff" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ================================================================== coffee: read each one, send the ones you like */

export const Coffee: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const phone = useEvent("phone");
  const send1 = useEvent("send1");
  const skip = useEvent("skip");
  const send2 = useEvent("send2");
  const p = prog(f, phone, 18, Easing.bezier(0.2, 0.9, 0.3, 1));
  const states = [f >= send1 ? "sent" : "ready", f >= skip ? "skip" : "ready", f >= send2 ? "sent" : "ready"];
  return (
    <>
      <div style={{ position: "absolute", left: 140, top: 300, width: 800, transform: `translateY(${(1 - p) * 400}px)`, opacity: p }}>
        <div style={{ borderRadius: 60, background: "#141221", padding: 22, boxShadow: "0 40px 80px rgba(40,20,10,0.35)" }}>
          <div style={{ borderRadius: 42, background: "#F7F5FF", padding: "40px 30px", minHeight: 860 }}>
            <div style={{ fontFamily: FACE.display, fontSize: 40, fontWeight: 600, color: "#1F1B33", textAlign: "center", marginBottom: 30 }}>{c.morning}</div>
            {c.jobs.map((j, i) => {
              const s = states[i];
              return (
                <div key={j.title} style={{ marginBottom: 24, opacity: s === "skip" ? 0.4 : 1 }}>
                  <div style={{ padding: "24px 24px", borderRadius: 28, background: "#fff", boxShadow: "0 8px 20px rgba(30,20,60,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: HUES[i], flex: "none" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: ko ? FACE.kr : FACE.display, fontSize: 34, fontWeight: 600, color: "#1F1B33", whiteSpace: "nowrap" }}>{j.title}</div>
                        <div style={{ fontFamily: ui(ko), fontSize: 24, color: "#6B6488", marginTop: 2, whiteSpace: "nowrap" }}>{j.meta}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 18 }}>
                      {s === "sent" ? (
                        <div style={{ flex: 1, height: 70, borderRadius: 35, background: "#16A34A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: ui(ko), fontSize: 30, fontWeight: 700 }}>
                          <Check size={40} p={1} width={3.4} />
                          {c.sent}
                        </div>
                      ) : (
                        <>
                          <div style={{ flex: 1, height: 70, borderRadius: 35, background: "#EFEDF6", color: "#4B4566", display: "grid", placeItems: "center", fontFamily: ui(ko), fontSize: 30, fontWeight: 600 }}>{c.skip}</div>
                          <div style={{ flex: 1.4, height: 70, borderRadius: 35, background: "#7C3AED", color: "#fff", display: "grid", placeItems: "center", fontFamily: ui(ko), fontSize: 30, fontWeight: 700 }}>{c.send}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* the mug on the sill, steam curling */}
      <div style={{ position: "absolute", left: 120, top: 1330, width: 150, height: 170 }}>
        <svg width={150} height={300} style={{ position: "absolute", left: 0, top: -200, overflow: "visible" }}>
          {[0, 1, 2].map((i) => {
            const y0 = 190 - ((f * 1.6 + i * 40) % 160);
            return <path key={i} d={`M${50 + i * 22} ${y0 + 60} C ${30 + i * 22} ${y0 + 30}, ${70 + i * 22} ${y0 + 20}, ${50 + i * 22} ${y0}`} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.35 * Math.min(1, (y0 + 20) / 120)} />;
          })}
        </svg>
        <div style={{ position: "absolute", left: 0, bottom: 0, width: 130, height: 150, borderRadius: "14px 14px 40px 40px", background: "#F4EDE4" }} />
        <div style={{ position: "absolute", left: 112, bottom: 50, width: 50, height: 60, borderRadius: 30, border: "12px solid #F4EDE4", borderLeftColor: "transparent" }} />
      </div>
    </>
  );
};

/* ================================================================== close: morning */

export const Close: React.FC = () => {
  const c = useCopy();
  const ko = useLang() === "ko";
  const { durationInFrames } = useSceneData();
  const lockup = useEvent("lockup");
  const line = useEvent("line");
  return (
    <>
      <In at={6} y={30} style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center" }}>
        <CatMark size={210} glow={0.8} ring="rgba(255,255,255,0.5)" />
      </In>
      <In at={12} y={24} style={{ position: "absolute", left: 0, right: 0, top: 720, display: "flex", justifyContent: "center" }}>
        <Wordmark size={124} color="#fff" spark="#7C3AED" />
      </In>
      <In at={lockup} y={20} style={{ position: "absolute", left: 120, right: 120, top: 940, textAlign: "center", fontFamily: ui(ko), fontSize: 46, lineHeight: 1.35, color: "#2A1F3D", fontWeight: 600 }}>
        {c.end}
      </In>
      <In at={Math.min(line, durationInFrames - 30)} y={10} style={{ position: "absolute", left: 0, right: 0, top: 1060, display: "flex", justifyContent: "center" }}>
        <WorkOnward size={28} />
      </In>
    </>
  );
};

export const NIGHT_SCENES: Record<string, React.FC> = { late: Late, months: Months, shift: Shift, morning: Morning, coffee: Coffee, close: Close };
