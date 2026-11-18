import React from "react";
import { Composition } from "remotion";
import { ReelFilm } from "./Film";
import { REELS } from "./registry";
import { loadSeekerFonts } from "../seeker/theme";

loadSeekerFonts();

const ReelById: React.FC<{ reel: string }> = ({ reel }) => <ReelFilm def={REELS[reel]} />;

// Instagram reels, 9:16 (1080 x 1920, 30 fps). One composition per reel in registry.ts.
export const ReelRoot: React.FC = () => (
  <>
    {Object.entries(REELS).map(([key, def]) => (
      <Composition key={key} id={`Reel-${def.name}-9x16`} component={ReelById} defaultProps={{ reel: key }} durationInFrames={def.timeline.durationInFrames} fps={30} width={1080} height={1920} />
    ))}
  </>
);
