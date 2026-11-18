import { EventMap } from "../lib/scene";
import { ReelDef, Timeline } from "./Film";
import { seriesReel } from "./series";
import { FRESH_SCENES } from "../reel-fresh/scenes";
import freshTimeline from "../reel-fresh/timeline.json";
import freshEvents from "../reel-fresh/events.json";
import freshMaleTimeline from "../reel-fresh-male/timeline.json";
import freshMaleEvents from "../reel-fresh-male/events.json";
import freshSoheeTimeline from "../reel-fresh-sohee/timeline.json";
import freshSoheeEvents from "../reel-fresh-sohee/events.json";
import frontPageTl from "../reel-front-page/timeline.json";
import frontPageEv from "../reel-front-page/events.json";
import seenTl from "../reel-seen/timeline.json";
import seenEv from "../reel-seen/events.json";
import plainlyTl from "../reel-plainly/timeline.json";
import plainlyEv from "../reel-plainly/events.json";
import homeTl from "../reel-home/timeline.json";
import homeEv from "../reel-home/events.json";
import formTl from "../reel-form/timeline.json";
import formEv from "../reel-form/events.json";
import nightTl from "../reel-night/timeline.json";
import nightEv from "../reel-night/events.json";
import blueprintTl from "../reel-blueprint/timeline.json";
import blueprintEv from "../reel-blueprint/events.json";
import frontPageKoTl from "../reel-front-page-ko/timeline.json";
import frontPageKoEv from "../reel-front-page-ko/events.json";
import seenKoTl from "../reel-seen-ko/timeline.json";
import seenKoEv from "../reel-seen-ko/events.json";
import plainlyKoTl from "../reel-plainly-ko/timeline.json";
import plainlyKoEv from "../reel-plainly-ko/events.json";
import homeKoTl from "../reel-home-ko/timeline.json";
import homeKoEv from "../reel-home-ko/events.json";
import formKoTl from "../reel-form-ko/timeline.json";
import formKoEv from "../reel-form-ko/events.json";
import nightKoTl from "../reel-night-ko/timeline.json";
import nightKoEv from "../reel-night-ko/events.json";
import blueprintKoTl from "../reel-blueprint-ko/timeline.json";
import blueprintKoEv from "../reel-blueprint-ko/events.json";
import frontPageSoheeTl from "../reel-front-page-sohee/timeline.json";
import frontPageSoheeEv from "../reel-front-page-sohee/events.json";
import seenSoheeTl from "../reel-seen-sohee/timeline.json";
import seenSoheeEv from "../reel-seen-sohee/events.json";
import plainlySoheeTl from "../reel-plainly-sohee/timeline.json";
import plainlySoheeEv from "../reel-plainly-sohee/events.json";
import homeSoheeTl from "../reel-home-sohee/timeline.json";
import homeSoheeEv from "../reel-home-sohee/events.json";
import formSoheeTl from "../reel-form-sohee/timeline.json";
import formSoheeEv from "../reel-form-sohee/events.json";
import nightSoheeTl from "../reel-night-sohee/timeline.json";
import nightSoheeEv from "../reel-night-sohee/events.json";
import blueprintSoheeTl from "../reel-blueprint-sohee/timeline.json";
import blueprintSoheeEv from "../reel-blueprint-sohee/events.json";

// Every reel: a key (REEL=<key> ./build-reel.sh), its folder (src/reel-<key>, public/reel-<key>) and its scenes.
// The composition is Reel-<Name>-9x16, where Name is the key's hyphen parts capitalised (front-page-ko -> FrontPageKo).
// Fresh (and its male and Sohee voices) uses the six-scene template; the Nov 2026 series (src/reel/series.ts) brings its own
// look per reel, and each language has its own script, timeline and beats over the same scenes. <key>-sohee twins
// read the English copy in Qwen's Sohee voice (CustomVoice), with the tone notes of the Korean twin.
export const REELS: Record<string, ReelDef> = {
  fresh: { name: "Fresh", variant: "reel-fresh", timeline: freshTimeline as unknown as Timeline, events: freshEvents as unknown as EventMap, scenes: FRESH_SCENES },
  "fresh-male": { name: "FreshMale", variant: "reel-fresh-male", timeline: freshMaleTimeline as unknown as Timeline, events: freshMaleEvents as unknown as EventMap, scenes: FRESH_SCENES },
  "fresh-sohee": { name: "FreshSohee", variant: "reel-fresh-sohee", timeline: freshSoheeTimeline as unknown as Timeline, events: freshSoheeEvents as unknown as EventMap, scenes: FRESH_SCENES },
  "front-page": seriesReel("front-page", "en", frontPageTl, frontPageEv),
  seen: seriesReel("seen", "en", seenTl, seenEv),
  plainly: seriesReel("plainly", "en", plainlyTl, plainlyEv),
  home: seriesReel("home", "en", homeTl, homeEv),
  form: seriesReel("form", "en", formTl, formEv),
  night: seriesReel("night", "en", nightTl, nightEv),
  blueprint: seriesReel("blueprint", "en", blueprintTl, blueprintEv),
  "front-page-ko": seriesReel("front-page", "ko", frontPageKoTl, frontPageKoEv),
  "seen-ko": seriesReel("seen", "ko", seenKoTl, seenKoEv),
  "plainly-ko": seriesReel("plainly", "ko", plainlyKoTl, plainlyKoEv),
  "home-ko": seriesReel("home", "ko", homeKoTl, homeKoEv),
  "form-ko": seriesReel("form", "ko", formKoTl, formKoEv),
  "night-ko": seriesReel("night", "ko", nightKoTl, nightKoEv),
  "blueprint-ko": seriesReel("blueprint", "ko", blueprintKoTl, blueprintKoEv),
  "front-page-sohee": seriesReel("front-page", "en", frontPageSoheeTl, frontPageSoheeEv, "sohee"),
  "seen-sohee": seriesReel("seen", "en", seenSoheeTl, seenSoheeEv, "sohee"),
  "plainly-sohee": seriesReel("plainly", "en", plainlySoheeTl, plainlySoheeEv, "sohee"),
  "home-sohee": seriesReel("home", "en", homeSoheeTl, homeSoheeEv, "sohee"),
  "form-sohee": seriesReel("form", "en", formSoheeTl, formSoheeEv, "sohee"),
  "night-sohee": seriesReel("night", "en", nightSoheeTl, nightSoheeEv, "sohee"),
  "blueprint-sohee": seriesReel("blueprint", "en", blueprintSoheeTl, blueprintSoheeEv, "sohee"),
};
