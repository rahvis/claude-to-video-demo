import React from "react";
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { mix, prog } from "../lib/motion";
import { useEvent, useSceneData } from "../lib/scene";
import { clamp } from "../seeker/theme";
import { useLang } from "../reel/Film";
import { CatMark, FACE, In, WorkOnward, Wordmark } from "../reel/kit";
import { NUM, useCopy } from "./copy";

// "Say It Plainly" (search reel, 9:16). Swiss poster: strict grid, giant grotesk, cobalt / signal orange /
// sunflower, hard cuts on the beat (src/reel/shells.tsx Cut). A wall of forty filters falls down; one plain
// sentence typed like a text; the chips Tahoe understood; matches; 5M+ jobs and 220K+ career sites; say it plainly.

const S = { paper: "#F7F6F1", ink: "#111111", cobalt: "#1F3BFF", orange: "#FF5B1F", sun: "#FFC93C", grey: "#9A9A93", line: "rgba(17,17,17,0.12)" };
const disp = (ko: boolean) => (ko ? FACE.kr : FACE.display);
const txt = (ko: boolean) => (ko ? FACE.kr : FACE.text);

/** The 12-column grid every scene sits on (faint). */
const Grid: React.FC<{ color?: string }> = ({ color = S.line }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    {Array.from({ length: 13 }, (_, i) => (
      <line key={i} x1={60 + i * 80} y1={0} x2={60 + i * 80} y2={1920} stroke={color} strokeWidth={1.5} />
    ))}
  </svg>
);

const Fill: React.FC<{ bg: string; children: React.ReactNode }> = ({ bg, children }) => <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>{children}</div>;

/* ================================================================== boxes: forty filters, then they fall */

export const Boxes: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const wall = useEvent("wall");
  const forty = useEvent("forty");
  const fall = useEvent("collapse");
  const items = [];
  // 2 columns x 10 rows; each row is a checkbox and a dropdown: 40 controls in all
  for (let i = 0; i < 40; i++) {
    const k = Math.floor(i / 2);
    const isBox = i % 2 === 0;
    const col = k % 2;
    const row = Math.floor(k / 2);
    const at = wall + i * 1.2;
    const p = prog(f, at, 8, Easing.bezier(0.2, 0.9, 0.3, 1.3));
    const g = f > fall ? Math.pow((f - fall - random(`d${i}`) * 6) / 10, 2) : 0;
    const y = 300 + row * 118 + Math.max(0, g) * 60;
    const x = 60 + col * 500;
    const rot = Math.max(0, g) * (random(`r${i}`) - 0.5) * 30;
    if (p <= 0) continue;
    items.push(
      isBox ? (
        <div key={i} style={{ position: "absolute", left: x, top: y + 20, width: 52, height: 52, transform: `scale(${p}) rotate(${rot}deg)`, border: `5px solid ${S.ink}`, borderRadius: 8, boxSizing: "border-box", background: random(`cb${i}`) < 0.35 ? S.ink : "#fff" }} />
      ) : (
        <div key={i} style={{ position: "absolute", left: x + 70, top: y, width: 390, height: 92, transform: `scale(${p}) rotate(${rot}deg)`, transformOrigin: "50% 50%", border: `4px solid ${S.ink}`, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", boxSizing: "border-box", fontFamily: txt(ko), fontSize: 33, fontWeight: 600, color: S.ink, whiteSpace: "nowrap" }}>
          {c.filters[k]}
          <svg width={26} height={18} viewBox="0 0 26 18">
            <path d="M3 4 L13 14 L23 4" fill="none" stroke={S.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
    );
  }
  const n = Math.min(40, Math.max(0, Math.floor((f - wall) / 1.2) + 1));
  const big = prog(f, forty, 8, Easing.bezier(0.2, 0.9, 0.3, 1.4));
  return (
    <Fill bg={S.paper}>
      <Grid />
      {items}
      {f >= wall ? (
        <div style={{ position: "absolute", right: 60, top: 1250, fontFamily: FACE.display, fontWeight: 700, fontSize: mix(120, 300, big), lineHeight: 1, color: S.orange, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums", transform: `translateY(${f > fall ? Math.pow(Math.max(0, f - fall - 4) / 10, 2) * 60 : 0}px)` }}>
          {n}
        </div>
      ) : null}
    </Fill>
  );
};

/* ================================================================== friend: type it like a text */

export const Friend: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCopy();
  const ko = useLang() === "ko";
  const mark = useEvent("mark");
  const type = useEvent("type");
  const full = c.query.join("\n");
  const shown = Math.max(0, Math.min(full.length, Math.floor((f - type) / (ko ? 1.6 : 1.1))));
  const lines = full.slice(0, shown).split("\n");
  const sp = spring({ frame: f, fps, config: { damping: 14, stiffness: 140 } });
  const blink = Math.floor(f / 9) % 2 === 0 || shown < full.length;
  return (
    <Fill bg={S.cobalt}>
      <Grid color="rgba(255,255,255,0.12)" />
      <div style={{ position: "absolute", left: 60, top: 300, transform: `scale(${prog(f, mark, 10, Easing.bezier(0.2, 0.9, 0.3, 1.3))})`, transformOrigin: "0 50%", display: "flex", alignItems: "center", gap: 26 }}>
        <CatMark size={120} glow={0.5} />
        <Wordmark size={110} color="#fff" spark={S.sun} />
      </div>
      <div style={{ position: "absolute", left: 60, top: 620, width: 960, height: 420, background: "#fff", borderRadius: 40, transform: `translateY(${(1 - sp) * 300}px)`, padding: "56px 56px", boxSizing: "border-box", boxShadow: `18px 18px 0 ${S.ink}` }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: disp(ko), fontSize: ko ? 68 : 76, fontWeight: 600, color: S.ink, letterSpacing: ko ? "-0.03em" : "-0.03em", lineHeight: 1.25, whiteSpace: "nowrap" }}>
            {l}
            {i === lines.length - 1 && blink ? <span style={{ display: "inline-block", width: 7, height: ko ? 72 : 80, background: S.cobalt, marginLeft: 6, verticalAlign: "middle" }} /> : null}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 60, top: 1130, width: 960, height: 24, background: S.sun, transformOrigin: "0 50%", transform: `scaleX(${prog(f, type, 50, Easing.linear)})` }} />
    </Fill>
  );
};

/* ================================================================== read: what Tahoe understood, then the jobs */

export const Read: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const split = useEvent("split");
  const understood = useEvent("understood");
  const results = useEvent("results");
  const chipColors = [S.cobalt, S.orange, S.sun];
  const chipInk = ["#fff", "#fff", S.ink];
  const lift = prog(f, results - 4, 14, Easing.bezier(0.6, 0, 0.2, 1));
  return (
    <Fill bg={S.paper}>
      <Grid />
      {/* the sentence, small, at the top; it breaks apart into chips */}
      <div style={{ position: "absolute", left: 60, top: 290, fontFamily: disp(ko), fontSize: 44, fontWeight: 600, color: S.ink, opacity: 1 - prog(f, split, 12), lineHeight: 1.3 }}>
        {c.query.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 60, top: mix(330, 290, lift), opacity: prog(f, split + 4, 10) }}>
        <div style={{ fontFamily: txt(ko), fontSize: 34, fontWeight: 600, color: S.grey, marginBottom: 22 }}>{c.understood}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {c.chips.map((chip, i) => {
            const p = prog(f, understood + i * 4, 10, Easing.bezier(0.2, 0.9, 0.3, 1.4));
            return (
              <div key={chip} style={{ alignSelf: "flex-start", transform: `translateX(${(1 - p) * -500}px) scale(${mix(1, 0.62, lift)})`, transformOrigin: "0 0", marginBottom: mix(0, -40, lift), padding: "22px 40px", borderRadius: 999, background: chipColors[i], color: chipInk[i], fontFamily: disp(ko), fontSize: 64, fontWeight: 700, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                {chip}
              </div>
            );
          })}
        </div>
      </div>
      {/* results: three rows, indexed */}
      {c.results.map((r, i) => {
        const p = prog(f, results + i * 5, 12, Easing.bezier(0.2, 0.9, 0.3, 1));
        return (
          <div key={r.title} style={{ position: "absolute", left: 60, top: 760 + i * 230, width: 960, height: 200, transform: `translateX(${(1 - p) * 1100}px)`, borderTop: `6px solid ${S.ink}`, display: "flex", alignItems: "center", gap: 34 }}>
            <div style={{ fontFamily: FACE.mono, fontSize: 64, fontWeight: 700, color: chipColors[i], width: 110 }}>0{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: disp(ko), fontSize: 52, fontWeight: 700, color: S.ink, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{r.title}</div>
              <div style={{ fontFamily: txt(ko), fontSize: 32, color: "#55554F", marginTop: 6 }}>{r.meta}</div>
            </div>
          </div>
        );
      })}
    </Fill>
  );
};

/* ================================================================== count: 5M+, then 220K+ (a cut inside the scene) */

export const Count: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const big = useEvent("big");
  const cut = useEvent("cut2");
  const second = f >= cut;
  const pop = (at: number) => prog(f, at, 9, Easing.bezier(0.2, 0.9, 0.3, 1.5));
  const bar = (at: number) => prog(f, at + 4, 20, Easing.bezier(0.4, 0, 0.2, 1));
  if (!second)
    return (
      <Fill bg={S.sun}>
        <Grid />
        <div style={{ position: "absolute", left: 40, top: 430, fontFamily: disp(ko), fontWeight: 800, fontSize: ko ? 300 : 470, lineHeight: 1, color: S.ink, letterSpacing: "-0.06em", whiteSpace: "nowrap", transform: `scale(${pop(big)})`, transformOrigin: "0 100%" }}>{ko ? NUM.rolesKo : NUM.roles}</div>
        <div style={{ position: "absolute", left: 60, top: 1010, height: 26, width: 960 * bar(big), background: S.ink }} />
        <In at={big + 8} y={20} style={{ position: "absolute", left: 60, top: 1080, fontFamily: disp(ko), fontSize: 84, fontWeight: 700, color: S.ink, letterSpacing: "-0.03em" }}>
          {c.rolesLabel}
        </In>
        <div style={{ position: "absolute", right: -160, top: 1240, width: 520, height: 520, borderRadius: "50%", background: S.orange, transform: `scale(${pop(big + 6)})` }} />
      </Fill>
    );
  return (
    <Fill bg={S.orange}>
      <Grid color="rgba(255,255,255,0.14)" />
      <div style={{ position: "absolute", left: -120, top: 260, width: 460, height: 460, borderRadius: "50%", background: S.cobalt, transform: `scale(${pop(cut + 4)})` }} />
      <div style={{ position: "absolute", left: 44, top: 700, fontFamily: FACE.display, fontWeight: 800, fontSize: 320, lineHeight: 1, color: "#fff", letterSpacing: "-0.06em", transform: `scale(${pop(cut)})`, transformOrigin: "0 100%" }}>{NUM.sites}</div>
      <div style={{ position: "absolute", left: 60, top: 1080, height: 26, width: 960 * bar(cut), background: "#fff" }} />
      <In at={cut + 8} y={20} style={{ position: "absolute", left: 60, top: 1150, fontFamily: disp(ko), fontSize: 80, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>
        {c.sitesLabel}
      </In>
    </Fill>
  );
};

/* ================================================================== close */

export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const { durationInFrames } = useSceneData();
  const lockup = useEvent("lockup");
  const line = useEvent("line");
  const slab = prog(f, 0, 14, Easing.bezier(0.4, 0, 0.2, 1));
  const drift = interpolate(f, [0, durationInFrames], [0, -30], clamp);
  return (
    <Fill bg="#fff">
      <Grid />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 230 + 210 * slab, background: S.cobalt }} />
      <div style={{ position: "absolute", left: 60, top: 300, display: "flex", alignItems: "center", gap: 28, transform: `translateY(${drift}px)` }}>
        <CatMark size={150} glow={0.6} />
        <Wordmark size={150} color="#fff" spark={S.sun} />
      </div>
      <div style={{ position: "absolute", left: 620, top: 620, width: 680, height: 680, borderRadius: "50%", background: S.sun, transform: `scale(${prog(f, 4, 16, Easing.bezier(0.2, 0.9, 0.3, 1.2))})` }} />
      <In at={lockup} y={30} style={{ position: "absolute", left: 60, top: 820 }}>
        <div style={{ display: "inline-block", padding: "34px 44px", background: S.orange, color: "#fff", fontFamily: disp(ko), fontSize: 68, fontWeight: 700, letterSpacing: "-0.02em", boxShadow: `14px 14px 0 ${S.ink}` }}>{c.trial}</div>
      </In>
      <In at={line} y={10} style={{ position: "absolute", left: 60, top: 1380 }}>
        <WorkOnward size={28} />
      </In>
    </Fill>
  );
};

export const PLAINLY_SCENES: Record<string, React.FC> = { boxes: Boxes, friend: Friend, read: Read, count: Count, close: Close };
