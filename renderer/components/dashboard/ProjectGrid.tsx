import { useCallback, useEffect, useState } from "react";

import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { NewProjectCard } from "@/components/dashboard/NewProjectCard";
import { projectIpc } from "@/lib/ipc";
import type { Project as DbProject } from "@/lib/ipc";
import type { Project, ProjectStatus } from "@/types";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function toViewStatus(s: DbProject["status"]): ProjectStatus {
  if (s === "ready" || s === "completed") return "ready";
  if (s === "failed") return "error";
  return "generating"; // pending | importing | building
}

function toView(p: DbProject): Project {
  return {
    id: p.id,
    name: p.name,
    repo: p.gitUrl ?? p.localProjectPath,
    status: toViewStatus(p.status),
    updatedLabel: relativeTime(p.updatedAt),
    progressLabel: "Importing…",
    error: p.status === "failed" ? "Import failed — check the build log." : undefined,
  };
}

export function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>([]);

  const refresh = useCallback(() => {
    if (!projectIpc.available()) return;
    projectIpc
      .list()
      .then((rows) => setProjects(rows.map(toView)))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    refresh();
    if (!projectIpc.available()) return;
    const off = projectIpc.onListChanged(refresh);
    return () => off?.();
  }, [refresh]);

  return (
    <div className="mt-5 grid grid-cols-3 gap-4.5">
      {projects.map((project) => (
        <ProjectCard key={project.id ?? project.name} project={project} />
      ))}
      <NewProjectCard />
    </div>
  );
}
