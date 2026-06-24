import type { Relationship } from '../types'
import { fileIdFor, type ExtractContext } from '../extractors/context'

/**
 * Build file→file dependency relationships from resolved imports/re-exports.
 * Only edges between inventoried local files are emitted (external packages are
 * tracked on the component/service nodes, not as graph edges).
 */
export function analyzeDependencies(ctx: ExtractContext): Relationship[] {
  const relationships: Relationship[] = []
  const seen = new Set<string>()

  for (const [absPath, ie] of Array.from(ctx.importsByAbsPath)) {
    const fromId = fileIdFor(ctx, absPath)
    if (!fromId) continue
    for (const imp of ie.imports) {
      if (!imp.resolvedAbsPath) continue
      const toId = fileIdFor(ctx, imp.resolvedAbsPath)
      if (!toId || toId === fromId) continue
      const key = `${fromId}->${toId}`
      if (seen.has(key)) continue
      seen.add(key)
      relationships.push({ fromId, toId, type: 'imports' })
    }
  }

  return relationships
}
