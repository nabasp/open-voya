import path from 'path'

import { Node, SyntaxKind } from 'ts-morph'
import type { ExportedDeclarations } from 'ts-morph'

import type { HookNode } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

const CUSTOM_HOOK = /^use[A-Z]/
const SIDE_EFFECT_CALLS = ['useEffect', 'useLayoutEffect', 'fetch', 'axios', 'useMutation', 'dispatch']

/**
 * Discover custom hooks: exported functions/arrows named `use[A-Z]…`. Records
 * input parameters, return shape (outputs), and observed side effects
 * (useEffect, fetch/axios, dispatch, mutations).
 */
export function extractHooks(ctx: ExtractContext): HookNode[] {
  const hooks: HookNode[] = []

  for (const sf of ctx.sourceFiles) {
    const relPath = toPosix(path.relative(ctx.repoRoot, sf.getFilePath()))

    for (const [name, decls] of Array.from(sf.getExportedDeclarations())) {
      if (!CUSTOM_HOOK.test(name)) continue
      const decl = decls[0]
      if (!decl) continue
      const fn = fnNode(decl)
      if (!fn) continue

      hooks.push({
        id: makeId('hook', relPath, name),
        name,
        type: 'hook',
        filePath: relPath,
        lineNumber: decl.getStartLineNumber(),
        inputs: paramNames(fn),
        outputs: returnNames(fn),
        sideEffects: sideEffects(fn),
      })
    }
  }

  return hooks
}

function fnNode(decl: ExportedDeclarations): Node | null {
  if (Node.isFunctionDeclaration(decl)) return decl
  if (Node.isVariableDeclaration(decl)) {
    const init = decl.getInitializer()
    if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) return init
  }
  return null
}

function paramNames(fn: Node): string[] {
  const f = fn as unknown as {
    getParameters?: () => import('ts-morph').ParameterDeclaration[]
  }
  if (typeof f.getParameters !== 'function') return []
  return f.getParameters().map((p) => p.getName())
}

function returnNames(fn: Node): string[] {
  // Find the function's own return statements (not nested closures' returns is
  // hard to exclude cheaply; first return is the representative shape).
  const ret = fn.getFirstDescendantByKind(SyntaxKind.ReturnStatement)
  const expr = ret?.getExpression()
  if (!expr) return []
  if (Node.isObjectLiteralExpression(expr)) {
    return expr.getProperties().map((p) => (Node.isPropertyAssignment(p) || Node.isShorthandPropertyAssignment(p) ? p.getName() : p.getText()))
  }
  if (Node.isArrayLiteralExpression(expr)) {
    return expr.getElements().map((e) => e.getText())
  }
  return [expr.getText().slice(0, 40)]
}

function sideEffects(fn: Node): string[] {
  const effects = new Set<string>()
  for (const call of fn.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expr = call.getExpression()
    const head = Node.isPropertyAccessExpression(expr)
      ? expr.getExpression().getText()
      : expr.getText()
    for (const sig of SIDE_EFFECT_CALLS) {
      if (head === sig || expr.getText() === sig) effects.add(sig)
    }
  }
  return Array.from(effects)
}
