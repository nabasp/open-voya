import path from 'path'

import { Node, SyntaxKind } from 'ts-morph'
import type { SourceFile } from 'ts-morph'

import type { StateNode } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

/**
 * Discover state management:
 *  - Redux slices: `createSlice({ name: '...' })`
 *  - Zustand stores: `create(...)` / `createStore(...)`
 *  - React Context: `createContext(...)`
 *  - useState clusters: files with ≥3 useState calls (local-state-heavy)
 */
export function extractState(ctx: ExtractContext): StateNode[] {
  const state: StateNode[] = []

  for (const sf of ctx.sourceFiles) {
    const relPath = toPosix(path.relative(ctx.repoRoot, sf.getFilePath()))
    let useStateCount = 0
    let firstUseStateLine = 0

    for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const expr = call.getExpression()
      const fn = expr.getText()
      const line = call.getStartLineNumber()

      if (fn === 'createSlice') {
        state.push({
          id: makeId('state', relPath, 'slice', String(line)),
          name: sliceName(call) ?? variableNameOf(call) ?? 'slice',
          type: 'redux-slice',
          filePath: relPath,
          lineNumber: line,
          detail: 'redux toolkit createSlice',
        })
      } else if (fn === 'create' || fn === 'createStore') {
        // Heuristic: only treat as zustand when imported from zustand or the
        // store name suggests it; keep it permissive but labelled.
        if (isZustand(sf)) {
          state.push({
            id: makeId('state', relPath, 'zustand', String(line)),
            name: variableNameOf(call) ?? 'store',
            type: 'zustand-store',
            filePath: relPath,
            lineNumber: line,
            detail: 'zustand create',
          })
        }
      } else if (fn === 'createContext') {
        state.push({
          id: makeId('state', relPath, 'context', String(line)),
          name: variableNameOf(call) ?? 'Context',
          type: 'context',
          filePath: relPath,
          lineNumber: line,
          detail: 'React.createContext',
        })
      } else if (fn === 'useState') {
        useStateCount++
        if (firstUseStateLine === 0) firstUseStateLine = line
      }
    }

    if (useStateCount >= 3) {
      state.push({
        id: makeId('state', relPath, 'usestate'),
        name: `${path.basename(relPath)} local state`,
        type: 'usestate-cluster',
        filePath: relPath,
        lineNumber: firstUseStateLine || 1,
        detail: `${useStateCount} useState hooks`,
      })
    }
  }

  return state
}

function sliceName(call: import('ts-morph').CallExpression): string | null {
  const arg = call.getArguments()[0]
  if (arg && Node.isObjectLiteralExpression(arg)) {
    const prop = arg.getProperty('name')
    if (prop && Node.isPropertyAssignment(prop)) {
      const init = prop.getInitializer()
      if (init && Node.isStringLiteral(init)) return init.getLiteralText()
    }
  }
  return null
}

/** Walk up to the enclosing `const X = …` to name the store/context. */
function variableNameOf(call: Node): string | null {
  const varDecl = call.getFirstAncestorByKind(SyntaxKind.VariableDeclaration)
  return varDecl ? varDecl.getName() : null
}

function isZustand(sf: SourceFile): boolean {
  return sf.getImportDeclarations().some((d) => /zustand/.test(d.getModuleSpecifierValue()))
}
