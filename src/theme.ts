import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

// Geist is OFL-licensed and close to Apple's SF Pro in feel; SF Pro itself isn't
// licensed for marketing video. Swap SANS for '"SF Pro Display", -apple-system' if cleared.
export const SANS = loadGeist("normal", {
  weights: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;
export const MONO = loadGeistMono("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

// Keynote canvas + the live product palette (src/webapp/tailwind.config.ts), lifted for a dark stage.
export const C = {
  bg: "#000000",
  fg: "#f5f5f7",
  dim: "#86868b",
  faint: "#48484a",
  hairline: "rgba(255,255,255,0.12)",
  card: "#0f0f12",
  card2: "#1c1c1f",
  teal: "#2bb3c9",
  periwinkle: "#8b8cf0",
  coral: "#f87861",
  green: "#4cc38a",
  amber: "#e8ad4f",
  // Light product window (the real chat UI's tokens)
  paper: "#fffdf9",
  ink: "#0b2c4c",
  muted: "#52677a",
  line: "#dfe6e7",
  vGreen: "#3f8f6f",
  vGreenBg: "#e6f2ec",
  vRed: "#c15b4f",
  vRedBg: "#f8e9e7",
};

export const GRADIENT = `linear-gradient(90deg, ${C.teal} 0%, ${C.periwinkle} 52%, ${C.coral} 100%)`;

export const MODES = [
  { key: "direct", label: "Direct Answer", color: C.green },
  { key: "clarify", label: "Needs Clarification", color: C.amber },
  { key: "escalate", label: "Escalate", color: C.coral },
] as const;

export const gradientText = (angle = 90): React.CSSProperties => ({
  backgroundImage: GRADIENT.replace("90deg", `${angle}deg`),
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});
