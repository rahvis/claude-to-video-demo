import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

// White edition. Same fonts as the dark film; palette follows Apple's light pages
// (#ffffff canvas, #1d1d1f type, #6e6e73 secondary, #f5f5f7 panels) with the product
// accents deepened so they keep contrast on white.
export const SANS = loadGeist("normal", {
  weights: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;
export const MONO = loadGeistMono("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

export const C = {
  bg: "#ffffff",
  fg: "#1d1d1f",
  dim: "#6e6e73",
  faint: "#d2d2d7",
  hairline: "rgba(0,0,0,0.08)",
  card: "#f5f5f7",
  card2: "#fafafc",
  track: "#e8e8ed",
  teal: "#0a8aa0",
  periwinkle: "#5e5ce6",
  coral: "#d9482f",
  green: "#1a9e5a",
  amber: "#c47600",
  // Product window (the real chat UI's tokens)
  paper: "#ffffff",
  ink: "#0b2c4c",
  muted: "#52677a",
  line: "#e3e8ea",
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
