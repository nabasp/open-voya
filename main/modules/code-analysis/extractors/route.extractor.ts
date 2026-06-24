import path from 'path'

import { Node, SyntaxKind } from 'ts-morph'
import type { JsxOpeningElement, JsxSelfClosingElement, SourceFile } from 'ts-morph'

import type { RouteKind, RouteNode } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

const PAGE_FILE = /^(page|index)\.(tsx|ts|jsx|js)$/
const LAYOUT_FILE = /^layout\.(tsx|ts|jsx|js)$/

/**
 * Discover routes from two conventions:
 *  - Next.js file-based routing: `app/**\/page.tsx` + `layout.tsx`, `pages/**`.
 *  - react-router: `<Route path="..." element/component={...}>` JSX elements.
 * Each route carries a source filePath + lineNumber for traceability.
 */
export function extractRoutes(ctx: ExtractContext): RouteNode[] {
  const routes: RouteNode[] = []
  const files = ctx.files
  const lineByFile = buildDefaultExportLineIndex(ctx.sourceFiles, ctx.repoRoot)
  const layoutByDir = new Map<string, string>()

  // Record layouts so pages can reference the nearest one.
  for (const f of files) {
    const seg = appRouterRel(f.relPath)
    if (seg !== null && LAYOUT_FILE.test(f.name)) {
      layoutByDir.set(routeFromAppDir(path.posix.dirname(seg)), f.relPath)
    }
  }

  // --- File-based routes ---
  for (const f of files) {
    const appRel = appRouterRel(f.relPath)
    if (appRel !== null) {
      if (PAGE_FILE.test(f.name)) {
        const routePath = routeFromAppDir(path.posix.dirname(appRel))
        routes.push(
          makeFileRoute(routePath, 'page', f.relPath, lineByFile.get(f.relPath) ?? 1, layoutByDir)
        )
      }
      continue
    }
    const pagesRel = pagesRouterRel(f.relPath)
    if (pagesRel !== null && isPageFile(f.name) && !isPagesApi(pagesRel)) {
      const routePath = routeFromPagesFile(pagesRel)
      routes.push(
        makeFileRoute(routePath, 'page', f.relPath, lineByFile.get(f.relPath) ?? 1, layoutByDir)
      )
    }
  }

  // --- react-router <Route path="..."> ---
  for (const sf of ctx.sourceFiles) {
    const relPath = toPosix(path.relative(ctx.repoRoot, sf.getFilePath()))
    const handleRoute = (el: JsxOpeningElement | JsxSelfClosingElement) => {
      if (el.getTagNameNode().getText() !== 'Route') return
      const routePath = jsxStringAttr(el, 'path')
      if (routePath === null) return
      const target = jsxStringAttr(el, 'element') ?? jsxStringAttr(el, 'component') ?? ''
      routes.push({
        id: makeId('route', 'rr', relPath, routePath),
        name: routeName(routePath),
        type: 'route-element' as RouteKind,
        path: routePath,
        filePath: relPath,
        lineNumber: el.getStartLineNumber(),
        sourceFile: relPath,
        parentRoute: routePath === '/' ? null : parentOf(routePath),
        layoutFile: target || null,
      })
    }
    for (const el of sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)) handleRoute(el)
    for (const el of sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)) handleRoute(el)
  }

  // Dedupe by (type,path); keep first.
  const seen = new Set<string>()
  return routes.filter((r) => {
    const k = `${r.type}:${r.path}`
    return seen.has(k) ? false : (seen.add(k), true)
  })
}

function makeFileRoute(
  routePath: string,
  type: RouteKind,
  sourceFile: string,
  lineNumber: number,
  layoutByDir: Map<string, string>
): RouteNode {
  return {
    id: makeId('route', routePath),
    name: routeName(routePath),
    type,
    path: routePath,
    filePath: sourceFile,
    lineNumber,
    sourceFile,
    parentRoute: routePath === '/' ? null : parentOf(routePath),
    layoutFile: nearestLayout(routePath, layoutByDir),
  }
}

/** relPath → line of its default export (best-effort, defaults handled by caller). */
function buildDefaultExportLineIndex(
  sourceFiles: SourceFile[],
  repoRoot: string
): Map<string, number> {
  const map = new Map<string, number>()
  for (const sf of sourceFiles) {
    const rel = toPosix(path.relative(repoRoot, sf.getFilePath()))
    const def = sf.getDefaultExportSymbol()?.getDeclarations()?.[0]
    if (def) map.set(rel, def.getStartLineNumber())
  }
  return map
}

function jsxStringAttr(
  el: JsxOpeningElement | JsxSelfClosingElement,
  name: string
): string | null {
  for (const attr of el.getAttributes()) {
    if (!Node.isJsxAttribute(attr)) continue
    if (attr.getNameNode().getText() !== name) continue
    const init = attr.getInitializer()
    if (init && Node.isStringLiteral(init)) return init.getLiteralText()
    if (init && Node.isJsxExpression(init)) {
      const expr = init.getExpression()
      if (expr && Node.isStringLiteral(expr)) return expr.getLiteralText()
      if (expr) return expr.getText() // element={<Foo/>} → "<Foo/>" as a hint
    }
  }
  return null
}

function appRouterRel(relPath: string): string | null {
  return afterDir(relPath, 'app')
}
function pagesRouterRel(relPath: string): string | null {
  return afterDir(relPath, 'pages')
}
function afterDir(relPath: string, dir: string): string | null {
  const p = toPosix(relPath)
  const m = p.match(new RegExp(`(?:^|/)(?:src/)?${dir}/(.+)$`))
  return m ? m[1] : null
}

function routeFromAppDir(dir: string): string {
  if (dir === '.' || dir === '') return '/'
  const segments = dir
    .split('/')
    .filter((s) => s && !(s.startsWith('(') && s.endsWith(')')))
    .map(dynamicSegment)
  return '/' + segments.join('/')
}

function routeFromPagesFile(rel: string): string {
  let p = rel.replace(/\.(tsx|ts|jsx|js)$/, '')
  p = p.replace(/\/index$/, '').replace(/^index$/, '')
  const segments = p.split('/').filter(Boolean).map(dynamicSegment)
  return '/' + segments.join('/')
}

function dynamicSegment(seg: string): string {
  const catchAllOpt = seg.match(/^\[\[\.\.\.(.+)\]\]$/)
  if (catchAllOpt) return `:${catchAllOpt[1]}?`
  const catchAll = seg.match(/^\[\.\.\.(.+)\]$/)
  if (catchAll) return `:${catchAll[1]}*`
  const dyn = seg.match(/^\[(.+)\]$/)
  if (dyn) return `:${dyn[1]}`
  return seg
}

function isPageFile(name: string): boolean {
  return /\.(tsx|ts|jsx|js)$/.test(name) && !/^_(app|document|error)\./.test(name)
}
function isPagesApi(rel: string): boolean {
  return rel.startsWith('api/')
}

function routeName(routePath: string): string {
  if (routePath === '/' || routePath === '') return 'Home'
  const last = routePath.split('/').filter(Boolean).pop() ?? 'Home'
  return last.replace(/^:/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function parentOf(routePath: string): string {
  const parts = routePath.split('/').filter(Boolean)
  parts.pop()
  return parts.length ? '/' + parts.join('/') : '/'
}
function nearestLayout(routePath: string, layoutByDir: Map<string, string>): string | null {
  let cur = routePath
  for (;;) {
    if (layoutByDir.has(cur)) return layoutByDir.get(cur)!
    if (cur === '/') break
    cur = parentOf(cur)
  }
  return null
}
