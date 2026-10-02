import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

// Conformal Logit Inference film. Apple-style white canvas and type scale
// (shared with the other white editions), recoloured with the landing page's
// own palette: Apple blue accent on white, no other hues, per its own
// "Apple colors only" design rule.
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

  // Brand: Apple blue, deepened/lightened for a text gradient
  blue: "#0071e3",
  blueDeep: "#0058b0",
  blueLight: "#5eb2ff",

  // semantic accents (kept minimal)
  green: "#1a9e5a",
  greenBg: "#e8f5ec",
  coral: "#d9482f",
  coralBg: "#fbe9e6",
  amber: "#c47600",

  // small UI surfaces (code card, answer chips)
  paper: "#ffffff",
  ink: "#1d1d1f",
  muted: "#6e6e73",
  line: "#e3e8ea",
};

export const GRADIENT = `linear-gradient(92deg, ${C.blueDeep} 0%, ${C.blue} 55%, ${C.blueLight} 100%)`;

export const gradientText = (angle = 92): React.CSSProperties => ({
  backgroundImage: GRADIENT.replace("92deg", `${angle}deg`),
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});
