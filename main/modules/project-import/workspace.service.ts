import os from 'os'
import path from 'path'
import fs from 'fs'

// Centralized workspace: ~/OpenVoya/projects/<project-name>
export const WORKSPACE_ROOT = path.join(os.homedir(), 'OpenVoya', 'projects')

export function ensureWorkspace(): void {
  fs.mkdirSync(WORKSPACE_ROOT, { recursive: true })
}

export function resolveProjectPath(name: string): string {
  return path.join(WORKSPACE_ROOT, name)
}

/** Allow letters, numbers, dot, dash, underscore — no path separators. */
export function isValidProjectName(name: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(name) && name !== '.' && name !== '..'
}

export function pathExists(p: string): boolean {
  return fs.existsSync(p)
}

export function isNonEmptyDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory() && fs.readdirSync(p).length > 0
  } catch {
    return false
  }
}

/** Best-effort cleanup of a partially-imported destination. */
export function removeDir(p: string): void {
  try {
    fs.rmSync(p, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}
