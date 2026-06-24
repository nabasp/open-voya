// Domain types for the Import Project module. Pure data — no Electron imports —
// so these can be shared with the renderer via `import type`.

export type SourceType = 'git' | 'local'

export type ProjectStatus =
  | 'pending'
  | 'importing'
  | 'ready'
  | 'building'
  | 'completed'
  | 'failed'

export type LogLevel = 'info' | 'warning' | 'error'

export interface Project {
  id: string
  name: string
  sourceType: SourceType
  gitUrl: string | null
  originalPath: string | null
  localProjectPath: string
  branch: string | null
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

/** Row exactly as stored in SQLite (snake_case). */
export interface ProjectRow {
  id: string
  name: string
  source_type: SourceType
  git_url: string | null
  original_path: string | null
  local_project_path: string
  branch: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export interface BuildLogEvent {
  projectId: string
  timestamp: string
  level: LogLevel
  message: string
  stageId?: string
  // Identifies a progress phase (e.g. "Receiving objects"). Lines sharing a
  // progressKey collapse into a single row that updates in place.
  progressKey?: string
}

export type LogFn = (level: LogLevel, message: string, progressKey?: string) => void

/** Context threaded through every pipeline stage. */
export interface PipelineContext {
  project: Project
  workspacePath: string
  sourceType: SourceType
  gitUrl?: string
  originalPath?: string
  branch?: string
  log: LogFn
  signal?: AbortSignal
}

export interface PipelineStage {
  id: string
  name: string
  execute(ctx: PipelineContext): Promise<void>
}
