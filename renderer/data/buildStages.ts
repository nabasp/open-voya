// Canonical, ordered build-stage definitions used by the Build screen for
// rendering + selection. Only the first stage is executed today (git clone /
// local copy); the rest are placeholders for the future pipeline. Stage ids
// match the main-process pipeline stage ids so live status events line up.

export interface StageDef {
  id: string;
  label: string;
}

const FUTURE_STAGES: StageDef[] = [
  { id: "gitnexus-analysis", label: "GitNexus analysis" },
  { id: "generate-manifest", label: "Generate manifest" },
  { id: "inject-data-ai-id", label: "Inject data-ai-id" },
  { id: "generate-knowledge-docs", label: "Generate knowledge docs" },
  { id: "embed", label: "Embed (bge-small-en)" },
  { id: "store-lancedb", label: "Store in LanceDB" },
  { id: "bundle-sdk", label: "Bundle SDK (Vite)" },
];

const GIT_STAGES: StageDef[] = [
  { id: "clone-repository", label: "Clone repository" },
  ...FUTURE_STAGES,
];

const LOCAL_STAGES: StageDef[] = [
  { id: "import-local-folder", label: "Import local folder" },
  ...FUTURE_STAGES,
];

export function getStageDefs(sourceType: "git" | "local" | undefined): StageDef[] {
  return sourceType === "local" ? LOCAL_STAGES : GIT_STAGES;
}
