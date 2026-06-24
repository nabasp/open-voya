import type DatabaseType from 'better-sqlite3'

import { migration001 } from './001_init_projects'
import { migration002 } from './002_project_logs'
import { migration003 } from './003_add_progress_key'

export interface Migration {
  version: number
  up: (db: DatabaseType.Database) => void
}

// Ordered list of schema migrations. Append new ones with incrementing versions.
const MIGRATIONS: Migration[] = [migration001, migration002, migration003]

/**
 * Hand-rolled migration runner keyed on SQLite's `user_version` pragma.
 * Applies each pending migration inside a transaction, then bumps the version.
 */
export function runMigrations(db: DatabaseType.Database): void {
  const current = db.pragma('user_version', { simple: true }) as number
  const pending = MIGRATIONS.filter((m) => m.version > current).sort(
    (a, b) => a.version - b.version
  )

  for (const migration of pending) {
    const apply = db.transaction(() => {
      migration.up(db)
      db.pragma(`user_version = ${migration.version}`)
    })
    apply()
  }
}
