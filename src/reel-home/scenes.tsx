import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Counter, mix, prog } from "../lib/motion";
import { useEvent } from "../lib/scene";
import { beatFrame, sceneSpan, useLang, useReel } from "../reel/Film";
import { CatMark, FACE, In, WorkOnward, Wordmark } from "../reel/kit";
import { STAT, useCopy } from "./copy";

// "Close to Home" (search reel, 9:16). A papercraft town in isometric view, one continuous drone flight (the town
// is the reel's backdrop). Dana drives past the office of her next job every day for two years; the opening was only
// on the company's own careers page; 7.5M openings (BLS, Sep 2026); Tahoe reads company career sites and puts the
// jobs on a map (pins like Tahoe's own: company tile and pay); the jobs around the corner light up.

const T = { sky1: "#FFE3CF", sky2: "#D8F0EA", ground: "#F7E9D7", base: "#E2C9AE", base2: "#CDAF90", road: "#EADAC6", lane: "#FFFFFF", ink: "#2A2433", sub: "#6B6377", purple: "#7C3AED" };
const PASTEL: [string, string, string][] = [
  ["#FFE0CC", "#FFC9A8", "#F2AE88"], // peach
  ["#D6F2E6", "#B5E3CF", "#93CDB5"], // mint
  ["#DDE8FF", "#BFD3FF", "#9DB7F0"], // sky
  ["#EDE3FF", "#D8C8FF", "#BBA6F0"], // lilac
  ["#FFF1C7", "#FFE29A", "#F0C970"], // butter
];
const U = 64;
const iso = (x: number, y: number, z = 0): [number, number] => [(x - y) * U * 0.866, (x + y) * U * 0.5 - z * U];
const pts = (...p: [number, number][]) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

type Bldg = { x0: number; y0: number; x1: number; y1: number; h: number; c: [string, string, string]; kind: "house" | "shop" | "office" | "trees" | "fernway" | "dana"; id: string };

const N = 12;
const isRoad = (gx: number, gy: number) => gy === 8 || gx === 4 || gx === 9;
const TOWN: Bldg[] = (() => {
  const out: Bldg[] = [];
  for (let gy = 0; gy < N; gy++)
    for (let gx = 0; gx < N; gx++) {
      if (isRoad(gx, gy)) continue;
      if (gx >= 6 && gx <= 7 && gy >= 6 && gy <= 7) continue; // Fernway's block
      if (gx === 1 && gy === 9) continue; // Dana's house
      const r = random(`lot${gx}-${gy}`);
      const kind = r < 0.36 ? "house" : r < 0.6 ? "shop" : r < 0.8 ? "office" : "trees";
      const h = kind === "house" ? 0.55 + random(`h${gx}${gy}`) * 0.3 : kind === "shop" ? 0.9 + random(`h${gx}${gy}`) * 0.4 : kind === "office" ? 1.6 + random(`h${gx}${gy}`) * 1.5 : 0;
      out.push({ x0: gx + 0.14, y0: gy + 0.14, x1: gx + 0.86, y1: gy + 0.86, h, c: PASTEL[Math.floor(random(`c${gx}${gy}`) * PASTEL.length)], kind, id: `${gx}-${gy}` });
    }
  out.push({ x0: 6.12, y0: 6.12, x1: 7.88, y1: 7.82, h: 3.3, c: ["#DDE8FF", "#AFC6FA", "#86A3E6"], kind: "fernway", id: "fernway" });
  out.push({ x0: 1.18, y0: 9.2, x1: 1.86, y1: 9.84, h: 0.62, c: ["#FFF6EA", "#FCE9D4", "#EBCFB0"], kind: "dana", id: "dana" });
  return out.sort((a, b) => a.x1 + a.y1 - (b.x1 + b.y1));
})();

const Windows: React.FC<{ b: Bldg; lit: number }> = ({ b, lit }) => {
  if (b.kind !== "office" && b.kind !== "fernway") return null;
  const rows = Math.floor(b.h / 0.42);
  const out = [];
  for (let r = 0; r < rows; r++) {
    const z0 = 0.25 + r * 0.42;
    for (let k = 0; k < 3; k++) {
      // left face (y = y1): x from x0..x1
      const xa = b.x0 + ((k + 0.25) / 3) * (b.x1 - b.x0);
      const xb = xa + (0.5 / 3) * (b.x1 - b.x0);
      out.push(<polygon key={`l${r}${k}`} points={pts(iso(xa, b.y1, z0), iso(xb, b.y1, z0), iso(xb, b.y1, z0 + 0.22), iso(xa, b.y1, z0 + 0.22))} fill={random(`w${b.id}${r}${k}`) < lit ? "#FFF3B8" : "rgba(255,255,255,0.55)"} />);
      const ya = b.y0 + ((k + 0.25) / 3) * (b.y1 - b.y0);
      const yb = ya + (0.5 / 3) * (b.y1 - b.y0);
      out.push(<polygon key={`r${r}${k}`} points={pts(iso(b.x1, ya, z0), iso(b.x1, yb, z0), iso(b.x1, yb, z0 + 0.22), iso(b.x1, ya, z0 + 0.22))} fill="rgba(255,255,255,0.4)" />);
    }
  }
  return <>{out}</>;
};

const Building: React.FC<{ b: Bldg; rise: number; lit: number; glow?: number }> = ({ b, rise, lit, glow = 0 }) => {
  if (b.kind === "trees") {
    const cx = (b.x0 + b.x1) / 2;
    const cy = (b.y0 + b.y1) / 2;
    return (
      <g>
        {[[-0.18, -0.12], [0.16, 0.1], [-0.05, 0.22]].map(([dx, dy], i) => {
          const [sx, sy] = iso(cx + dx, cy + dy, 0);
          const r = 15 + random(`t${b.id}${i}`) * 8;
          return (
            <g key={i}>
              <ellipse cx={sx + 6} cy={sy + 2} rx={r} ry={r * 0.45} fill="rgba(90,60,30,0.12)" />
              <rect x={sx - 3} y={sy - 18 * rise} width={6} height={18 * rise} fill="#B98B62" />
              <circle cx={sx} cy={sy - (18 + r) * rise} r={r * rise} fill={i % 2 ? "#8FD3A8" : "#A6DDB6"} />
            </g>
          );
        })}
      </g>
    );
  }
  const h = b.h * rise;
  const A = iso(b.x0, b.y0, 0), B = iso(b.x1, b.y0, 0), Cc = iso(b.x1, b.y1, 0), D = iso(b.x0, b.y1, 0);
  const At = iso(b.x0, b.y0, h), Bt = iso(b.x1, b.y0, h), Ct = iso(b.x1, b.y1, h), Dt = iso(b.x0, b.y1, h);
  const shadow = pts(B, iso(b.x1 + h * 0.5, b.y0 + h * 0.15, 0), iso(b.x1 + h * 0.5, b.y1 + h * 0.15, 0), Cc);
  const [top, left, right] = b.c;
  const roof = b.kind === "dana" || (b.kind === "house" && random(`roof${b.id}`) < 0.6);
  return (
    <g>
      <polygon points={shadow} fill="rgba(90,60,30,0.12)" />
      <polygon points={pts(D, Cc, Ct, Dt)} fill={left} />
      <polygon points={pts(B, Cc, Ct, Bt)} fill={right} />
      {!roof ? <polygon points={pts(At, Bt, Ct, Dt)} fill={top} /> : null}
      {roof ? (
        <>
          <polygon points={pts(Dt, Ct, iso(b.x1, (b.y0 + b.y1) / 2, h + 0.38), iso(b.x0, (b.y0 + b.y1) / 2, h + 0.38))} fill={b.kind === "dana" ? "#F27C6B" : "#E9A089"} />
          <polygon points={pts(Bt, Ct, iso(b.x1, (b.y0 + b.y1) / 2, h + 0.38))} fill={b.kind === "dana" ? "#D9604F" : "#D48770"} />
        </>
      ) : null}
      {rise > 0.95 ? <Windows b={b} lit={lit} /> : null}
      {glow > 0 ? <polygon points={pts(At, Bt, Ct, Dt)} fill="none" stroke={T.purple} strokeWidth={6} opacity={glow} /> : null}
    </g>
  );
};

/** Where a building's roof centre lands on screen for a camera (s, fx, fy). */
const roofOf = (id: string): [number, number] => {
  const b = TOWN.find((x) => x.id === id)!;
  return iso((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, b.h + (b.kind === "dana" || b.kind === "house" ? 0.4 : 0));
};

type Cam = { s: number; fx: number; fy: number };
const camAt = (keys: [number, Cam][], f: number): Cam => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t0, a] = keys[i - 1];
    const [t1, b] = keys[i];
    if (f <= t1) {
      const p = Easing.bezier(0.45, 0, 0.2, 1)(Math.min(1, (f - t0) / Math.max(1, t1 - t0)));
      return { s: a.s * Math.pow(b.s / a.s, p), fx: mix(a.fx, b.fx, p), fy: mix(a.fy, b.fy, p) };
    }
  }
  return keys[keys.length - 1][1];
};

export const PIN_IDS = ["fernway", "2-5", "5-2", "6-10", "10-3", "11-7", "7-1", "3-6", "10-10", "0-2", "5-11", "8-5", "11-0", "2-11"];
const PAY = ["$88K", "$72K", "$95K", "$64K", "$110K", "$81K", "$58K", "$99K", "$76K", "$67K", "$90K", "$84K", "$120K", "$70K"];
const LETTER = ["F", "C", "Q", "S", "H", "B", "L", "J", "M", "P", "R", "O", "T", "G"];
const LETTER_BG = [T.purple, "#C2410C", "#0F766E", "#1D4ED8", "#B45309", "#9F1239", "#15803D", "#0369A1", "#7E22CE", "#4D7C0F", "#BE185D", "#0E7490", "#A16207", "#334155"];

/** Tahoe's map pin: a white label with the company's letter tile and the pay. */
const Pin: React.FC<{ x: number; y: number; i: number; p: number; hot: number; ko: boolean }> = ({ x, y, i, p, hot }) => {
  if (p <= 0) return null;
  const s = mix(0.4, 1, p) * (1 + 0.12 * hot);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${s})`, transformOrigin: "50% 100%", opacity: Math.min(1, p * 2) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px 7px 7px", borderRadius: 999, background: "#fff", boxShadow: `0 8px 18px rgba(42,36,51,0.22), 0 0 0 ${hot > 0 ? 4 : 0}px rgba(124,58,237,${0.8 * hot})`, fontFamily: FACE.text, fontSize: 24, fontWeight: 700, color: T.ink, whiteSpace: "nowrap" }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: LETTER_BG[i], color: "#fff", display: "grid", placeItems: "center", fontSize: 19 }}>{LETTER[i]}</span>
        {PAY[i]}
      </div>
      <div style={{ width: 0, height: 0, margin: "0 auto", borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: "11px solid #fff" }} />
    </div>
  );
};

/** The town, the car and the camera, for the whole reel. */
export const Town: React.FC = () => {
  const f = useCurrentFrame();
  const info = useReel();
  const ko = useLang() === "ko";
  const t = (s: string, n: string) => beatFrame(info, s, n);
  const [driveFrom, driveLen] = sceneSpan(info, "drive");
  const [hiddenFrom] = sceneSpan(info, "hidden");
  const [statFrom] = sceneSpan(info, "stat");
  const [mapFrom] = sceneSpan(info, "map");
  const [nearFrom] = sceneSpan(info, "near");
  const [closeFrom] = sceneSpan(info, "close");

  const [hx, hy] = iso(2.4, 8.6, 0);
  const [ox, oy] = iso(7, 7, 1.6);
  const [cx, cy] = iso(6, 6, 0.6);
  const cam = camAt(
    [
      [0, { s: 1.55, fx: hx + 60, fy: hy - 40 }],
      [driveFrom + driveLen * 0.55, { s: 1.35, fx: mix(hx, ox, 0.5), fy: mix(hy, oy, 0.5) }],
      [t("hidden", "reveal"), { s: 1.75, fx: ox, fy: oy - 60 }],
      [statFrom + 30, { s: 0.54, fx: cx, fy: cy - 520 }],
      [mapFrom, { s: 0.54, fx: cx, fy: cy - 520 }],
      [t("map", "mark") + 10, { s: 0.86, fx: cx, fy: cy + 40 }],
      [t("near", "glow") + 10, { s: 1.22, fx: mix(hx, ox, 0.35), fy: mix(hy, oy, 0.35) }],
      [closeFrom + 40, { s: 0.8, fx: cx, fy: cy + 160 }],
    ],
    f,
  );
  const toScreen = ([x, y]: [number, number]): [number, number] => [540 + cam.s * (x - cam.fx), 1020 + cam.s * (y - cam.fy)];

  // the car: passes along the road (y 8..9) again and again while the days go by
  const passes = 5;
  const k = Math.max(0, Math.min(passes - 0.001, ((f - driveFrom) / (hiddenFrom + 40 - driveFrom)) * passes));
  const carX = -1 + (k % 1) * 14;
  const [carSx, carSy] = iso(carX, 8.62, 0);
  const lit = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(f / 10));

  const rise = (b: Bldg) => prog(f, -8 + random(`rise${b.id}`) * 14, 18, Easing.bezier(0.2, 0.9, 0.3, 1.2));
  const pinsAt = t("map", "pins");
  const glowAt = t("near", "glow");
  const near = new Set(["fernway", "3-6", "2-5", "6-10", "5-11", "2-11"]);
  const dim = prog(f, glowAt, 14);
  const end = prog(f, closeFrom + 6, 24);

  // edges of the diorama (the paper base)
  const corners = [iso(0, 0), iso(N, 0), iso(N, N), iso(0, N)];
  const base = (d: number) => [iso(N, 0, -d), iso(N, N, -d), iso(0, N, -d)];
  const [b1, b2, b3] = base(0.6);

  return (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${T.sky1} 0%, #FFF4EA 45%, ${T.sky2} 100%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: end > 0 ? `blur(${end * 10}px)` : undefined, opacity: 1 - 0.35 * end }}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(540 1020) scale(${cam.s}) translate(${-cam.fx} ${-cam.fy})`}>
            {/* paper base */}
            <polygon points={pts(corners[1], corners[2], b2, b1)} fill={T.base2} />
            <polygon points={pts(corners[2], corners[3], b3, b2)} fill={T.base} />
            <polygon points={pts(...corners)} fill={T.ground} />
            {/* roads */}
            <polygon points={pts(iso(0, 8), iso(N, 8), iso(N, 9), iso(0, 9))} fill={T.road} />
            <polygon points={pts(iso(4, 0), iso(5, 0), iso(5, N), iso(4, N))} fill={T.road} />
            <polygon points={pts(iso(9, 0), iso(10, 0), iso(10, N), iso(9, N))} fill={T.road} />
            {Array.from({ length: 24 }, (_, i) => (
              <line key={`h${i}`} x1={iso(i * 0.5 + 0.1, 8.5)[0]} y1={iso(i * 0.5 + 0.1, 8.5)[1]} x2={iso(i * 0.5 + 0.3, 8.5)[0]} y2={iso(i * 0.5 + 0.3, 8.5)[1]} stroke={T.lane} strokeWidth={3} />
            ))}
            {[...TOWN.map((b) => ({ key: b.x1 + b.y1, b })), ...(f < hiddenFrom + 60 ? [{ key: carX + 8.62 + 0.6, b: null }] : [])]
              .sort((a, b) => a.key - b.key)
              .map(({ b }) =>
                b === null ? (
                  <g key="car" transform={`translate(${carSx} ${carSy})`}>
                    <ellipse cx={4} cy={6} rx={34} ry={12} fill="rgba(60,40,20,0.18)" />
                    <polygon points={pts([-30, 0], [26, -16], [34, -6], [-22, 10])} fill="#6D28D9" />
                    <polygon points={pts([-30, 0], [26, -16], [26, -34], [-30, -18])} fill={T.purple} />
                    <polygon points={pts([-18, -22], [14, -32], [10, -48], [-16, -38])} fill="#C4B5FD" />
                  </g>
                ) : (
                  <g key={b.id} opacity={near.has(b.id) || b.id === "dana" ? 1 : 1 - 0.45 * dim}>
                    <Building b={b} rise={rise(b)} lit={b.kind === "fernway" ? 0.8 : lit} glow={b.id === "fernway" ? prog(f, t("hidden", "reveal"), 12) * (1 - prog(f, statFrom, 12)) : 0} />
                  </g>
                ),
              )}
          </g>
        </svg>
        {/* name tag over Dana's car while she drives */}
        {f < hiddenFrom + 40 ? (
          <div style={{ position: "absolute", left: toScreen([carSx, carSy - 70])[0], top: toScreen([carSx, carSy - 70])[1], transform: "translate(-50%, -100%)", opacity: prog(f, driveFrom + 8, 10) * (1 - prog(f, hiddenFrom + 20, 12)), padding: "8px 18px", borderRadius: 999, background: T.purple, color: "#fff", fontFamily: ko ? FACE.kr : FACE.text, fontSize: 28, fontWeight: 700 }}>
            {ko ? "다나" : "Dana"}
          </div>
        ) : null}
        {/* Tahoe's pins */}
        {f >= pinsAt
          ? PIN_IDS.map((id, i) => {
              const [px, py] = toScreen(roofOf(id));
              const p = prog(f, pinsAt + i * 2.5, 12, Easing.bezier(0.2, 0.9, 0.3, 1.4));
              const hot = near.has(id) ? dim : 0;
              const fade = near.has(id) ? 1 : 1 - 0.6 * dim;
              return (
                <div key={id} style={{ opacity: fade }}>
                  <Pin x={px} y={py - 6} i={i} p={p} hot={hot} ko={ko} />
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
};

/* ================================================================== scenes: overlays on the town */

export const Drive: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const days = Math.round(interpolate(f, [10, 150], [1, 730], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.5, 0, 0.6, 1) }));
  return (
    <In at={6} y={20} style={{ position: "absolute", left: 70, top: 300 }}>
      <div style={{ display: "inline-flex", alignItems: "baseline", gap: 14, padding: "18px 30px", borderRadius: 26, background: "rgba(255,255,255,0.85)", boxShadow: "0 12px 30px rgba(42,36,51,0.12)", fontFamily: ko ? FACE.kr : FACE.display, color: T.ink }}>
        {ko ? (
          <>
            <span style={{ fontSize: 64, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{days}</span>
            <span style={{ fontSize: 34, fontWeight: 600, color: T.sub }}>{c.day}</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 34, fontWeight: 600, color: T.sub }}>{c.day}</span>
            <span style={{ fontSize: 64, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{days}</span>
          </>
        )}
      </div>
    </In>
  );
};

export const Hidden: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const reveal = useEvent("reveal");
  const page = useEvent("page");
  const p = prog(f, reveal, 16, Easing.bezier(0.2, 0.9, 0.3, 1.2));
  return (
    <div style={{ position: "absolute", left: 140, top: 330, width: 800, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 60}px) scale(${mix(0.85, 1, p)})` }}>
      <div style={{ borderRadius: 30, background: "#fff", boxShadow: "0 30px 60px rgba(42,36,51,0.22)", overflow: "hidden" }}>
        <div style={{ height: 50, background: "#F3EEE8", display: "flex", alignItems: "center", gap: 10, padding: "0 20px" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: "#D9D0C5" }} />
          ))}
          <div style={{ marginLeft: 16, fontFamily: ko ? FACE.kr : FACE.text, fontSize: 24, color: T.sub, opacity: prog(f, page, 10) }}>
            {c.company} · {c.careers}
          </div>
        </div>
        <div style={{ padding: "30px 36px", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 92, height: 92, borderRadius: 22, background: T.purple, display: "grid", placeItems: "center", color: "#fff", fontFamily: FACE.display, fontWeight: 700, fontSize: 48 }}>F</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: ko ? FACE.kr : FACE.display, fontSize: 50, fontWeight: 700, color: T.ink }}>{c.job}</div>
            <div style={{ fontFamily: ko ? FACE.kr : FACE.text, fontSize: 30, color: T.sub, marginTop: 6 }}>
              {c.company} · {c.pay}
            </div>
          </div>
        </div>
      </div>
      <svg width={800} height={260} style={{ display: "block" }}>
        <line x1={400} y1={0} x2={400} y2={250} stroke={T.purple} strokeWidth={4} strokeDasharray="10 10" opacity={p} />
      </svg>
    </div>
  );
};

export const Stat: React.FC = () => {
  const c = useCopy();
  const ko = useLang() === "ko";
  const num = useEvent("num");
  return (
    <>
      <In at={num} y={40} style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}>
        <div style={{ fontFamily: FACE.display, fontSize: 250, fontWeight: 700, color: T.ink, letterSpacing: "-0.05em", lineHeight: 1 }}>
          <Counter to={STAT.value} at={num} dur={32} decimals={1} suffix="M" />
        </div>
      </In>
      <In at={num + 10} y={24} style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center" }}>
        {c.statLabel.map((l, i) => (
          <div key={i} style={{ fontFamily: ko ? FACE.kr : FACE.text, fontSize: 46, fontWeight: i ? 600 : 400, color: T.ink, lineHeight: 1.3 }}>
            {l}
          </div>
        ))}
        <div style={{ fontFamily: ko ? FACE.kr : FACE.text, fontSize: 25, color: T.sub, marginTop: 18 }}>{STAT.source[ko ? "ko" : "en"]}</div>
      </In>
    </>
  );
};

export const MapScene: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const mark = useEvent("mark");
  const p = prog(f, mark, 16, Easing.bezier(0.2, 0.9, 0.3, 1.2));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 290, transform: `translateY(${(1 - p) * -80}px)`, opacity: Math.min(1, p * 1.4) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 22px", borderRadius: 999, background: "#fff", boxShadow: "0 18px 40px rgba(42,36,51,0.16)" }}>
        <CatMark size={70} glow={0.3} />
        <div style={{ flex: 1, fontFamily: ko ? FACE.kr : FACE.text, fontSize: 36, color: T.ink, fontWeight: 500 }}>{c.search}</div>
        <Wordmark size={40} color={T.ink} spark={T.purple} />
      </div>
    </div>
  );
};

export const Near: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCopy();
  const ko = useLang() === "ko";
  const card = useEvent("card");
  const p = prog(f, card, 14, Easing.bezier(0.2, 0.9, 0.3, 1.2));
  return (
    <>
      <div style={{ position: "absolute", left: 60, right: 60, top: 290 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 22px", borderRadius: 999, background: "#fff", boxShadow: "0 18px 40px rgba(42,36,51,0.16)" }}>
          <CatMark size={70} glow={0.3} />
          <div style={{ flex: 1, fontFamily: ko ? FACE.kr : FACE.text, fontSize: 36, color: T.ink, fontWeight: 500 }}>{c.search}</div>
          <Wordmark size={40} color={T.ink} spark={T.purple} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 1170, transform: `translateY(${(1 - p) * 120}px)`, opacity: Math.min(1, p * 1.5) }}>
        <div style={{ borderRadius: 34, background: "#fff", boxShadow: "0 30px 60px rgba(42,36,51,0.22)", padding: "28px 32px", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 84, height: 84, borderRadius: 20, background: T.purple, display: "grid", placeItems: "center", color: "#fff", fontFamily: FACE.display, fontWeight: 700, fontSize: 44 }}>F</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: ko ? FACE.kr : FACE.display, fontSize: 44, fontWeight: 700, color: T.ink }}>{c.job}</div>
            <div style={{ fontFamily: ko ? FACE.kr : FACE.text, fontSize: 28, color: T.sub, marginTop: 4 }}>
              {c.company} · {c.pay}
            </div>
          </div>
          <div style={{ padding: "14px 22px", borderRadius: 999, background: T.purple, color: "#fff", fontFamily: ko ? FACE.kr : FACE.text, fontSize: 26, fontWeight: 700, whiteSpace: "nowrap" }}>{c.apply}</div>
        </div>
      </div>
    </>
  );
};

export const Close: React.FC = () => {
  const c = useCopy();
  const ko = useLang() === "ko";
  const lockup = useEvent("lockup");
  const line = useEvent("line");
  return (
    <>
      <In at={8} y={30} style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
        <CatMark size={200} glow={0.7} />
      </In>
      <In at={14} y={24} style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center" }}>
        <Wordmark size={120} color={T.ink} spark={T.purple} />
      </In>
      <In at={lockup} y={20} style={{ position: "absolute", left: 0, right: 0, top: 1030, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "26px 48px", borderRadius: 999, background: "#fff", color: T.ink, fontFamily: ko ? FACE.kr : FACE.display, fontSize: 48, fontWeight: 700, boxShadow: "0 18px 40px rgba(42,36,51,0.18), inset 0 0 0 4px #7C3AED" }}>{c.trial}</div>
      </In>
      <In at={line} y={10} style={{ position: "absolute", left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center" }}>
        <WorkOnward size={28} />
      </In>
    </>
  );
};

export const HOME_SCENES: Record<string, React.FC> = { drive: Drive, hidden: Hidden, stat: Stat, map: MapScene, near: Near, close: Close };
