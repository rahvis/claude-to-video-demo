import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import { LightFilm } from "./light/Film";
import { TraceFilm } from "./trace/Film";
import { TahoeFilm } from "./tahoe/Film";
import { UnparseFilm } from "./unparse/Film";
import { PitchDeckFilm } from "./pitchdeck/Film";
import timeline from "./timeline.json";
import lightTimeline from "./light/timeline.json";
import traceTimeline from "./trace/timeline.json";
import tahoeTimeline from "./tahoe/timeline.json";
import unparseTimeline from "./unparse/timeline.json";
import pitchdeckTimeline from "./pitchdeck/timeline.json";

export const Root: React.FC = () => (
  <>
    <Composition id="CCI-16x9" component={Film} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1920} height={1080} />
    <Composition id="CCI-9x16" component={Film} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1080} height={1920} />
    {/* White edition: its own scenes (src/light), narration (am_michael) and mix */}
    <Composition id="CCI-Light-16x9" component={LightFilm} durationInFrames={lightTimeline.durationInFrames} fps={lightTimeline.fps} width={1920} height={1080} />
    <Composition id="CCI-Light-9x16" component={LightFilm} durationInFrames={lightTimeline.durationInFrames} fps={lightTimeline.fps} width={1080} height={1920} />
    {/* Trace Privacy film: white edition style, af_bella narration, its own scenes (src/trace) and mix */}
    <Composition id="Trace-16x9" component={TraceFilm} durationInFrames={traceTimeline.durationInFrames} fps={traceTimeline.fps} width={1920} height={1080} />
    <Composition id="Trace-9x16" component={TraceFilm} durationInFrames={traceTimeline.durationInFrames} fps={traceTimeline.fps} width={1080} height={1920} />
    {/* TahoeAI film: white edition style, af_heart narration, its own scenes (src/tahoe) and mix */}
    <Composition id="Tahoe-16x9" component={TahoeFilm} durationInFrames={tahoeTimeline.durationInFrames} fps={tahoeTimeline.fps} width={1920} height={1080} />
    <Composition id="Tahoe-9x16" component={TahoeFilm} durationInFrames={tahoeTimeline.durationInFrames} fps={tahoeTimeline.fps} width={1080} height={1920} />
    {/* Conformal Logit Inference marketing film: white edition style, af_bella narration, its own scenes (src/unparse) and mix */}
    <Composition id="Unparse-16x9" component={UnparseFilm} durationInFrames={unparseTimeline.durationInFrames} fps={unparseTimeline.fps} width={1920} height={1080} />
    <Composition id="Unparse-9x16" component={UnparseFilm} durationInFrames={unparseTimeline.durationInFrames} fps={unparseTimeline.fps} width={1080} height={1920} />
    {/* Conformal Logit Inference investor pitch deck: pure white, af_bella narration, its own scenes (src/pitchdeck) and mix */}
    <Composition id="PitchDeck-16x9" component={PitchDeckFilm} durationInFrames={pitchdeckTimeline.durationInFrames} fps={pitchdeckTimeline.fps} width={1920} height={1080} />
    <Composition id="PitchDeck-9x16" component={PitchDeckFilm} durationInFrames={pitchdeckTimeline.durationInFrames} fps={pitchdeckTimeline.fps} width={1080} height={1920} />
  </>
);
