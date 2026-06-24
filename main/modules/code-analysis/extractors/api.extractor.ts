import path from 'path'

import type { ApiNode, HttpMethod } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
const ROUTE_HANDLER = /(?:^|\/)route\.(ts|js)$/

/**
 * Discover API endpoints from Next.js route handlers (`app/**\/route.ts` with
 * exported GET/POST/… functions) and the Pages API (`pages/api/**`). Each
 * endpoint records its HTTP method, the handler file, and referenced services
 * (imports that look like `*Service`).
 */
export function extractApis(ctx: ExtractContext): ApiNode[] {
  const apis: ApiNode[] = []

  for (const sf of ctx.sourceFiles) {
    const abs = sf.getFilePath()
    const relPath = toPosix(path.relative(ctx.repoRoot, abs))
    const serviceRefs = serviceReferences(ctx, abs)

    if (ROUTE_HANDLER.test(relPath) && isUnderDir(relPath, 'app')) {
      const endpoint = endpointFromAppRoute(relPath)
      const exported = new Set(sf.getExportedDeclarations().keys())
      for (const method of HTTP_METHODS) {
        if (exported.has(method)) {
          apis.push({
            id: makeId('api', method, endpoint),
            endpoint,
            method,
            controller: path.basename(path.posix.dirname(relPath)),
            serviceRefs,
            sourceFile: relPath,
          })
        }
      }
      continue
    }

    const pagesApi = pagesApiRel(relPath)
    if (pagesApi !== null) {
      const endpoint = '/api/' + pagesApi.replace(/\.(tsx|ts|jsx|js)$/, '').replace(/\/index$/, '')
      apis.push({
        id: makeId('api', 'ANY', endpoint),
        endpoint,
        method: detectPagesMethod(sf.getText()),
        controller: path.basename(relPath).replace(/\.(tsx|ts|jsx|js)$/, ''),
        serviceRefs,
        sourceFile: relPath,
      })
    }
  }

  return apis
}

function serviceReferences(ctx: ExtractContext, abs: string): string[] {
  const ie = ctx.importsByAbsPath.get(abs)
  if (!ie) return []
  const refs = new Set<string>()
  for (const imp of ie.imports) {
    for (const name of imp.names) {
      if (/service$/i.test(name)) refs.add(name)
    }
    if (/service/i.test(imp.moduleSpecifier)) {
      imp.names.forEach((n) => refs.add(n))
    }
  }
  return Array.from(refs)
}

function isUnderDir(relPath: string, dir: string): boolean {
  return new RegExp(`(?:^|/)(?:src/)?${dir}/`).test(toPosix(relPath))
}

function endpointFromAppRoute(relPath: string): string {
  const after = toPosix(relPath).match(/(?:^|\/)(?:src\/)?app\/(.+)\/route\.(ts|js)$/)
  if (!after) return '/'
  const segments = after[1]
    .split('/')
    .filter((s) => s && !(s.startsWith('(') && s.endsWith(')')))
    .map((s) => s.replace(/^\[\.\.\.(.+)\]$/, ':$1*').replace(/^\[(.+)\]$/, ':$1'))
  return '/' + segments.join('/')
}

function pagesApiRel(relPath: string): string | null {
  const m = toPosix(relPath).match(/(?:^|\/)(?:src\/)?pages\/api\/(.+)$/)
  return m ? m[1] : null
}

function detectPagesMethod(source: string): HttpMethod {
  // Best-effort: look for `req.method === 'POST'` style guards.
  const m = source.match(/method\s*===?\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`]/i)
  return (m ? (m[1].toUpperCase() as HttpMethod) : 'GET')
}
