import React, { CSSProperties, ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useSceneData } from "../../lib/scene";
import { C, MONO, SANS, gradientText } from "../theme";

export const Icon = {
  Check: ({ size = 28, color = C.green, stroke = 3 }: { size?: number; color?: string; stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  ),
  X: ({ size = 28, color = C.coral, stroke = 3 }: { size?: number; color?: string; stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
};

export const Eyebrow: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: SANS, fontSize: 30, fontWeight: 600, letterSpacing: "-0.01em", ...gradientText(), ...style }}>{children}</div>
);

export const Headline: React.FC<{ children: ReactNode; size?: number; style?: CSSProperties }> = ({ children, size = 76, style }) => (
  <div
    style={{
      fontFamily: SANS,
      fontSize: size,
      fontWeight: 650,
      letterSpacing: "-0.035em",
      lineHeight: 1.04,
      color: C.fg,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Mono: React.FC<{ children: ReactNode; size?: number; color?: string; style?: CSSProperties }> = ({ children, size = 24, color = C.dim, style }) => (
  <span style={{ fontFamily: MONO, fontSize: size, color, letterSpacing: "-0.01em", ...style }}>{children}</span>
);

export const Card: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: C.card,
      border: "1px solid rgba(0,0,0,0.04)",
      borderRadius: 32,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.05)",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Wraps every scene: slow push-in, and a blur-fade exit that overlaps the next scene. */
export const SceneShell: React.FC<{ children: ReactNode; last?: boolean; overlap: number; push?: number }> = ({ children, last, overlap, push = 0.028 }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useSceneData();
  const exitLen = last ? 30 : overlap + 6;
  const out = interpolate(f, [durationInFrames - exitLen, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = 1 + push * (f / durationInFrames) + out * 0.01;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 1 - out,
        filter: out > 0 && !last ? `blur(${out * 10}px)` : undefined,
        transform: `scale(${scale})`,
        fontFamily: SANS,
        color: C.fg,
      }}
    >
      {children}
    </div>
  );
};

/** Soft blue light behind a scene — the only hue in the palette besides ink/grey. */
export const Glow: React.FC<{ at: number; size?: number; x?: string; y?: string; opacity?: number; color?: string }> = ({
  at,
  size = 1300,
  x = "50%",
  y = "50%",
  opacity = 0.32,
  color,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 1 + 0.04 * Math.sin(f / 22);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `translate(-50%, -50%) scale(${(0.7 + 0.3 * p) * breathe})`,
        borderRadius: "50%",
        background: color ?? `radial-gradient(circle at 45% 45%, ${C.blueLight}bb 0%, transparent 55%), radial-gradient(circle at 60% 60%, ${C.blue}99 0%, transparent 60%)`,
        filter: "blur(140px)",
        opacity: opacity * 0.5 * p,
        pointerEvents: "none",
      }}
    />
  );
};
