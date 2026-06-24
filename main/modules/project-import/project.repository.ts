import { getDb } from '../../db/database'
import type {
  BuildLogEvent,
  LogLevel,
  Project,
  ProjectRow,
  ProjectStatus,
  SourceType,
} from './types'

interface LogRow {
  project_id: string
  stage_id: string | null
  ts: string
  level: LogLevel
  message: string
  progress_key: string | null
}

export interface AppendLogInput {
  projectId: string
  stageId: string | null
  ts: string
  level: LogLevel
  message: string
  progressKey?: string
}

function rowToProject(r: ProjectRow): Project {
  return {
    id: r.id,
    name: r.name,
    sourceType: r.source_type,
    gitUrl: r.git_url,
    originalPath: r.original_path,
    localProjectPath: r.local_project_path,
    branch: r.branch,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export interface CreateProjectInput {
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

/** Thin prepared-statement wrapper over the `projects` table (no ORM). */
export const projectRepository = {
  create(input: CreateProjectInput): Project {
    getDb()
      .prepare(
        `INSERT INTO projects
          (id, name, source_type, git_url, original_path, local_project_path, branch, status, created_at, updated_at)
         VALUES
          (@id, @name, @sourceType, @gitUrl, @originalPath, @localProjectPath, @branch, @status, @createdAt, @updatedAt)`
      )
      .run(input)
    return this.get(input.id)!
  },

  updateStatus(id: string, status: ProjectStatus): void {
    getDb()
      .prepare(`UPDATE projects SET status = ?, updated_at = ? WHERE id = ?`)
      .run(status, new Date().toISOString(), id)
  },

  list(): Project[] {
    const rows = getDb()
      .prepare(`SELECT * FROM projects ORDER BY created_at DESC`)
      .all() as ProjectRow[]
    return rows.map(rowToProject)
  },

  get(id: string): Project | null {
    const row = getDb()
      .prepare(`SELECT * FROM projects WHERE id = ?`)
      .get(id) as ProjectRow | undefined
    return row ? rowToProject(row) : null
  },

  existsByName(name: string): boolean {
    const row = getDb()
      .prepare(`SELECT 1 FROM projects WHERE name = ? LIMIT 1`)
      .get(name)
    return Boolean(row)
  },

  /**
   * Append a log line. Progress lines (with a progressKey) update the existing
   * row for that project+stage+phase in place instead of inserting a new row.
   */
  appendLog(input: AppendLogInput): void {
    const db = getDb()
    const progressKey = input.progressKey ?? null
    if (progressKey) {
      const res = db
        .prepare(
          `UPDATE project_logs SET message = @message, ts = @ts, level = @level
           WHERE project_id = @projectId AND ifnull(stage_id,'') = ifnull(@stageId,'')
             AND progress_key = @progressKey`
        )
        .run({ ...input, progressKey })
      if (res.changes > 0) return
    }
    db.prepare(
      `INSERT INTO project_logs (project_id, stage_id, ts, level, message, progress_key)
       VALUES (@projectId, @stageId, @ts, @level, @message, @progressKey)`
    ).run({ ...input, progressKey })
  },

  listLogs(projectId: string): BuildLogEvent[] {
    const rows = getDb()
      .prepare(`SELECT * FROM project_logs WHERE project_id = ? ORDER BY id ASC`)
      .all(projectId) as LogRow[]
    return rows.map((r) => ({
      projectId: r.project_id,
      stageId: r.stage_id ?? undefined,
      timestamp: r.ts,
      level: r.level,
      message: r.message,
      progressKey: r.progress_key ?? undefined,
    }))
  },

  deleteLogs(projectId: string): void {
    getDb().prepare(`DELETE FROM project_logs WHERE project_id = ?`).run(projectId)
  },

  /** Remove a project and all its logs in one transaction. */
  deleteProject(id: string): void {
    const db = getDb()
    const tx = db.transaction((pid: string) => {
      db.prepare(`DELETE FROM project_logs WHERE project_id = ?`).run(pid)
      db.prepare(`DELETE FROM projects WHERE id = ?`).run(pid)
    })
    tx(id)
  },

  /** Mark any projects stuck mid-import (e.g. app killed) as failed. */
  reconcileStaleImports(): number {
    const res = getDb()
      .prepare(
        `UPDATE projects SET status = 'failed', updated_at = ? WHERE status = 'importing'`
      )
      .run(new Date().toISOString())
    return res.changes
  },
}
