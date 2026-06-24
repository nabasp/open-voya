import { createHash } from 'crypto'

/** Short stable sha-256 (hex) of arbitrary content — used for file hashes. */
export function sha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex')
}
