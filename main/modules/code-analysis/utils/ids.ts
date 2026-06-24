import { createHash } from 'crypto'

/** Deterministic id from one or more parts (stable across runs for the same input). */
export function makeId(prefix: string, ...parts: string[]): string {
  const h = createHash('sha1').update(parts.join('::')).digest('hex').slice(0, 12)
  return `${prefix}_${h}`
}

/** Normalize a path to POSIX separators so ids/relPaths are OS-independent. */
export function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}
