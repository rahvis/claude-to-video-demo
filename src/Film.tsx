import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneShell } from "./components/ui";
import { SceneData, SceneProvider } from "./lib/scene";
import { S01Hook } from "./scenes/S01Hook";
import { S02Problem } from "./scenes/S02Problem";
import { S03Title } from "./scenes/S03Title";
import { S04Confidential } from "./scenes/S04Confidential";
import { S05Conformal } from "./scenes/S05Conformal";
import { S06Case } from "./scenes/S06Case";
import { S07Commit } from "./scenes/S07Commit";
import { S08Verify } from "./scenes/S08Verify";
import { S09Bound } from "./scenes/S09Bound";
import { S10Tagline } from "./scenes/S10Tagline";
import { C } from "./theme";
import timeline from "./timeline.json";

const SCENES: Record<string, React.FC> = {
  s01_hook: S01Hook,
  s02_problem: S02Problem,
  s03_title: S03Title,
  s04_confidential: S04Confidential,
  s05_conformal: S05Conformal,
  s06_case: S06Case,
  s07_commit: S07Commit,
  s08_verify: S08Verify,
  s09_bound: S09Bound,
  s10_tagline: S10Tagline,
};

export const Film: React.FC = () => {
  const scenes = timeline.scenes as SceneData[];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
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
      <Audio src={staticFile("mix.wav")} />
    </AbsoluteFill>
  );
};
