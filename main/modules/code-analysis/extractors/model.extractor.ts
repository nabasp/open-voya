import fs from 'fs'
import path from 'path'

import { Node } from 'ts-morph'

import type { ModelNode } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

const ENTITY_FILE = /\.(model|entity|schema)\.(ts|js)$/
const ENTITY_DIR = /(?:^|\/)(models|entities|schema|schemas)\//

/**
 * Discover data models from two sources:
 *  - `schema.prisma` files: each `model X { … }` block, with relationships
 *    inferred from fields typed as other model names.
 *  - TS interfaces / types / classes that look like entities (TypeORM `@Entity`,
 *    `*.model.ts` / `*.entity.ts`, or files under `models/` / `entities/`).
 */
export function extractModels(ctx: ExtractContext): ModelNode[] {
  const models: ModelNode[] = []

  // --- Prisma schemas ---
  for (const f of ctx.files) {
    if (f.name !== 'schema.prisma' && !f.name.endsWith('.prisma')) continue
    let content = ''
    try {
      content = fs.readFileSync(f.absPath, 'utf8')
    } catch {
      continue
    }
    models.push(...parsePrisma(content, f.relPath))
  }

  // --- TS/JS entities ---
  for (const sf of ctx.sourceFiles) {
    const abs = sf.getFilePath()
    const relPath = toPosix(path.relative(ctx.repoRoot, abs))
    const looksLikeEntityFile = ENTITY_FILE.test(relPath) || ENTITY_DIR.test(relPath)

    for (const [name, decls] of Array.from(sf.getExportedDeclarations())) {
      const decl = decls[0]
      if (!decl) continue
      const isEntity =
        hasEntityDecorator(decl) ||
        (looksLikeEntityFile &&
          (Node.isInterfaceDeclaration(decl) ||
            Node.isClassDeclaration(decl) ||
            Node.isTypeAliasDeclaration(decl)))
      if (!isEntity) continue

      models.push({
        id: makeId('model', relPath, name),
        entityName: name,
        schemaName: null,
        modelFile: relPath,
        relationships: entityRelationships(decl),
      })
    }
  }

  return models
}

function parsePrisma(content: string, relPath: string): ModelNode[] {
  const out: ModelNode[] = []
  const modelRe = /model\s+(\w+)\s*\{([^}]*)\}/g
  let m: RegExpExecArray | null
  // Collect model names first to resolve relationship references.
  const names = new Set<string>()
  let scan: RegExpExecArray | null
  const nameRe = /model\s+(\w+)\s*\{/g
  while ((scan = nameRe.exec(content))) names.add(scan[1])

  while ((m = modelRe.exec(content))) {
    const entityName = m[1]
    const body = m[2]
    const relationships = new Set<string>()
    for (const line of body.split('\n')) {
      const fieldType = line.trim().split(/\s+/)[1]
      if (!fieldType) continue
      const base = fieldType.replace(/[\[\]?]/g, '')
      if (base !== entityName && names.has(base)) relationships.add(base)
    }
    out.push({
      id: makeId('model', relPath, entityName),
      entityName,
      schemaName: entityName,
      modelFile: relPath,
      relationships: Array.from(relationships),
    })
  }
  return out
}

function hasEntityDecorator(decl: Node): boolean {
  if (!Node.isClassDeclaration(decl)) return false
  return decl.getDecorators().some((d) => /^(Entity|Schema|Table)$/i.test(d.getName()))
}

function entityRelationships(decl: Node): string[] {
  // For classes: collect property types that reference other PascalCase types.
  const rels = new Set<string>()
  if (Node.isClassDeclaration(decl)) {
    for (const prop of decl.getProperties()) {
      const t = prop.getTypeNode()?.getText()
      if (t) collectTypeRefs(t, rels)
    }
  } else if (Node.isInterfaceDeclaration(decl)) {
    for (const prop of decl.getProperties()) {
      const t = prop.getTypeNode()?.getText()
      if (t) collectTypeRefs(t, rels)
    }
  }
  return Array.from(rels)
}

function collectTypeRefs(typeText: string, into: Set<string>): void {
  const base = typeText.replace(/\[\]/g, '').trim()
  if (/^[A-Z][A-Za-z0-9]*$/.test(base) && !PRIMITIVES.has(base)) into.add(base)
}

const PRIMITIVES = new Set(['String', 'Number', 'Boolean', 'Date', 'Object', 'Array', 'Promise'])
