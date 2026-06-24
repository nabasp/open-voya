import { useEffect, useState } from "react";

import { projectIpc } from "@/lib/ipc";
import type { BuildLogEvent, StatusEvent } from "@/lib/ipc";

export type StageState = "active" | "done" | "failed";
export type LiveStatus = StatusEvent["status"];

export interface UseImportLogs {
  logs: BuildLogEvent[];
  status: LiveStatus | undefined;
  stageStates: Record<string, StageState>;
}

/**
 * Subscribes to live import logs + status for one project. Returns the
 * accumulated log lines, the latest overall status, and a per-stage state map.
 * No-ops on the server / when the preload bridge is unavailable.
 */
export function useImportLogs(projectId: string | undefined): UseImportLogs {
  const [logs, setLogs] = useState<BuildLogEvent[]>([]);
  const [status, setStatus] = useState<LiveStatus | undefined>(undefined);
  const [stageStates, setStageStates] = useState<Record<string, StageState>>({});

  useEffect(() => {
    setLogs([]);
    setStatus(undefined);
    setStageStates({});
    if (!projectId || !projectIpc.available()) return;

    const offLogs = projectIpc.onLogs((e) => {
      if (e.projectId === projectId) setLogs((prev) => [...prev, e]);
    });
    const offStatus = projectIpc.onStatus((e) => {
      if (e.projectId !== projectId) return;
      setStatus(e.status);
      if (e.stageId && e.stageStatus) {
        setStageStates((prev) => ({ ...prev, [e.stageId!]: e.stageStatus! }));
      }
    });

    return () => {
      offLogs?.();
      offStatus?.();
    };
  }, [projectId]);

  return { logs, status, stageStates };
}
