import type { Migration } from './index'

// Initial schema: the `projects` table backing the Import Project workflow.
export const migration001: Migration = {
  version: 1,
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id                 TEXT PRIMARY KEY,
        name               TEXT NOT NULL,
        source_type        TEXT NOT NULL,
        git_url            TEXT,
        original_path      TEXT,
        local_project_path TEXT NOT NULL,
        branch             TEXT,
        status             TEXT NOT NULL,
        created_at         TEXT NOT NULL,
        updated_at         TEXT NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_path ON projects(local_project_path);
      CREATE INDEX        IF NOT EXISTS idx_projects_status ON projects(status);
    `)
  },
}
