import fs from 'fs'
import path from 'path'

import type { FileNode, RepositoryMeta } from '../types'
import { isIgnoredDir } from '../utils/ignore'
import { sha256 } from '../utils/hash'
import { makeId, toPosix } from '../utils/ids'

export interface ScanResult {
  repository: RepositoryMeta
  files: FileNode[]
}

// Cap the per-file content read for hashing so a stray huge asset can't stall
// the scan; larger files are hashed by their size+path stat fingerprint instead.
const MAX_HASH_BYTES = 2 * 1024 * 1024 // 2MB

/**
 * Walk the cloned repository, skipping ignored directories, and build the
 * repository metadata + complete file inventory. Every file (not just source)
 * is inventoried, matching the spec's "capture every source file" intent while
 * giving downstream stages full visibility.
 */
export function scanRepository(repoRoot: string, projectName: string): ScanResult {
  const files: FileNode[] = []
  let totalDirectories = 0

  const walk = (dir: string): void => {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (isIgnoredDir(entry.name)) continue
        totalDirectories++
        walk(abs)
      } else if (entry.isFile()) {
        files.push(buildFileNode(repoRoot, abs))
      }
    }
  }

  walk(repoRoot)

  const repository: RepositoryMeta = {
    projectName,
    repoPath: repoRoot,
    repoRoot,
    totalFiles: files.length,
    totalDirectories,
    scanTimestamp: new Date().toISOString(),
  }

  return { repository, files }
}

function buildFileNode(repoRoot: string, abs: string): FileNode {
  const relPath = toPosix(path.relative(repoRoot, abs))
  let size = 0
  let hash = ''
  try {
    const stat = fs.statSync(abs)
    size = stat.size
    if (size <= MAX_HASH_BYTES) {
      hash = sha256(fs.readFileSync(abs))
    } else {
      hash = sha256(`${relPath}:${size}:${stat.mtimeMs}`)
    }
  } catch {
    hash = sha256(relPath)
  }

  return {
    id: makeId('file', relPath),
    name: path.basename(abs),
    ext: path.extname(abs),
    relPath,
    absPath: abs,
    size,
    hash,
  }
}
