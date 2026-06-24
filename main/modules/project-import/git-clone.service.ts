import { spawn } from 'child_process'

import type { LogFn } from './types'

// Detects a git progress line ("<phase>: NN% (x/y)") and returns its phase
// label (e.g. "remote: Counting objects", "Receiving objects", "Resolving
// deltas"). Non-progress lines (no percentage) return undefined.
function progressKeyOf(line: string): string | undefined {
  const m = line.match(/^((?:remote:\s*)?[A-Za-z][A-Za-z ]*?):\s+\d+%/)
  return m ? m[1].trim() : undefined
}

export interface GitCloneOptions {
  url: string
  dest: string
  branch?: string
  log: LogFn
  signal?: AbortSignal
}

/**
 * Clone a repository by spawning the system `git`, streaming stdout/stderr
 * line-by-line as live logs. git writes `--progress` output to stderr, so both
 * streams are surfaced as info. Rejects on non-zero exit or spawn error.
 */
export function gitClone({
  url,
  dest,
  branch,
  log,
  signal,
}: GitCloneOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['clone', '--progress']
    if (branch) args.push('--branch', branch)
    args.push(url, dest)

    log('info', `> git ${args.join(' ')}`)

    // GIT_TERMINAL_PROMPT=0 makes auth-required/missing repos fail fast instead
    // of blocking on an interactive credential prompt.
    const child = spawn('git', args, {
      signal,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })

    const stream = (buf: Buffer) => {
      // git uses \r to overwrite a progress line in place. Within a chunk,
      // coalesce repeated updates of the same phase to its latest value so each
      // phase renders as a single updating row.
      const emissions: { message: string; progressKey?: string }[] = []
      const indexByKey = new Map<string, number>()
      for (const raw of buf.toString().split(/\r\n|\r|\n/)) {
        const text = raw.trim()
        if (!text) continue
        const key = progressKeyOf(text)
        if (key) {
          const at = indexByKey.get(key)
          if (at !== undefined) emissions[at] = { message: text, progressKey: key }
          else {
            indexByKey.set(key, emissions.length)
            emissions.push({ message: text, progressKey: key })
          }
        } else {
          emissions.push({ message: text })
        }
      }
      for (const e of emissions) log('info', e.message, e.progressKey)
    }
    child.stdout.on('data', stream)
    child.stderr.on('data', stream)

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        reject(new Error('git is not installed or not on PATH'))
      } else {
        reject(err)
      }
    })

    child.on('close', (code) => {
      if (code === 0) {
        log('info', '> Clone completed')
        resolve()
      } else {
        reject(new Error(`git clone exited with code ${code}`))
      }
    })
  })
}
