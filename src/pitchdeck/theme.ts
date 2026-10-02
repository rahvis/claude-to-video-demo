import { Easing } from "remotion";
import { loadFont as loadHeading } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Investor pitch deck v2. A light, soothing blue canvas blending Apple's
// restraint (whitespace, typographic hierarchy, soft rounded corners) with
// Google Material's confidence (bolder elevation, pill chips, a standard
// easing curve with slight overshoot on data reveals). Genuine Google Fonts
// throughout: Plus Jakarta Sans for headlines (rounder and more geometric
// than Geist, a bridge between SF Pro and Product Sans), Inter for body,
// JetBrains Mono for code/data.
export const SANS = loadHeading("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;
export const BODY = loadBody("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;
export const MONO = loadMono("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

export const C = {
  bg: "#eaf3fc",
  card: "#f7fbff",
  card2: "#ffffff",
  track: "#dbe8f5",
  hairline: "rgba(19,42,76,0.08)",

  // Text roles
  fg: "#132a4c",
  dim: "#4a5b76",
  faint: "#8195ac",

  // Brand: Apple blue primary, Google blue as the rare secondary data accent
  blue: "#0071e3",
  blueDeep: "#0058b0",
  blueLight: "#5eb2ff",
  blueFaint: "#dcebfc",
  googleBlue: "#1a73e8",

  // muted "everyone else" grey, used so competitors never compete with the
  // one blue accent for attention
  grey: "#aab8cc",
  greyText: "#6b7d99",

  // semantic, used once each: a real case and a caution range
  coral: "#d9482f",
  coralBg: "#fbe9e6",

  line: "#d7e5f3",
};

export const GRADIENT = `linear-gradient(92deg, ${C.blueDeep} 0%, ${C.blue} 55%, ${C.blueLight} 100%)`;

export const gradientText = (angle = 92): React.CSSProperties => ({
  backgroundImage: GRADIENT.replace("92deg", `${angle}deg`),
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});

// Material "standard" easing with a touch of overshoot, for chart/data
// entrances (bars, quadrant dots, counters) so they land with a soft bounce
// rather than a flat ease-out.
export const SPRING = Easing.bezier(0.34, 1.56, 0.64, 1);
export const STANDARD = Easing.bezier(0.4, 0, 0.2, 1);
