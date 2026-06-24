import path from 'path'

import { Node, SyntaxKind } from 'ts-morph'

import type { NavigationEdge, RouteNode } from '../types'
import { makeId, toPosix } from '../utils/ids'
import { fileIdFor, type ExtractContext } from './context'

const NAV_CALLS = new Set(['push', 'replace', 'redirect', 'navigate'])

/**
 * Discover navigation relationships from `<Link href="…">`, `router.push("…")`,
 * `redirect("…")` etc. Each edge runs from the source (route id when the file is
 * a route, else its file id) to the target route (resolved by path) and keeps
 * the literal href for later flow generation.
 */
export function extractNavigation(ctx: ExtractContext, routes: RouteNode[]): NavigationEdge[] {
  const edges: NavigationEdge[] = []
  const routeIdByPath = new Map(routes.map((r) => [normalizePath(r.path), r.id]))
  const routeIdBySourceFile = new Map(routes.map((r) => [r.sourceFile, r.id]))

  for (const sf of ctx.sourceFiles) {
    const abs = sf.getFilePath()
    const relPath = toPosix(path.relative(ctx.repoRoot, abs))
    const fromId = routeIdBySourceFile.get(relPath) ?? fileIdFor(ctx, abs)
    if (!fromId) continue

    const targets = new Set<string>()

    // <Link href="..."> and <a href="...">
    for (const open of [
      ...sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
      ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ]) {
      const tag = open.getTagNameNode().getText()
      if (tag !== 'Link' && tag !== 'a') continue
      for (const attr of open.getAttributes()) {
        if (!Node.isJsxAttribute(attr)) continue
        if (attr.getNameNode().getText() !== 'href') continue
        const init = attr.getInitializer()
        if (init && Node.isStringLiteral(init)) targets.add(init.getLiteralText())
      }
    }

    // router.push("..."), redirect("..."), navigate("...")
    for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const expr = call.getExpression()
      let fn = ''
      if (Node.isPropertyAccessExpression(expr)) fn = expr.getName()
      else if (Node.isIdentifier(expr)) fn = expr.getText()
      if (!NAV_CALLS.has(fn)) continue
      const arg = call.getArguments()[0]
      if (arg && Node.isStringLiteral(arg)) targets.add(arg.getLiteralText())
    }

    for (const target of Array.from(targets)) {
      if (!target.startsWith('/')) continue // skip external/relative-less links
      const toId = routeIdByPath.get(normalizePath(target)) ?? makeId('route', normalizePath(target))
      edges.push({
        id: makeId('nav', fromId, target),
        fromId,
        toId,
        target,
      })
    }
  }

  return edges
}

function normalizePath(p: string): string {
  const stripped = p.split('?')[0].split('#')[0]
  if (stripped === '/') return '/'
  return stripped.replace(/\/$/, '')
}
