import type { Project } from "@/types";

// Dashboard project grid — lifted from the design (4 cards + New Project tile).
export const PROJECTS: Project[] = [
  {
    name: "billing-app",
    repo: "github.com/acme/billing-app",
    status: "ready",
    updatedLabel: "2h ago",
    routes: 12,
    targets: 89,
    model: "qwen2.5-3b · Q4_K_M",
  },
  {
    name: "crm-dashboard",
    repo: "github.com/acme/crm-dashboard",
    status: "generating",
    updatedLabel: "now",
    routes: 34,
    targets: 211,
    model: "qwen2.5-3b · Q4_K_M",
    progress: 78,
    progressLabel: "Embedding docs…",
  },
  {
    name: "analytics-portal",
    repo: "github.com/acme/analytics-portal",
    status: "ready",
    updatedLabel: "1d ago",
    routes: 21,
    targets: 148,
    model: "gemma-3-1b · Q4_K_M",
  },
  {
    name: "docs-site",
    repo: "github.com/acme/docs-site",
    status: "error",
    updatedLabel: "3d ago",
    error: "react-router-dom not found — navigate actions are unavailable.",
  },
];
