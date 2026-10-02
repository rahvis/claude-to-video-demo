import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneShell } from "./components/ui";
import { EventMap, EventsProvider, SceneData, SceneProvider } from "../lib/scene";
import events from "./events.json";
import { S01Hook } from "./scenes/S01Hook";
import { S02Shift } from "./scenes/S02Shift";
import { S03Title } from "./scenes/S03Title";
import { S04Search } from "./scenes/S04Search";
import { S05Extension } from "./scenes/S05Extension";
import { S06Match } from "./scenes/S06Match";
import { S07Outreach } from "./scenes/S07Outreach";
import { S08Analytics } from "./scenes/S08Analytics";
import { S09Promise } from "./scenes/S09Promise";
import { S10Tagline } from "./scenes/S10Tagline";
import { C } from "./theme";
import timeline from "./timeline.json";

const SCENES: Record<string, React.FC> = {
  s01_hook: S01Hook,
  s02_shift: S02Shift,
  s03_title: S03Title,
  s04_search: S04Search,
  s05_extension: S05Extension,
  s06_match: S06Match,
  s07_outreach: S07Outreach,
  s08_analytics: S08Analytics,
  s09_promise: S09Promise,
  s10_tagline: S10Tagline,
};

export const TahoeFilm: React.FC = () => {
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
      <Audio src={staticFile("tahoe/mix.wav")} />
    </AbsoluteFill>
  );
};
