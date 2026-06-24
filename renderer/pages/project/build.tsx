import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { ProjectWorkspace } from "@/components/layout/ProjectWorkspace";
import {
  PipelineStageList,
  type StageRow,
} from "@/components/build/PipelineStageList";
import { LiveLogPanel, type LogRow } from "@/components/build/LiveLogPanel";
import { BuildStatStrip } from "@/components/build/BuildStatStrip";
import { useImportLogs } from "@/hooks/useImportLogs";
import { projectIpc } from "@/lib/ipc";
import type { BuildLogEvent, Project } from "@/lib/ipc";
import { getStageDefs } from "@/data/buildStages";

// Mirrors the backend git progress detection so logs persisted before
// progressKey existed still collapse in the view.
function deriveProgressKey(message: string): string | undefined {
  const m = message.match(/^((?:remote:\s*)?[A-Za-z][A-Za-z ]*?):\s+\d+%/);
  return m ? m[1].trim() : undefined;
}

function mergeKey(l: BuildLogEvent): string {
  // Progress rows collapse by phase (per stage); other rows dedupe exactly.
  const progressKey = l.progressKey ?? deriveProgressKey(l.message);
  return progressKey
    ? `p:${l.stageId ?? ""}:${progressKey}`
    : `l:${l.timestamp}:${l.stageId ?? ""}:${l.message}`;
}

function toLogRow(l: BuildLogEvent): LogRow {
  return {
    text: l.message,
    kind:
      l.level === "error"
        ? "error"
        : l.level === "warning"
          ? "warning"
          : l.message.startsWith(">")
            ? "accent"
            : "muted",
  };
}

export default function BuildPage() {
  const router = useRouter();
  const projectId =
    typeof router.query.projectId === "string" ? router.query.projectId : undefined;
  const live = Boolean(projectId);

  const { logs: liveLogs, status: liveStatus } = useImportLogs(projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [history, setHistory] = useState<BuildLogEvent[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | undefined>(undefined);

  // Load the project + persisted log history whenever the route changes.
  useEffect(() => {
    setSelectedStageId(undefined);
    setHistory([]);
    if (!projectId || !projectIpc.available()) {
      setProject(null);
      return;
    }
    projectIpc.get(projectId).then(setProject).catch(() => setProject(null));
    projectIpc.history(projectId).then(setHistory).catch(() => setHistory([]));
  }, [projectId]);

  const stageDefs = getStageDefs(project?.sourceType);
  const firstId = stageDefs[0].id;
  const effectiveStatus = liveStatus ?? project?.status;

  // Merge persisted history with live-streamed logs. Progress phases update in
  // place (keeping their first-seen position); other lines dedupe.
  const mergedLogs = useMemo(() => {
    const out: BuildLogEvent[] = [];
    const indexByKey = new Map<string, number>();
    for (const l of [...history, ...liveLogs]) {
      const k = mergeKey(l);
      const at = indexByKey.get(k);
      if (at !== undefined) out[at] = l;
      else {
        indexByKey.set(k, out.length);
        out.push(l);
      }
    }
    return out;
  }, [history, liveLogs]);

  const firstState: StageRow["state"] =
    effectiveStatus === "ready"
      ? "done"
      : effectiveStatus === "failed"
        ? "failed"
        : "active";

  const liveStages: StageRow[] = stageDefs.map((def, i) => ({
    id: def.id,
    label: def.label,
    state: i === 0 ? firstState : "pending",
  }));
  const overall =
    effectiveStatus === "ready"
      ? 100
      : effectiveStatus === "failed"
        ? 0
        : firstState === "done"
          ? 20
          : 6;

  const selected = selectedStageId ?? firstId;
  const shownLines: LogRow[] = mergedLogs
    .filter((l) => (l.stageId ?? firstId) === selected)
    .map(toLogRow);

  return (
    <>
      <Head>
        <title>open voya — Build</title>
      </Head>
      <ProjectWorkspace>
        <div className="grid grid-cols-2 gap-4.5">
          {live ? (
            <PipelineStageList
              stages={liveStages}
              overall={overall}
              selectedId={selected}
              onSelectStage={setSelectedStageId}
            />
          ) : (
            <PipelineStageList />
          )}
          {live ? (
            <LiveLogPanel
              lines={shownLines}
              emptyText={
                selected === firstId
                  ? "Waiting for output…"
                  : "Stage not run yet — no logs."
              }
            />
          ) : (
            <LiveLogPanel />
          )}
        </div>
        <div className="mt-4.5">
          <BuildStatStrip />
        </div>
      </ProjectWorkspace>
    </>
  );
}
