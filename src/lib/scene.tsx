import { createContext, useContext } from "react";
import { useVideoConfig } from "remotion";
import events from "../events.json";

export type Word = { text: string; frame: number };
export type Cue = { frame: number; endFrame: number; text: string; words: Word[] };
export type SceneData = { id: string; from: number; durationInFrames: number; cues: Cue[] };

type EventSpec = { cue: number | null; at: number; word?: number };
export type EventMap = Record<string, Record<string, EventSpec>>;

const Ctx = createContext<SceneData | null>(null);
export const SceneProvider = Ctx.Provider;

// A film can supply its own visual beats; the default is src/events.json.
const EventsCtx = createContext<EventMap>(events as unknown as EventMap);
export const EventsProvider = EventsCtx.Provider;

export const useSceneData = (): SceneData => {
  const s = useContext(Ctx);
  if (!s) throw new Error("useSceneData outside a scene");
  return s;
};

export const useCue = (i: number): Cue => useSceneData().cues[i];

/** Local frame of a named visual beat from events.json (shared with the sound design). */
export const useEvent = (name: string): number => {
  const s = useSceneData();
  const e = useContext(EventsCtx)[s.id]?.[name];
  if (!e) throw new Error(`unknown event ${s.id}.${name}`);
  if (e.cue === null) return e.at;
  const cue = s.cues[e.cue];
  return (e.word !== undefined ? cue.words[e.word].frame : cue.frame) + e.at;
};

export const useLayout = () => {
  const { width, height } = useVideoConfig();
  return { w: width, h: height, portrait: height > width };
};
