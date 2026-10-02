import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

// TahoeAI edition. Apple-style white canvas and type scale (shared with the
// light film), recoloured with Tahoe's real brand gradient (violet -> magenta
// -> pink, from home.module.css) and its dashboard accent orange.
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
  card: "#f5f5f5",
  card2: "#fbfaf7",
  track: "#ebe6dd",

  // Tahoe brand
  violet: "#8b5cf6",
  magenta: "#e879f9",
  pink: "#f06bc8",
  orange: "#ff682c",
  green: "#1a9e5a",
  coral: "#d9482f",
  amber: "#c47600",

  // WorkOnward wordmark colours (for the closing lockup only)
  woGreen: "#5b8300",
  woOrange: "#be5200",

  // small UI surfaces (extension panel, match cards)
  paper: "#ffffff",
  ink: "#1d1d1f",
  muted: "#6e6e73",
  line: "#e7e2d8",
  vGreen: "#1a9e5a",
  vGreenBg: "#e8f5ec",
  vOrange: "#ff682c",
  vOrangeBg: "#fff0e8",
};

export const GRADIENT = `linear-gradient(92deg, ${C.violet} 0%, ${C.magenta} 55%, ${C.pink} 100%)`;

export const gradientText = (angle = 92): React.CSSProperties => ({
  backgroundImage: GRADIENT.replace("92deg", `${angle}deg`),
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});
