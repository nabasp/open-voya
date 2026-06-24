// Shared domain types for the open voya UI. Everything here describes the
// shape of the static mock data — there is no runtime/backend behind it.

export type ProjectStatus = "ready" | "generating" | "error";

export interface Project {
  id?: string; // present for live (DB-backed) projects
  name: string;
  repo: string;
  status: ProjectStatus;
  updatedLabel: string; // "2h ago", "now", "3d ago"
  routes?: number;
  targets?: number;
  model?: string;
  progress?: number; // 0-100, only for "generating"
  progressLabel?: string; // "Embedding docs…"
  error?: string; // only for "error"
}

export type StageState = "done" | "active" | "pending";

export interface PipelineStage {
  label: string;
  time: string; // "1.2s" — empty when not done
  state: StageState;
}

export interface LogLine {
  text: string;
  kind: "accent" | "muted"; // accent = command line, muted = output
}

export interface BuildStats {
  routes: number;
  targets: number;
  docs: number;
  overall: number; // 0-100
}

export type ManifestNodeType = "route" | "component" | "action" | "flow";

export interface ManifestNode {
  id: string;
  label: string;
  type: ManifestNodeType;
}

export interface ManifestEdge {
  source: string;
  target: string;
  label: string;
}

export interface NodeDetailField {
  label: string;
  value: string;
}

export interface NodeDetail {
  title: string;
  kind: string; // "Route" | "Component" | "Action" | "Flow"
  fields: NodeDetailField[];
}

export interface RouteComponent {
  name: string;
  aiId: string;
}

export interface RouteEntry {
  path: string;
  components: RouteComponent[];
}

export interface ComponentRow {
  name: string;
  aiId: string;
  props: string;
}

export interface Flow {
  name: string;
  steps: string[];
}

export type KnowledgeDocType = "route" | "component" | "flow" | "faq";

export interface KnowledgeDoc {
  id: string;
  type: KnowledgeDocType;
  text: string;
  file: string;
}

export interface InstalledModel {
  name: string;
  size: string;
  isDefault?: boolean;
}
