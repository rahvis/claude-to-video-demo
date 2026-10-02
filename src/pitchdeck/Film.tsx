import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneShell } from "./components/ui";
import { EventMap, EventsProvider, SceneData, SceneProvider } from "../lib/scene";
import events from "./events.json";
import { S01Title } from "./scenes/S01Title";
import { S02WhyNow } from "./scenes/S02WhyNow";
import { S03Problem } from "./scenes/S03Problem";
import { S04Solution } from "./scenes/S04Solution";
import { S05Product } from "./scenes/S05Product";
import { S06Demo } from "./scenes/S06Demo";
import { S07Market } from "./scenes/S07Market";
import { S08Competition } from "./scenes/S08Competition";
import { S09Business } from "./scenes/S09Business";
import { S10GoToMarket } from "./scenes/S10GoToMarket";
import { S11Ask } from "./scenes/S11Ask";
import { C } from "./theme";
import timeline from "./timeline.json";

const SCENES: Record<string, React.FC> = {
  s01_title: S01Title,
  s02_whynow: S02WhyNow,
  s03_problem: S03Problem,
  s04_solution: S04Solution,
  s05_product: S05Product,
  s06_demo: S06Demo,
  s07_market: S07Market,
  s08_competition: S08Competition,
  s09_business: S09Business,
  s10_gtm: S10GoToMarket,
  s11_ask: S11Ask,
};

export const PitchDeckFilm: React.FC = () => {
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
      <Audio src={staticFile("pitchdeck/mix.wav")} />
    </AbsoluteFill>
  );
};
