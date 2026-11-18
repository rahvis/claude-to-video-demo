import React, { CSSProperties, ReactNode } from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export const prog = (f: number, at: number, dur = 18, easing = EASE) =>
  interpolate(f, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type RevealProps = {
  at: number;
  dur?: number;
  y?: number;
  blur?: number;
  scale?: number;
  style?: CSSProperties;
  children?: ReactNode;
  inline?: boolean;
};

/** The house entrance: rise, un-blur, fade in. */
export const BlurIn: React.FC<RevealProps> = ({ at, dur = 20, y = 24, blur = 12, scale = 1, style, children, inline }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur);
  return (
    <div
      style={{
        display: inline ? "inline-block" : undefined,
        opacity: p,
        transform: `translateY(${(1 - p) * y}px) scale(${mix(scale, 1, p)})`,
        filter: p < 1 ? `blur(${(1 - p) * blur}px)` : undefined,
        willChange: "transform, opacity, filter",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Word-by-word reveal; pass `frames` to pin each word to narration timing. */
export const Words: React.FC<{
  text: string;
  at: number;
  stagger?: number;
  frames?: number[];
  dur?: number;
  style?: CSSProperties;
  wordStyle?: (i: number) => CSSProperties;
}> = ({ text, at, stagger = 3, frames, dur = 18, style, wordStyle }) => (
  <span style={style}>
    {text.split(" ").map((w, i) => (
      <React.Fragment key={i}>
        <BlurIn inline at={frames?.[i] ?? at + i * stagger} dur={dur} y={18} blur={10} style={wordStyle?.(i)}>
          {w}
        </BlurIn>
        {" "}
      </React.Fragment>
    ))}
  </span>
);

/** Stack of items that replace each other in place (headline that changes per cue). */
export const Swap: React.FC<{
  items: { at: number; node: ReactNode }[];
  style?: CSSProperties;
  align?: CSSProperties["justifyItems"];
}> = ({ items, style, align = "start" }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "grid", justifyItems: align, ...style }}>
      {items.map((it, i) => {
        const pin = prog(f, it.at, 18);
        const next = items[i + 1];
        const pout = next ? prog(f, next.at - 4, 10, EASE_IN_OUT) : 0;
        const o = pin * (1 - pout);
        if (o <= 0.001) return <div key={i} style={{ gridArea: "1 / 1", visibility: "hidden" }}>{it.node}</div>;
        return (
          <div
            key={i}
            style={{
              gridArea: "1 / 1",
              opacity: o,
              transform: `translateY(${(1 - pin) * 20 - pout * 14}px)`,
              filter: o < 1 ? `blur(${(1 - pin) * 10 + pout * 8}px)` : undefined,
            }}
          >
            {it.node}
          </div>
        );
      })}
    </div>
  );
};

export const Counter: React.FC<{
  from?: number;
  to: number;
  at: number;
  dur?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  /** Custom number formatting (e.g. thousands separators); defaults to toFixed(decimals). */
  format?: (v: number) => string;
  style?: CSSProperties;
}> = ({ from = 0, to, at, dur = 26, decimals = 0, suffix = "", prefix = "", format, style }) => {
  const f = useCurrentFrame();
  const v = mix(from, to, prog(f, at, dur, Easing.bezier(0.22, 1, 0.36, 1)));
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{prefix + (format ? format(v) : v.toFixed(decimals)) + suffix}</span>;
};

const HEX = "0123456789abcdef";

/** Hash that types itself out, with a short scramble band ahead of the cursor. */
export const Hash: React.FC<{
  text: string;
  at: number;
  perChar?: number;
  band?: number;
  seed?: string;
  color?: string;
  scrambleColor?: string;
  style?: CSSProperties;
  mark?: { index: number; color: string } | null;
  split?: number;
}> = ({ text, at, perChar = 0.55, band = 7, seed = "h", color = "inherit", scrambleColor = "rgba(255,255,255,0.35)", style, mark, split }) => {
  const f = useCurrentFrame();
  const settled = Math.floor((f - at) / perChar);
  return (
    <span style={{ whiteSpace: "pre", ...style }}>
      {text.split("").map((ch, i) => {
        const br = split && i > 0 && i % split === 0 ? <br key={`br${i}`} /> : null;
        return <React.Fragment key={i}>{br}{glyph(ch, i)}</React.Fragment>;
      })}
    </span>
  );

  function glyph(ch: string, i: number) {
        if (i < settled) {
          const marked = mark && mark.index === i;
          return (
            <span key={i} style={{ color: marked ? mark!.color : color, background: marked ? `${mark!.color}33` : undefined, borderRadius: 4 }}>
              {ch}
            </span>
          );
        }
        if (i < settled + band && f >= at) {
          const r = Math.floor(random(`${seed}-${i}-${Math.floor(f / 2)}`) * 16);
          return (
            <span key={i} style={{ color: scrambleColor }}>
              {HEX[r]}
            </span>
          );
        }
        return (
          <span key={i} style={{ visibility: "hidden" }}>
            {ch}
          </span>
        );
  }
};

/** Characters that keep rolling (encrypted memory, recomputing hashes). */
export const Scramble: React.FC<{ length: number; seed: string; every?: number; split?: number; style?: CSSProperties }> = ({ length, seed, every = 2, split, style }) => {
  const f = useCurrentFrame();
  const tick = Math.floor(f / every);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < length; i++) {
    if (split && i > 0 && i % split === 0) out.push(<br key={`br${i}`} />);
    out.push(HEX[Math.floor(random(`${seed}-${i}-${tick}`) * 16)]);
  }
  return <span style={{ whiteSpace: "pre", ...style }}>{out}</span>;
};
