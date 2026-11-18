import { createContext, useContext } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

/** Apple-style light palette: white page, near-black ink, grey secondary text, Tahoe purple as the only colour. */
export const C = {
  bg: "#FFFFFF",
  ink: "#1D1D1F",
  ink2: "#424245",
  sub: "#6E6E73",
  faint: "#86868B",
  hair: "#D2D2D7",
  surface: "#F5F5F7",
  purple: "#7C3AED",
  deep: "#5B21B6",
  violet: "#8B5CF6",
  lilac: "#C4B5FD",
  tint: "#F3EEFF",
  dot: "#E6E6EB",
  canvas: "#FFFFFF",
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Lang = "en" | "ko" | "es" | "zh" | "ja" | "vi";
export const LANGS: Lang[] = ["en", "ko", "es", "zh", "ja", "vi"];
const LangCtx = createContext<Lang>("en");
export const LangProvider = LangCtx.Provider;
export const useLang = () => useContext(LangCtx);

const DISPLAY = "'SK Display', 'Inter Display', 'Inter', system-ui, sans-serif";
const TEXT = "'SK Text', 'Inter', system-ui, sans-serif";
const KR = "'SK KR', 'Apple SD Gothic Neo', system-ui, sans-serif";
// Apple's own CJK faces (installed with macOS; renders run on this Mac): PingFang SC, Hiragino Sans.
const ZH = "'PingFang SC', 'Hiragino Sans GB', 'SK Text', sans-serif";
const JA = "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'SK Text', sans-serif";
export const BRAND = "'SK Brand', 'Sora', system-ui, sans-serif";
export const UI = TEXT; // the app's own chrome (window bar) stays in Inter in every film

/** Type per language: Inter Display / Inter (English, Spanish, Vietnamese), Pretendard (Korean), PingFang SC
 * (Chinese), Hiragino Sans (Japanese). Big numbers are Inter Display everywhere. */
export const useType = () => {
  const lang = useLang();
  const ko = lang === "ko";
  const cjk = lang === "zh" || lang === "ja";
  const face = ko ? KR : lang === "zh" ? ZH : lang === "ja" ? JA : null;
  return {
    lang,
    ko,
    cjk,
    display: face ?? DISPLAY,
    text: face ?? TEXT,
    num: DISPLAY,
    /** Headline tracking: tight for Latin display type, nearly neutral for Hangul and CJK. */
    track: ko ? "-0.012em" : cjk ? "0em" : "-0.032em",
    trackNum: "-0.045em",
    lineHeight: ko || cjk ? 1.24 : 1.06,
    /** Korean wraps between words; Chinese and Japanese break with strict rules (no lone punctuation). */
    wrap: ko ? ({ wordBreak: "keep-all", lineBreak: "strict" } as const) : cjk ? ({ lineBreak: "strict" } as const) : ({} as const),
  };
};

const FACES: [string, string, number][] = [
  ["SK Display", "InterDisplay-Medium.ttf", 500],
  ["SK Display", "InterDisplay-SemiBold.ttf", 600],
  ["SK Display", "InterDisplay-Bold.otf", 700],
  ["SK Text", "Inter-Regular.ttf", 400],
  ["SK Text", "Inter-Medium.ttf", 500],
  ["SK Text", "Inter-SemiBold.ttf", 600],
  ["SK Brand", "sora-latin-700-normal.woff2", 700],
  ["SK KR", "Pretendard-Regular.woff2", 400],
  ["SK KR", "Pretendard-Medium.woff2", 500],
  ["SK KR", "Pretendard-SemiBold.woff2", 600],
  ["SK KR", "Pretendard-Bold.woff2", 700],
];

let loaded = false;
/** Local copies in public/seeker/fonts, so renders never touch the network. */
export const loadSeekerFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("Seeker fonts");
  Promise.all(
    FACES.map(([family, file, weight]) =>
      new FontFace(family, `url(${staticFile(`seeker/fonts/${file}`)})`, { weight: String(weight) }).load().then((f) => {
        document.fonts.add(f);
      }),
    ),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error("Seeker fonts failed to load", err);
      continueRender(handle);
    });
};
