import React, { ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { useSceneData } from "../lib/scene";
import { clamp } from "../seeker/theme";

// How one scene hands over to the next. Scenes overlap by the timeline's `overlap` frames (the script's
// overlap_frames), so each shell decides what the outgoing and incoming scene do during those frames.
export type ShellProps = { overlap: number; first: boolean; last: boolean; children: ReactNode };

const Box: React.FC<{ style: React.CSSProperties; children: ReactNode }> = ({ style, children }) => <div style={{ position: "absolute", inset: 0, ...style }}>{children}</div>;

/** Fresh's hand-over: each scene rises in and leaves with a quick blur. */
export const BlurRise: React.FC<ShellProps> = ({ overlap, first, last, children }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useSceneData();
  const exitLen = overlap + 4;
  const out = last ? 0 : interpolate(f, [durationInFrames - exitLen, durationInFrames], [0, 1], clamp);
  const inn = first ? 1 : interpolate(f, [0, overlap], [0, 1], clamp);
  return (
    <Box
      style={{
        opacity: Math.min(inn, 1 - out),
        filter: out > 0 ? `blur(${out * 12}px)` : inn < 1 ? `blur(${(1 - inn) * 10}px)` : undefined,
        transform: `translateY(${(1 - inn) * 40}px) scale(${1 + 0.03 * out})`,
      }}
    >
      {children}
    </Box>
  );
};

/** A hard cut: the next scene is simply there (the outgoing one vanishes when the incoming one starts). */
export const Cut: React.FC<ShellProps> = ({ overlap, last, children }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useSceneData();
  const gone = !last && f >= durationInFrames - overlap;
  return <Box style={{ opacity: gone ? 0 : 1 }}>{children}</Box>;
};

/** A plain cross-dissolve (no movement, no blur): for reels that change by light. */
export const Dissolve: React.FC<ShellProps> = ({ overlap, first, last, children }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useSceneData();
  const n = Math.max(overlap, 1);
  const inn = first ? 1 : interpolate(f, [0, n], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const out = last ? 0 : interpolate(f, [durationInFrames - n, durationInFrames], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  return <Box style={{ opacity: Math.min(inn, 1 - out) }}>{children}</Box>;
};

/** Scenes that manage their own entrances and exits (continuous-take reels): no shell at all. */
export const Bare: React.FC<ShellProps> = ({ children }) => <Box style={{}}>{children}</Box>;

/** A newspaper page turn: the incoming page slides in from the right edge over the old one, with a shadow at its edge. */
export const PageTurn: React.FC<ShellProps> = ({ overlap, first, last, children }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useSceneData();
  const n = Math.max(overlap, 1);
  const p = first ? 1 : interpolate(f, [0, n], [0, 1], { ...clamp, easing: Easing.bezier(0.6, 0, 0.2, 1) });
  const gone = !last && f >= durationInFrames;
  return (
    <Box
      style={{
        opacity: gone ? 0 : 1,
        transform: `translateX(${(1 - p) * 1080}px) rotateY(${(1 - p) * -12}deg)`,
        transformOrigin: "0% 50%",
        boxShadow: p < 1 ? `-30px 0 60px rgba(0,0,0,${0.35 * (1 - p)})` : undefined,
      }}
    >
      {children}
    </Box>
  );
};
