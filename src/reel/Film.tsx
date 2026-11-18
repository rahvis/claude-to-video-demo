import React, { createContext, useContext } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { EventMap, EventsProvider, SceneData, SceneProvider } from "../lib/scene";
import { BlurRise, ShellProps } from "./shells";

// The 30 s Instagram reel film. A reel is a list of scenes, each one a component; the narration script
// (audio/script-<variant>.json) sets their lengths through audio/tts_qwen.py, which writes src/<variant>/timeline.json.
// Visual beats live in src/<variant>/events.json and are shared with the score (audio/score.py), so hits land on the
// frames the animation uses. "Fresh" uses six scene types (hook, problem, stat, reveal, feature, cta) and the
// default blur-rise hand-over; other reels bring their own scene ids, `shell` (how one scene hands over to the
// next), `backdrop` (drawn once under every scene for the whole film) and `overlay` (on top, e.g. film grain).
export type Timeline = { fps: number; overlap: number; durationInFrames: number; scenes: SceneData[] };
export type Lang = "en" | "ko";

export type ReelDef = {
  /** composition id part: Reel-<name>-9x16 */
  name: string;
  /** folder under src/ and public/ (timeline, events, vo.wav, mix.wav) */
  variant: string;
  timeline: Timeline;
  events: EventMap;
  scenes: Record<string, React.FC>;
  lang?: Lang;
  bg?: string;
  shell?: React.FC<ShellProps>;
  backdrop?: React.FC;
  overlay?: React.FC;
};

type ReelInfo = { lang: Lang; timeline: Timeline; events: EventMap };
const ReelCtx = createContext<ReelInfo>({ lang: "en", timeline: { fps: 30, overlap: 0, durationInFrames: 0, scenes: [] }, events: {} });

/** The reel's language, timeline and beats, anywhere in the film (backdrops use it to find scene starts). */
export const useReel = () => useContext(ReelCtx);
export const useLang = () => useContext(ReelCtx).lang;

/** Film frame of a beat in another scene (for backdrops and overlays that span the whole reel). */
export const beatFrame = (info: ReelInfo, scene: string, name: string): number => {
  const s = info.timeline.scenes.find((x) => x.id === scene);
  const e = info.events[scene]?.[name];
  if (!s || !e) throw new Error(`unknown beat ${scene}.${name}`);
  if (e.cue === null) return s.from + e.at;
  const cue = s.cues[e.cue];
  return s.from + (e.word !== undefined ? cue.words[e.word].frame : cue.frame) + e.at;
};

/** Film frame where a scene starts (and its length). */
export const sceneSpan = (info: ReelInfo, scene: string): [number, number] => {
  const s = info.timeline.scenes.find((x) => x.id === scene);
  if (!s) throw new Error(`unknown scene ${scene}`);
  return [s.from, s.durationInFrames];
};

export const ReelFilm: React.FC<{ def: ReelDef }> = ({ def }) => {
  const tl = def.timeline;
  const Shell = def.shell ?? BlurRise;
  const Backdrop = def.backdrop;
  const Overlay = def.overlay;
  return (
    <AbsoluteFill style={{ background: def.bg ?? "#fff" }}>
      <ReelCtx.Provider value={{ lang: def.lang ?? "en", timeline: tl, events: def.events }}>
        <EventsProvider value={def.events}>
          {Backdrop ? <Backdrop /> : null}
          {tl.scenes.map((s, i) => {
            const Scene = def.scenes[s.id];
            if (!Scene) throw new Error(`${def.variant}: no component for scene ${s.id}`);
            return (
              <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={s.id}>
                <SceneProvider value={s}>
                  <Shell overlap={tl.overlap} first={i === 0} last={i === tl.scenes.length - 1}>
                    <Scene />
                  </Shell>
                </SceneProvider>
              </Sequence>
            );
          })}
          {Overlay ? <Overlay /> : null}
        </EventsProvider>
      </ReelCtx.Provider>
      <Audio src={staticFile(`${def.variant}/mix.wav`)} />
    </AbsoluteFill>
  );
};
