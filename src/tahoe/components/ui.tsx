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
  Search: ({ size = 26, color = C.fg, stroke = 2.4 }: { size?: number; color?: string; stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  Bookmark: ({ size = 26, color = C.violet, stroke = 2.4 }: { size?: number; color?: string; stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3.5h12v17l-6-4.2-6 4.2z" />
    </svg>
  ),
  Send: ({ size = 26, color = C.orange, stroke = 2.4 }: { size?: number; color?: string; stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 3L10.5 13.5M21 3l-7 18-4-8-8-4z" />
    </svg>
  ),
  Mail: ({ size = 24, color = C.fg, stroke = 2.2 }: { size?: number; color?: string; stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5.5" width="18" height="13" rx="2.4" />
      <path d="M4 7l8 6.2L20 7" />
    </svg>
  ),
  Phone: ({ size = 24, color = C.fg, stroke = 2.2 }: { size?: number; color?: string; stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h3l1.5 4L8.3 9.7a12 12 0 006 6l1.7-2.2 4 1.5v3a2 2 0 01-2.2 2A17 17 0 014 6.2 2 2 0 016 4z" />
    </svg>
  ),
  Sparkle: ({ size = 22, color = C.violet }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  ),
  Chart: ({ size = 26, color = C.fg, stroke = 2.4 }: { size?: number; color?: string; stroke?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  ),
  Chrome: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#fff" stroke="#dadce0" strokeWidth="0.5" />
      <path d="M12 2a10 10 0 018.66 5H12a5 5 0 00-4.33 2.5L3.34 7A10 10 0 0112 2z" fill="#EA4335" />
      <path d="M3.34 7l4.33 7.5A5 5 0 0012 17h.5L8.2 22a10 10 0 01-4.86-15z" fill="#34A853" />
      <path d="M12 17a5 5 0 004.33-2.5L20.66 17A10 10 0 018.2 22z" fill="#4285F4" />
      <circle cx="12" cy="12" r="4.2" fill="#fff" />
      <circle cx="12" cy="12" r="3.2" fill="#4285F4" />
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

/** Soft coloured light behind a scene, tinted with Tahoe's violet/magenta/pink gradient. */
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
        background:
          color ??
          `radial-gradient(circle at 35% 45%, ${C.violet}cc 0%, transparent 55%), radial-gradient(circle at 68% 58%, ${C.pink}bb 0%, transparent 52%), radial-gradient(circle at 50% 50%, ${C.magenta}88 0%, transparent 60%)`,
        filter: "blur(140px)",
        opacity: opacity * 0.5 * p,
        pointerEvents: "none",
      }}
    />
  );
};
