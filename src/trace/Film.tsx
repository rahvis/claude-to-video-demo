import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneShell } from "../light/components/ui";
import { C } from "../light/theme";
import { EventMap, EventsProvider, SceneData, SceneProvider } from "../lib/scene";
import events from "./events.json";
import { T01Hook } from "./scenes/T01Hook";
import { T02Leak } from "./scenes/T02Leak";
import { T03Trace } from "./scenes/T03Trace";
import { T04Attack } from "./scenes/T04Attack";
import { T05Threshold } from "./scenes/T05Threshold";
import { T06Title } from "./scenes/T06Title";
import { T07Define } from "./scenes/T07Define";
import { T08Shield } from "./scenes/T08Shield";
import { T09Boundary } from "./scenes/T09Boundary";
import { T10Tagline } from "./scenes/T10Tagline";
import timeline from "./timeline.json";

// Trace Privacy film: the white edition's type, palette and motion, on a pure white canvas.
const SCENES: Record<string, React.FC> = {
  t01_hook: T01Hook,
  t02_leak: T02Leak,
  t03_trace: T03Trace,
  t04_attack: T04Attack,
  t05_threshold: T05Threshold,
  t06_title: T06Title,
  t07_define: T07Define,
  t08_shield: T08Shield,
  t09_boundary: T09Boundary,
  t10_tagline: T10Tagline,
};

export const TraceFilm: React.FC = () => {
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
      <Audio src={staticFile("trace/mix.wav")} />
    </AbsoluteFill>
  );
};
