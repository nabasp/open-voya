import type { Migration } from './index'

// Persisted import/build logs, tagged per stage so the Build screen can replay
// history and filter by the selected pipeline stage.
export const migration002: Migration = {
  version: 2,
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS project_logs (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        stage_id   TEXT,
        ts         TEXT NOT NULL,
        level      TEXT NOT NULL,
        message    TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );

      CREATE INDEX IF NOT EXISTS idx_project_logs_project ON project_logs(project_id);
    `)
  },
}
