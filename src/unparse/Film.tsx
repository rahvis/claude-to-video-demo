import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneShell } from "./components/ui";
import { EventMap, EventsProvider, SceneData, SceneProvider } from "../lib/scene";
import events from "./events.json";
import { S01Hook } from "./scenes/S01Hook";
import { S02Problem } from "./scenes/S02Problem";
import { S03Title } from "./scenes/S03Title";
import { S04Primitives } from "./scenes/S04Primitives";
import { S05Demo } from "./scenes/S05Demo";
import { S06Engines } from "./scenes/S06Engines";
import { S07Integrations } from "./scenes/S07Integrations";
import { S08Guarantee } from "./scenes/S08Guarantee";
import { S09Promise } from "./scenes/S09Promise";
import { S10Tagline } from "./scenes/S10Tagline";
import { C } from "./theme";
import timeline from "./timeline.json";

const SCENES: Record<string, React.FC> = {
  s01_hook: S01Hook,
  s02_problem: S02Problem,
  s03_title: S03Title,
  s04_primitives: S04Primitives,
  s05_demo: S05Demo,
  s06_engines: S06Engines,
  s07_integrations: S07Integrations,
  s08_guarantee: S08Guarantee,
  s09_promise: S09Promise,
  s10_tagline: S10Tagline,
};

export const UnparseFilm: React.FC = () => {
  const scenes = timeline.scenes as SceneData[];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <EventsProvider value={events as unknown as EventMap}>
        {scenes.map((s, i) => {
          const Scene = SCENES[s.id];
          return (
            <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={s.id}>
              <SceneProvider value={s}>
                <SceneShell overlap={timeline.overlap} last={i === scenes.length - 1}>
                  <Scene />
                </SceneShell>
              </SceneProvider>
            </Sequence>
          );
        })}
      </EventsProvider>
      <Audio src={staticFile("unparse/mix.wav")} />
    </AbsoluteFill>
  );
};
