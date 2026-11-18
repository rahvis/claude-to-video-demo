import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { mix, prog } from "../lib/motion";
import { clamp } from "../seeker/theme";
import { beatFrame, sceneSpan, useLang, useReel } from "../reel/Film";
import { CatMark, FACE, WorkOnward, Wordmark } from "../reel/kit";
import { STAT, useCopy } from "./copy";

// "Blueprint" (Auto Apply reel, 9:16). A technical drawing, white and cyan line art on blueprint blue, one vertical
// sheet the camera tracks down in a single scroll (the reel's backdrop; scenes add nothing of their own). Stations:
// title block; 40% of job seekers padded a resume (Greenhouse, Oct 2026); 01 the resume is reordered and reworded,
// nothing added; 02 the employer's own form, every answer sourced; 03 your approval closes the switch; 04 one
// application per company per 30 days; the receipt; the end card.

const B = { blue: "#0B3A8C", blue2: "#082B69", line: "#E8F4FF", cyan: "#7FDBFF", dim: "rgba(232,244,255,0.45)", red: "#FF7A7A", grid: "rgba(255,255,255,0.07)", grid2: "rgba(255,255,255,0.14)" };
const IDS = ["how", "stat", "resume", "form", "approve", "close"];
const GAP = 1500;
const mono = (ko: boolean) => (ko ? FACE.kr : FACE.mono);

/** Stroke that draws itself (any SVG shape: pathLength 1). */
const draw = (p: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - Math.max(0, Math.min(1, p)) });

const Label: React.FC<{ x: number; y: number; p: number; size?: number; color?: string; weight?: number; ko: boolean; children: React.ReactNode; anchor?: "start" | "middle" | "end"; mono?: boolean }> = ({
  x,
  y,
  p,
  size = 34,
  color = B.line,
  weight = 400,
  ko,
  children,
  anchor = "start",
  mono: m = true,
}) => (
  <text x={x} y={y + (1 - p) * 14} fill={color} opacity={p} fontFamily={m ? mono(ko) : ko ? FACE.kr : FACE.text} fontSize={size} fontWeight={weight} textAnchor={anchor}>
    {children}
  </text>
);

const Step: React.FC<{ n: number; text: string; y: number; p: number; ko: boolean }> = ({ n, text, y, p, ko }) => (
  <g>
    <circle cx={150} cy={y - 14} r={46} fill="none" stroke={B.cyan} strokeWidth={4} {...draw(p * 1.4)} />
    <Label x={150} y={y + 2} p={p} size={40} color={B.cyan} weight={700} ko={false} anchor="middle">
      {`0${n}`}
    </Label>
    <Label x={220} y={y} p={p} size={ko ? 38 : 34} weight={700} ko={ko}>
      {text}
    </Label>
  </g>
);

/** A resume, drawn: outline, a photo circle, lines. `order` swaps bars 1 and 3 as it goes 0 -> 1. */
const ResumeSketch: React.FC<{ x: number; y: number; p: number; order?: number; fakes?: number; scale?: number }> = ({ x, y, p, order = 0, fakes = 0, scale = 1 }) => {
  const rows = [0, 1, 2, 3, 4];
  const yOf = (i: number) => {
    if (i === 1) return mix(1, 3, order);
    if (i === 3) return mix(3, 1, order);
    return i;
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={0} y={0} width={300} height={400} rx={14} fill="none" stroke={B.line} strokeWidth={4} {...draw(p)} />
      <circle cx={60} cy={64} r={30} fill="none" stroke={B.line} strokeWidth={3} {...draw(p * 1.2 - 0.2)} />
      <line x1={110} y1={54} x2={250} y2={54} stroke={B.line} strokeWidth={6} strokeLinecap="round" {...draw(p * 1.3 - 0.3)} />
      <line x1={110} y1={80} x2={200} y2={80} stroke={B.dim} strokeWidth={5} strokeLinecap="round" {...draw(p * 1.3 - 0.3)} />
      {rows.map((i) => (
        <line key={i} x1={36} y1={140 + yOf(i) * 46} x2={i % 2 ? 230 : 264} y2={140 + yOf(i) * 46} stroke={i === 1 || i === 3 ? B.cyan : B.dim} strokeWidth={8} strokeLinecap="round" {...draw(p * 1.5 - 0.4 - i * 0.06)} />
      ))}
      {fakes > 0
        ? [0, 1].map((i) => <line key={`f${i}`} x1={36} y1={140 + (5 + i) * 46 - 6} x2={200 - i * 40} y2={140 + (5 + i) * 46 - 6} stroke={B.red} strokeWidth={8} strokeLinecap="round" strokeDasharray="14 10" opacity={fakes} />)
        : null}
    </g>
  );
};

export const Sheet: React.FC = () => {
  const f = useCurrentFrame();
  const info = useReel();
  const c = useCopy();
  const ko = useLang() === "ko";
  const t = (s: string, n: string) => beatFrame(info, s, n);
  const starts = IDS.map((id) => sceneSpan(info, id)[0]);

  // camera: glide to each station as its scene starts
  let cy = 0;
  for (let i = 1; i < IDS.length; i++) cy += GAP * prog(f, starts[i] - 14, 26, Easing.bezier(0.6, 0, 0.25, 1));
  const Y = (station: number, y: number) => 900 + station * GAP + y - cy;
  const at = (i: number, delay = 0, dur = 24) => prog(f, starts[i] + delay, dur, Easing.bezier(0.3, 0, 0.2, 1));

  // beats
  const title = t("how", "title");
  const never = t("how", "never");
  const num = t("stat", "num");
  const padded = t("stat", "padded");
  const mark = t("resume", "mark");
  const swap = t("resume", "swap");
  const block = t("resume", "block");
  const fill = t("form", "fill");
  const sources = t("form", "sources");
  const gate = t("approve", "gate");
  const flow = t("approve", "flow");
  const cal = t("approve", "cal");
  const lockup = t("close", "lockup");
  const line = t("close", "line");

  const pct = Math.round(interpolate(f, [num, num + 30], [0, STAT.value], { ...clamp, easing: Easing.bezier(0.3, 0, 0.3, 1) }));
  const packet = (k: number) => {
    // a dot that runs down the pipe between station k and k+1 during the glide
    const p = prog(f, starts[k + 1] - 14, 26, Easing.bezier(0.6, 0, 0.25, 1));
    return p > 0 && p < 1 ? <circle cx={540} cy={Y(k, 600) + p * (GAP - 1200)} r={12} fill={B.cyan} /> : null;
  };
  const fakeX = mix(-80, 0, prog(f, block - 14, 14)) + (f > block ? -Math.sin(Math.min(1, (f - block) / 14) * Math.PI) * 60 : 0);

  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 70% at 50% 40%, ${B.blue} 0%, ${B.blue2} 100%)`, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* grid, scrolling with the camera */}
        <g transform={`translate(0 ${-(cy % 150)})`}>
          {Array.from({ length: 70 }, (_, i) => (
            <line key={`gy${i}`} x1={0} y1={i * 30} x2={1080} y2={i * 30} stroke={i % 5 ? B.grid : B.grid2} strokeWidth={i % 5 ? 1 : 2} />
          ))}
          {Array.from({ length: 37 }, (_, i) => (
            <line key={`gx${i}`} x1={i * 30} y1={0} x2={i * 30} y2={2100} stroke={i % 5 ? B.grid : B.grid2} strokeWidth={i % 5 ? 1 : 2} />
          ))}
        </g>
        {/* the pipe between stations */}
        {IDS.slice(0, -1).map((_, k) => (
          <g key={`pipe${k}`}>
            <line x1={540} y1={Y(k, 600)} x2={540} y2={Y(k + 1, -600)} stroke={B.dim} strokeWidth={4} strokeDasharray="16 12" />
            {packet(k)}
          </g>
        ))}

        {/* 0: title block */}
        <g>
          <rect x={90} y={Y(0, -420)} width={900} height={420} fill="none" stroke={B.line} strokeWidth={5} {...draw(at(0, 0, 30))} />
          <line x1={90} y1={Y(0, -150)} x2={990} y2={Y(0, -150)} stroke={B.line} strokeWidth={3} {...draw(at(0, 10, 20))} />
          <line x1={700} y1={Y(0, -150)} x2={700} y2={Y(0, 0)} stroke={B.line} strokeWidth={3} {...draw(at(0, 14, 16))} />
          <Label x={130} y={Y(0, -250)} p={prog(f, title, 16)} size={ko ? 110 : 120} weight={700} ko={ko}>
            {c.title}
          </Label>
          <Label x={130} y={Y(0, -60)} p={prog(f, title + 8, 16)} size={44} ko={ko} color={B.cyan}>
            {c.sheet}
          </Label>
          {/* document -> building schematic */}
          <rect x={150} y={Y(0, 120)} width={250} height={330} rx={12} fill="none" stroke={B.line} strokeWidth={4} {...draw(at(0, 18, 24))} />
          <line x1={440} y1={Y(0, 285)} x2={620} y2={Y(0, 285)} stroke={B.cyan} strokeWidth={6} {...draw(at(0, 30, 16))} />
          <path d={`M606 ${Y(0, 268)} L630 ${Y(0, 285)} L606 ${Y(0, 302)}`} fill="none" stroke={B.cyan} strokeWidth={5} {...draw(at(0, 40, 8))} />
          <path d={`M660 ${Y(0, 450)} L660 ${Y(0, 180)} L800 ${Y(0, 120)} L940 ${Y(0, 180)} L940 ${Y(0, 450)} Z`} fill="none" stroke={B.line} strokeWidth={4} {...draw(at(0, 34, 26))} />
          {/* "what it will never do": a red boundary line */}
          <line x1={120} y1={Y(0, 530)} x2={120 + 840 * prog(f, never, 18)} y2={Y(0, 530)} stroke={B.red} strokeWidth={5} strokeDasharray="22 12" />
        </g>

        {/* 1: the stat */}
        <g>
          <text x={110} y={Y(1, -230)} fill={B.line} fontFamily={FACE.mono} fontSize={300} fontWeight={700} opacity={prog(f, num - 4, 10)}>
            {pct}%
          </text>
          <line x1={110} y1={Y(1, -190)} x2={110 + 760 * prog(f, num + 10, 24)} y2={Y(1, -190)} stroke={B.cyan} strokeWidth={4} />
          <Label x={110} y={Y(1, -100)} p={prog(f, num + 16, 16)} size={ko ? 42 : 40} ko={ko} mono={false}>
            {c.statLabel[0]}
          </Label>
          <Label x={110} y={Y(1, -46)} p={prog(f, num + 20, 16)} size={ko ? 42 : 40} ko={ko} mono={false} weight={600}>
            {c.statLabel[1]}
          </Label>
          <Label x={110} y={Y(1, 20)} p={prog(f, num + 26, 16)} size={26} color={B.dim} ko={ko} mono={false}>
            {STAT.source[ko ? "ko" : "en"]}
          </Label>
          <ResumeSketch x={350} y={Y(1, 90)} p={at(1, 6, 36)} fakes={prog(f, padded, 14)} scale={1.25} />
        </g>

        {/* 2: resume, reordered and reworded, nothing added */}
        <g>
          <Step n={1} text={c.step1} y={Y(2, -470)} p={at(2, 4, 20)} ko={ko} />
          <ResumeSketch x={80} y={Y(2, -370)} p={at(2, 6, 30)} scale={1.25} />
          <line x1={472} y1={Y(2, -120)} x2={598} y2={Y(2, -120)} stroke={B.cyan} strokeWidth={5} {...draw(prog(f, swap - 6, 12))} />
          <path d={`M582 ${Y(2, -136)} L604 ${Y(2, -120)} L582 ${Y(2, -104)}`} fill="none" stroke={B.cyan} strokeWidth={5} {...draw(prog(f, swap, 6))} />
          <ResumeSketch x={625} y={Y(2, -370)} p={prog(f, swap - 4, 26)} order={prog(f, swap + 8, 20, Easing.bezier(0.5, 0, 0.3, 1))} scale={1.25} />
          {/* the barrier and the fake skill bouncing off it */}
          <line x1={625} y1={Y(2, 200)} x2={1000} y2={Y(2, 200)} stroke={B.red} strokeWidth={6} {...draw(prog(f, block - 18, 12))} />
          <g transform={`translate(${fakeX} 0)`} opacity={prog(f, block - 18, 8) * (1 - prog(f, block + 26, 12))}>
            <rect x={600} y={Y(2, 240)} width={ko ? 360 : 380} height={66} rx={33} fill="none" stroke={B.red} strokeWidth={4} strokeDasharray="12 8" />
            <Label x={620 + (ko ? 180 : 190) - 20} y={Y(2, 284)} p={1} size={28} color={B.red} ko={ko} anchor="middle" mono={false}>
              {c.fake}
            </Label>
          </g>
          {f >= block ? (
            <g opacity={prog(f, block, 8)}>
              <line x1={760} y1={Y(2, 246)} x2={820} y2={Y(2, 300)} stroke={B.red} strokeWidth={8} strokeLinecap="round" />
              <line x1={820} y1={Y(2, 246)} x2={760} y2={Y(2, 300)} stroke={B.red} strokeWidth={8} strokeLinecap="round" />
            </g>
          ) : null}
          <Label x={90} y={Y(2, 290)} p={prog(f, block + 6, 16)} size={48} weight={700} color={B.red} ko={ko}>
            {c.step1b}
          </Label>
        </g>

        {/* 3: the employer's form, every answer sourced */}
        <g>
          <Step n={2} text={c.step2} y={Y(3, -470)} p={at(3, 4, 20)} ko={ko} />
          <rect x={110} y={Y(3, -380)} width={520} height={720} rx={18} fill="none" stroke={B.line} strokeWidth={4} {...draw(at(3, 6, 26))} />
          {c.fields.map((fl, i) => {
            const fy = Y(3, -320 + i * 168);
            const fp = prog(f, fill + i * 6, 12);
            const sp = prog(f, sources + i * 5, 12);
            return (
              <g key={fl}>
                <Label x={140} y={fy} p={at(3, 10 + i * 3, 14)} size={ko ? 28 : 26} color={B.dim} ko={ko}>
                  {fl}
                </Label>
                <rect x={140} y={fy + 16} width={460} height={76} rx={10} fill={fp > 0 ? "rgba(127,219,255,0.08)" : "none"} stroke={B.line} strokeWidth={3} {...draw(at(3, 12 + i * 3, 16))} />
                <line x1={162} y1={fy + 54} x2={162 + 320 * fp} y2={fy + 54} stroke={B.cyan} strokeWidth={10} strokeLinecap="round" />
                {/* leader line to the source */}
                <path d={`M600 ${fy + 54} L680 ${fy + 54} L700 ${fy + 34}`} fill="none" stroke={B.cyan} strokeWidth={3} {...draw(sp)} />
                <Label x={712} y={fy + 40} p={sp} size={ko ? 30 : 28} color={B.cyan} ko={ko}>
                  {c.srcs[i]}
                </Label>
              </g>
            );
          })}
        </g>

        {/* 4: your approval closes the switch; one per company per 30 days */}
        <g>
          <Step n={3} text={c.step3} y={Y(4, -470)} p={at(4, 4, 20)} ko={ko} />
          <line x1={540} y1={Y(4, -400)} x2={540} y2={Y(4, -260)} stroke={B.line} strokeWidth={5} />
          <circle cx={540} cy={Y(4, -250)} r={12} fill={B.line} />
          {/* the lever: open (30 deg) until approved */}
          <line x1={540} y1={Y(4, -250)} x2={540 + Math.sin((mix(36, 0, prog(f, gate, 8, Easing.bezier(0.5, 0, 0.2, 1.4))) * Math.PI) / 180) * 150} y2={Y(4, -250) + Math.cos((mix(36, 0, prog(f, gate, 8)) * Math.PI) / 180) * 150} stroke={B.cyan} strokeWidth={12} strokeLinecap="round" />
          <circle cx={540} cy={Y(4, -100)} r={12} fill={B.line} />
          <line x1={540} y1={Y(4, -100)} x2={540} y2={Y(4, 10)} stroke={prog(f, flow, 10) > 0 ? B.cyan : B.dim} strokeWidth={5} strokeDasharray="14 10" strokeDashoffset={-f * 2} />
          <rect x={360} y={Y(4, -300)} width={360} height={260} rx={16} fill="none" stroke={B.dim} strokeWidth={2} strokeDasharray="10 10" opacity={at(4, 10, 14)} />
          <Label x={740} y={Y(4, -160)} p={prog(f, gate - 10, 12)} size={48} weight={700} color={B.cyan} ko={ko}>
            {c.approve}
          </Label>
          {/* step 4: a 30-day strip, one dot per company */}
          <Step n={4} text={c.step4} y={Y(4, 160)} p={prog(f, cal - 8, 18)} ko={ko} />
          {Array.from({ length: 30 }, (_, d) => (
            <rect key={d} x={110 + d * 29} y={Y(4, 230)} width={24} height={60} rx={5} fill="none" stroke={B.dim} strokeWidth={2} opacity={prog(f, cal - 4 + d * 0.5, 8)} />
          ))}
          <circle cx={122} cy={Y(4, 260)} r={10} fill={B.cyan} opacity={prog(f, cal + 10, 8)} />
          <line x1={122} y1={Y(4, 320)} x2={122 + 29 * 29 * prog(f, cal + 14, 30, Easing.linear)} y2={Y(4, 320)} stroke={B.cyan} strokeWidth={4} />
          <path d={`M${122 + 29 * 29 - 14} ${Y(4, 306)} L${122 + 29 * 29 + 2} ${Y(4, 320)} L${122 + 29 * 29 - 14} ${Y(4, 334)}`} fill="none" stroke={B.cyan} strokeWidth={4} opacity={prog(f, cal + 42, 6)} />
        </g>

        {/* 5: the receipt */}
        <g>
          <path d={`M300 ${Y(5, -560)} L780 ${Y(5, -560)} L780 ${Y(5, -150)} ${Array.from({ length: 12 }, (_, i) => `L${780 - (i + 0.5) * 40} ${Y(5, i % 2 ? -150 : -126)}`).join(" ")} L300 ${Y(5, -150)} Z`} fill="none" stroke={B.line} strokeWidth={4} {...draw(at(5, 0, 28))} />
          <Label x={340} y={Y(5, -490)} p={at(5, 10, 14)} size={40} weight={700} ko={ko}>
            {c.receipt}
          </Label>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={340 + i * 140} y={Y(5, -440)} width={120} height={180} rx={10} fill="none" stroke={B.cyan} strokeWidth={3} {...draw(at(5, 14 + i * 4, 16))} />
          ))}
          <Label x={340} y={Y(5, -200)} p={at(5, 26, 14)} size={26} color={B.dim} ko={ko}>
            {c.screens}
          </Label>
        </g>
      </svg>
      {/* end card over the last station */}
      <div style={{ position: "absolute", left: 0, right: 0, top: Y(5, 0) - 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 30, opacity: prog(f, lockup - 26, 16) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <CatMark size={140} glow={0.6} ring="rgba(127,219,255,0.5)" />
          <Wordmark size={120} color="#fff" spark={B.cyan} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 100, right: 100, top: Y(5, 220), textAlign: "center", fontFamily: ko ? FACE.kr : FACE.mono, fontSize: ko ? 44 : 42, color: B.line, opacity: prog(f, lockup, 14), transform: `translateY(${(1 - prog(f, lockup, 14)) * 16}px)` }}>{c.end}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: Y(5, 420), display: "flex", justifyContent: "center", opacity: prog(f, line, 12) * 0.85, filter: "brightness(0) invert(1)" }}>
        <WorkOnward size={28} />
      </div>
    </div>
  );
};

const Nothing: React.FC = () => null;
export const BLUEPRINT_SCENES: Record<string, React.FC> = { how: Nothing, stat: Nothing, resume: Nothing, form: Nothing, approve: Nothing, close: Nothing };
// The brand moment is in the title block of station 2: Tahoe's mark stamps in when the narration names Tahoe.
export const BlueprintMark: React.FC = () => {
  const f = useCurrentFrame();
  const info = useReel();
  const mark = beatFrame(info, "resume", "mark");
  const [from] = sceneSpan(info, "resume");
  const [toFrom] = sceneSpan(info, "form");
  const p = prog(f, mark, 12, Easing.bezier(0.2, 0.9, 0.3, 1.4));
  const gone = prog(f, toFrom - 14, 14);
  if (f < from) return null;
  return (
    <div style={{ position: "absolute", right: 70, top: 1250, transform: `scale(${p}) rotate(${mix(-12, -4, p)}deg)`, opacity: p * (1 - gone), display: "flex", alignItems: "center", gap: 16, padding: "14px 22px", border: `4px solid ${B.cyan}`, borderRadius: 20 }}>
      <CatMark size={70} glow={0.3} />
      <Wordmark size={54} color="#fff" spark={B.cyan} />
    </div>
  );
};
