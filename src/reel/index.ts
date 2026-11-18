import { registerRoot } from "remotion";
import { ReelRoot } from "./Root";

// Own entry point (as seeker): fonts are local (public/seeker/fonts), so renders never touch the network.
registerRoot(ReelRoot);
