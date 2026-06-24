import path from 'path'

import type { FileNode, RouteNode } from '../types'
import { makeId, toPosix } from '../utils/ids'

const PAGE_FILE = /^(page|index)\.(tsx|ts|jsx|js)$/
const LAYOUT_FILE = /^layout\.(tsx|ts|jsx|js)$/

/**
 * Discover Next.js routes from both the App Router (`app/**\/page.tsx`,
 * `layout.tsx`) and the Pages Router (`pages/**`). Route paths are derived from
 * the file location: route groups `(group)` are stripped and dynamic segments
 * `[param]` become `:param`. Parent route + nearest layout are linked.
 */
export function extractRoutes(files: FileNode[], repoRoot: string): RouteNode[] {
  const routes: RouteNode[] = []
  const layoutByDir = new Map<string, string>() // app dir route → layout relPath

  // First pass: record layouts so pages can reference the nearest one.
  for (const f of files) {
    const seg = appRouterRel(f.relPath)
    if (seg !== null && LAYOUT_FILE.test(f.name)) {
      layoutByDir.set(routeFromAppDir(path.posix.dirname(seg)), f.relPath)
    }
  }

  for (const f of files) {
    // --- App Router ---
    // App Router: only `page`/`index` are navigable routes. `route.ts` files are
    // API endpoints handled by the API extractor, not routes.
    const appRel = appRouterRel(f.relPath)
    if (appRel !== null) {
      if (PAGE_FILE.test(f.name)) {
        const routePath = routeFromAppDir(path.posix.dirname(appRel))
        routes.push(makeRoute(routePath, f.relPath, layoutByDir))
      }
      continue
    }

    // --- Pages Router ---
    const pagesRel = pagesRouterRel(f.relPath)
    if (pagesRel !== null && isPageFile(f.name) && !isPagesApi(pagesRel)) {
      const routePath = routeFromPagesFile(pagesRel)
      routes.push(makeRoute(routePath, f.relPath, layoutByDir))
    }
  }

  // Dedupe by route path (app + pages collisions), keep first.
  const seen = new Set<string>()
  return routes.filter((r) => (seen.has(r.path) ? false : (seen.add(r.path), true)))
}

function makeRoute(
  routePath: string,
  sourceFile: string,
  layoutByDir: Map<string, string>
): RouteNode {
  const name = routeName(routePath)
  const parentRoute = routePath === '/' ? null : parentOf(routePath)
  const layoutFile = nearestLayout(routePath, layoutByDir)
  return {
    id: makeId('route', routePath),
    name,
    path: routePath,
    sourceFile,
    parentRoute,
    layoutFile,
  }
}

/** Return the path relative to the `app` (or `src/app`) root, else null. */
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
    .filter((s) => s && !(s.startsWith('(') && s.endsWith(')'))) // strip route groups
    .map(dynamicSegment)
  return '/' + segments.join('/')
}

function routeFromPagesFile(rel: string): string {
  // Strip extension and trailing /index.
  let p = rel.replace(/\.(tsx|ts|jsx|js)$/, '')
  p = p.replace(/\/index$/, '').replace(/^index$/, '')
  const segments = p.split('/').filter(Boolean).map(dynamicSegment)
  return '/' + segments.join('/')
}

function dynamicSegment(seg: string): string {
  // [id] → :id ; [...slug] → :slug* ; [[...slug]] → :slug?
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
  if (routePath === '/') return 'Home'
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
  // Walk up the route tree to find the closest layout.
  for (;;) {
    if (layoutByDir.has(cur)) return layoutByDir.get(cur)!
    if (cur === '/') break
    cur = parentOf(cur)
  }
  return null
}
