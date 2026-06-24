// Typed renderer client over the preload `window.ipc` bridge.
// Payload TYPES come from the main-process IPC contract (type-only, erased at
// build — same cross-import precedent as renderer/preload.d.ts). Channel name
// strings are mirrored locally to avoid bundling main code into the renderer.

import type {
  BuildLogEvent,
  ImportRequest,
  PickFolderResult,
  Project,
  StartResult,
  StatusEvent,
  ValidateResult,
} from "../../main/modules/project-import/ipc-contract";

const CH = {
  pickFolder: "project.import.pickFolder",
  validate: "project.import.validate",
  start: "project.import.start",
  history: "project.import.history",
  delete: "project.delete",
  list: "project.list",
  get: "project.get",
  logs: "project.import.logs",
  status: "project.import.status",
  listChanged: "project.list.changed",
} as const;

function available(): boolean {
  return typeof window !== "undefined" && Boolean(window.ipc);
}

export const projectIpc = {
  available,
  pickFolder: () => window.ipc.invoke<undefined, PickFolderResult>(CH.pickFolder),
  validate: (req: ImportRequest) =>
    window.ipc.invoke<ImportRequest, ValidateResult>(CH.validate, req),
  start: (req: ImportRequest) =>
    window.ipc.invoke<ImportRequest, StartResult>(CH.start, req),
  history: (id: string) =>
    window.ipc.invoke<{ id: string }, BuildLogEvent[]>(CH.history, { id }),
  remove: (id: string) =>
    window.ipc.invoke<{ id: string }, { ok: boolean }>(CH.delete, { id }),
  list: () => window.ipc.invoke<undefined, Project[]>(CH.list),
  get: (id: string) =>
    window.ipc.invoke<{ id: string }, Project | null>(CH.get, { id }),
  onLogs: (cb: (e: BuildLogEvent) => void) =>
    window.ipc.on<BuildLogEvent>(CH.logs, cb),
  onStatus: (cb: (e: StatusEvent) => void) =>
    window.ipc.on<StatusEvent>(CH.status, cb),
  onListChanged: (cb: () => void) => window.ipc.on(CH.listChanged, cb),
};

export type { BuildLogEvent, ImportRequest, Project, StatusEvent };
