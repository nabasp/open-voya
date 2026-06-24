import path from 'path'
import { app } from 'electron'
import Database from 'better-sqlite3'

import { runMigrations } from './migrations'

let db: Database.Database | null = null

/**
 * Opens (once) the app's SQLite database at `<userData>/openvoya.db`, applies
 * pending migrations, and returns the shared connection. Native binary is
 * rebuilt against the Electron ABI by the install-app-deps postinstall.
 */
export function getDb(): Database.Database {
  if (db) return db

  const file = path.join(app.getPath('userData'), 'openvoya.db')
  db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
