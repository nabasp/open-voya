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

  const { logs: liveLogs, status: liveStatus, stageStates } = useImportLogs(projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [history, setHistory] = useState<BuildLogEvent[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | undefined>(undefined);
  // While true, the view auto-follows the running stage; a manual stage click
  // pins the selection and stops following.
  const [followActive, setFollowActive] = useState(true);

  // Load the project + persisted log history whenever the route changes.
  useEffect(() => {
    setSelectedStageId(undefined);
    setFollowActive(true);
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

  // Stages that produced at least one log line have run (used to reconstruct
  // state when replaying a finished/failed project that emitted no live events
  // this session).
  const stagesWithLogs = useMemo(() => {
    const s = new Set<string>();
    for (const l of mergedLogs) if (l.stageId) s.add(l.stageId);
    return s;
  }, [mergedLogs]);

  // Resolve each row's state: live per-stage events win; otherwise fall back to
  // log history + overall status. Only stages that actually ran are marked done.
  const resolveState = (id: string, i: number): StageRow["state"] => {
    const live = stageStates[id];
    if (live) return live;
    if (effectiveStatus === "ready" || effectiveStatus === "failed") {
      return stagesWithLogs.has(id) ? "done" : "pending";
    }
    // importing / building, before this stage emitted an event
    if (stagesWithLogs.has(id)) return "done";
    return i === 0 ? "active" : "pending";
  };

  const liveStages: StageRow[] = stageDefs.map((def, i) => ({
    id: def.id,
    label: def.label,
    state: resolveState(def.id, i),
  }));

  const doneCount = liveStages.filter((s) => s.state === "done").length;
  const hasActive = liveStages.some((s) => s.state === "active");
  const overall = Math.min(
    100,
    Math.round(((doneCount + (hasActive ? 0.5 : 0)) / stageDefs.length) * 100)
  );

  // The currently running stage (the one to auto-follow).
  const activeStageId = liveStages.find((s) => s.state === "active")?.id;

  // Auto-advance the selection to the running stage while following.
  useEffect(() => {
    if (followActive && activeStageId) setSelectedStageId(activeStageId);
  }, [followActive, activeStageId]);

  // A manual stage click pins the selection and stops auto-following.
  const handleSelectStage = (id: string) => {
    setFollowActive(false);
    setSelectedStageId(id);
  };

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
              onSelectStage={handleSelectStage}
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
