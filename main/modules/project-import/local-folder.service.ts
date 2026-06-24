import fsp from 'fs/promises'
import path from 'path'

import type { LogFn } from './types'

export interface LocalImportOptions {
  src: string
  dest: string
  log: LogFn
  signal?: AbortSignal
}

/**
 * Copy a local folder into the workspace, emitting a log line per top-level
 * entry so progress is visible incrementally. Throws on any copy failure.
 */
export async function copyLocalFolder({
  src,
  dest,
  log,
}: LocalImportOptions): Promise<void> {
  log('info', '> Creating workspace')
  await fsp.mkdir(dest, { recursive: true })

  log('info', '> Copying files')
  const entries = await fsp.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    await fsp.cp(from, to, { recursive: true })
    log('info', `Copied ${entry.name}${entry.isDirectory() ? '/' : ''}`)
  }

  log('info', '> Import completed')
}
