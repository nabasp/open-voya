import path from 'path'

import { Node, SyntaxKind } from 'ts-morph'
import type { ExportedDeclarations } from 'ts-morph'

import type { ComponentNode, ComponentType } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/

/**
 * Discover React components. A component is an exported declaration (named OR
 * default) that is either:
 *   - a class extending React.Component / PureComponent / Component, or
 *   - a function / arrow / function-expression that renders JSX.
 * Default exports (keyed "default" by ts-morph) and lowercase-named class
 * components are handled — this was the gap that dropped `export default`
 * components entirely.
 */
export function extractComponents(ctx: ExtractContext): ComponentNode[] {
  const components: ComponentNode[] = []

  for (const sf of ctx.sourceFiles) {
    const ext = path.extname(sf.getFilePath())
    if (ext !== '.tsx' && ext !== '.jsx') continue

    const relPath = toPosix(path.relative(ctx.repoRoot, sf.getFilePath()))
    const ie = ctx.importsByAbsPath.get(sf.getFilePath())
    const importNames = ie ? dedupe(ie.imports.flatMap((i) => i.names)) : []

    for (const [key, decls] of Array.from(sf.getExportedDeclarations())) {
      const decl = decls[0]
      if (!decl) continue

      const isClassComp = isClassComponent(decl)
      const isFnComp = isFunctionComponent(decl)
      if (!isClassComp && !isFnComp) continue

      const name = resolveName(key, decl, relPath)
      // Skip non-component helpers that render JSX but aren't named like a
      // component (lowercase) unless they're an explicit class component.
      if (!isClassComp && !PASCAL_CASE.test(name)) continue

      components.push({
        id: makeId('component', relPath, name),
        name,
        type: componentType(decl, isClassComp),
        filePath: relPath,
        lineNumber: decl.getStartLineNumber(),
        exports: [name],
        imports: importNames,
        props: extractProps(decl),
        isDefaultExport: key === 'default',
      })
    }
  }

  return components
}

function resolveName(key: string, decl: ExportedDeclarations, relPath: string): string {
  if (key !== 'default') return key
  // Default export: prefer the declaration's own identifier, else the filename.
  const named = decl as unknown as { getName?: () => string | undefined }
  const own = typeof named.getName === 'function' ? named.getName() : undefined
  if (own) return own
  const base = path.basename(relPath).replace(/\.(tsx|jsx|ts|js)$/, '')
  return base === 'index' ? path.basename(path.dirname(relPath)) : base
}

function componentType(decl: Node, isClassComp: boolean): ComponentType {
  if (isClassComp || Node.isClassDeclaration(decl)) return 'class'
  if (Node.isFunctionDeclaration(decl)) return 'function'
  if (Node.isVariableDeclaration(decl)) {
    const init = decl.getInitializer()
    if (init && Node.isArrowFunction(init)) return 'arrow'
    if (init && Node.isFunctionExpression(init)) return 'function'
    if (init && Node.isCallExpression(init)) return 'memo' // memo()/forwardRef()
  }
  return 'unknown'
}

function isClassComponent(decl: Node): boolean {
  if (!Node.isClassDeclaration(decl)) return false
  const ext = decl.getExtends()
  if (!ext) return false
  // Matches `React.Component`, `Component`, `React.PureComponent`, `PureComponent`.
  return /(?:React\.)?(?:Pure)?Component\b/.test(ext.getText())
}

function isFunctionComponent(decl: Node): boolean {
  let body: Node | undefined
  if (Node.isFunctionDeclaration(decl)) body = decl
  else if (Node.isVariableDeclaration(decl)) {
    const init = decl.getInitializer()
    if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) body = init
    // memo(Comp) / forwardRef(Comp) wrappers
    else if (init && Node.isCallExpression(init)) body = init
  }
  return body ? rendersJsx(body) : false
}

function rendersJsx(node: Node): boolean {
  return (
    node.getFirstDescendantByKind(SyntaxKind.JsxElement) !== undefined ||
    node.getFirstDescendantByKind(SyntaxKind.JsxSelfClosingElement) !== undefined ||
    node.getFirstDescendantByKind(SyntaxKind.JsxFragment) !== undefined
  )
}

function extractProps(decl: Node): string[] {
  // Class component: props generic on `extends React.Component<Props>`.
  if (Node.isClassDeclaration(decl)) {
    const ext = decl.getExtends()
    const typeArgs = ext?.getTypeArguments?.()
    if (typeArgs && typeArgs.length) return [typeArgs[0].getText()]
    return []
  }
  // Function/arrow: first parameter (destructured names or type text).
  let params: ReturnType<typeof getParams> = []
  if (Node.isFunctionDeclaration(decl)) params = getParams(decl)
  else if (Node.isVariableDeclaration(decl)) {
    const init = decl.getInitializer()
    if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
      params = getParams(init)
    }
  }
  const first = params[0]
  if (!first) return []
  const nameNode = first.getNameNode()
  if (Node.isObjectBindingPattern(nameNode)) {
    return nameNode.getElements().map((e) => e.getName())
  }
  const typeText = first.getTypeNode()?.getText()
  return typeText ? [typeText] : [first.getName()]
}

function getParams(fn: Node): import('ts-morph').ParameterDeclaration[] {
  const f = fn as unknown as {
    getParameters?: () => import('ts-morph').ParameterDeclaration[]
  }
  return typeof f.getParameters === 'function' ? f.getParameters() : []
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr))
}
