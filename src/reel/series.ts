import React from "react";
import { EventMap } from "../lib/scene";
import { Lang, ReelDef, Timeline } from "./Film";
import { Bare, Cut, Dissolve, PageTurn, ShellProps } from "./shells";
import { FRONT_PAGE_SCENES, Grain } from "../reel-front-page/scenes";
import { SEEN_SCENES, Thread } from "../reel-seen/scenes";
import { PLAINLY_SCENES } from "../reel-plainly/scenes";
import { HOME_SCENES, Town } from "../reel-home/scenes";
import { FORM_SCENES } from "../reel-form/scenes";
import { NIGHT_SCENES, Sky } from "../reel-night/scenes";
import { BLUEPRINT_SCENES, BlueprintMark, Sheet } from "../reel-blueprint/scenes";

// The Nov 2026 reel series: seven reels, each with its own look (scenes), hand-over (shell), continuous backdrop
// and overlay. English and Korean versions share all of it; only the timeline, beats and copy differ.
type Look = { scenes: Record<string, React.FC>; shell: React.FC<ShellProps>; backdrop?: React.FC; overlay?: React.FC; bg: string };

export const LOOKS: Record<string, Look> = {
  "front-page": { scenes: FRONT_PAGE_SCENES, shell: PageTurn, overlay: Grain, bg: "#F2EDE2" },
  seen: { scenes: SEEN_SCENES, shell: Bare, backdrop: Thread, bg: "#0D0D12" },
  plainly: { scenes: PLAINLY_SCENES, shell: Cut, bg: "#F7F6F1" },
  home: { scenes: HOME_SCENES, shell: Bare, backdrop: Town, bg: "#FFE3CF" },
  form: { scenes: FORM_SCENES, shell: Cut, bg: "#FFFFFF" },
  night: { scenes: NIGHT_SCENES, shell: Dissolve, backdrop: Sky, bg: "#0B1033" },
  blueprint: { scenes: BLUEPRINT_SCENES, shell: Bare, backdrop: Sheet, overlay: BlueprintMark, bg: "#0B3A8C" },
};

/** front-page + ko -> { name: "FrontPageKo", variant: "reel-front-page-ko", ... }; a second narrator of the same
 * language is a voice twin: front-page + en + sohee -> { name: "FrontPageSohee", variant: "reel-front-page-sohee" } */
export const seriesReel = (base: string, lang: Lang, timeline: unknown, events: unknown, voice?: string): ReelDef => {
  const key = [base, lang === "en" ? null : lang, voice ?? null].filter(Boolean).join("-");
  const name = key.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");
  return { name, variant: `reel-${key}`, timeline: timeline as Timeline, events: events as EventMap, lang, ...LOOKS[base] };
};
