# Project Import module

Imports a project (Git clone or local-folder copy) into the workspace, persists
it in SQLite, and streams live logs to the renderer. Built as a pluggable
pipeline so future build stages slot in without refactoring.

## Flow
`ImportDialog` → `project.import.start` → validate → create record (`importing`)
→ `PipelineEngine.run([cloneStage | copyStage])` → stream logs/status → `ready`
(or `failed`, with the partial workspace dir cleaned up).

## Workspace
`~/OpenVoya/projects/<project-name>` (see `workspace.service.ts`).
DB: `<userData>/openvoya.db` (see `../../db/database.ts`).

## IPC channels (`ipc-contract.ts`)
Request/response (`window.ipc.invoke`):
- `project.import.pickFolder` → `{ path }` (native dir picker)
- `project.import.validate` `{ ImportRequest }` → `{ ok, error? }`
- `project.import.start` `{ ImportRequest }` → `{ projectId }` (pipeline runs async)
- `project.list` → `Project[]`
- `project.get` `{ id }` → `Project | null`

Events (`window.ipc.on`):
- `project.import.logs` → `BuildLogEvent { projectId, timestamp, level, message }`
- `project.import.status` → `{ projectId, status, stageId?, stageStatus?, error? }`
- `project.list.changed` → `{}`

## Status lifecycle
`pending → importing → ready | failed`. `building` / `completed` are reserved
for the future multi-stage build pipeline. On startup, any project left
`importing` (e.g. app killed mid-import) is reconciled to `failed`
(`projectRepository.reconcileStaleImports`).

## Adding future build stages
Implement `PipelineStage { id, name, execute(ctx) }` and append to the stage
array in `project-import.service.ts`. Stage `id`s should match the renderer's
pipeline rows so the Build screen can map status events.

## Recommended future tables (not yet created)
- `project_logs(id, project_id, ts, level, message)` — persist logs so the Build
  screen can replay them after a refresh / app restart (currently in-memory).
- `project_pipeline_stages(id, project_id, stage_id, name, status, started_at,
  finished_at, error)` — per-stage tracking once multi-stage builds exist.
