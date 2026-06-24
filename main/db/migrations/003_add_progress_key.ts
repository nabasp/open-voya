import type { Migration } from './index'

// Adds a progress-phase key so streaming git progress (Counting/Compressing/
// Receiving/Resolving) collapses to one updating row per phase instead of one
// row per percentage tick.
export const migration003: Migration = {
  version: 3,
  up(db) {
    db.exec(`ALTER TABLE project_logs ADD COLUMN progress_key TEXT;`)
  },
}
