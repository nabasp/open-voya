import type { BuildStats, PipelineStage } from "@/types";

// Static "finished" build state — all 9 stages done, overall 100%.
// (The design's live setInterval simulation is intentionally not ported.)
export const PIPELINE_STAGES: PipelineStage[] = [
  { label: "Clone repository", time: "1.2s", state: "done" },
  { label: "ts-morph analysis", time: "2.1s", state: "done" },
  { label: "Generate manifest", time: "0.6s", state: "done" },
  { label: "Generate knowledge docs", time: "4.2s", state: "done" },
  { label: "Embed (bge-small-en)", time: "6.7s", state: "done" },
  { label: "Store in LanceDB", time: "0.9s", state: "done" },
  { label: "Bundle SDK (Vite)", time: "3.1s", state: "done" },
];

export const BUILD_STATS: BuildStats = {
  routes: 12,
  targets: 89,
  docs: 142,
  overall: 100,
};
