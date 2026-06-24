import path from 'path'

import { Node, SyntaxKind } from 'ts-morph'

import type { ComponentNode, ComponentType } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/

/**
 * Discover React components: exported, PascalCase-named function / arrow /
 * class declarations (in .tsx/.jsx files, or any file) that render JSX.
 */
export function extractComponents(ctx: ExtractContext): ComponentNode[] {
  const components: ComponentNode[] = []

  for (const sf of ctx.sourceFiles) {
    const ext = path.extname(sf.getFilePath())
    // JSX only lives in tsx/jsx; cheaply skip the rest.
    if (ext !== '.tsx' && ext !== '.jsx') continue

    const relPath = toPosix(path.relative(ctx.repoRoot, sf.getFilePath()))
    const ie = ctx.importsByAbsPath.get(sf.getFilePath())
    const importNames = ie ? dedupe(ie.imports.flatMap((i) => i.names)) : []

    for (const [name, decls] of Array.from(sf.getExportedDeclarations())) {
      if (!PASCAL_CASE.test(name)) continue
      const decl = decls[0]
      if (!decl) continue
      const type = componentType(decl)
      if (!type) continue
      if (!rendersJsx(decl)) continue

      components.push({
        id: makeId('component', relPath, name),
        name,
        type,
        filePath: relPath,
        exports: [name],
        imports: importNames,
      })
    }
  }

  return components
}

function componentType(decl: Node): ComponentType | null {
  if (Node.isFunctionDeclaration(decl)) return 'function'
  if (Node.isClassDeclaration(decl)) return 'class'
  if (Node.isVariableDeclaration(decl)) {
    const init = decl.getInitializer()
    if (!init) return null
    if (Node.isArrowFunction(init)) return 'arrow'
    if (Node.isFunctionExpression(init)) return 'function'
    if (Node.isCallExpression(init)) return 'memo' // memo()/forwardRef() wrappers
    return null
  }
  return null
}

function rendersJsx(decl: Node): boolean {
  return (
    decl.getFirstDescendantByKind(SyntaxKind.JsxElement) !== undefined ||
    decl.getFirstDescendantByKind(SyntaxKind.JsxSelfClosingElement) !== undefined ||
    decl.getFirstDescendantByKind(SyntaxKind.JsxFragment) !== undefined
  )
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr))
}
