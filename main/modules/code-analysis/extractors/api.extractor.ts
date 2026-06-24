import path from 'path'

import { Node, SyntaxKind } from 'ts-morph'
import type { CallExpression } from 'ts-morph'

import type { ApiNode, HttpMethod } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
const ROUTE_HANDLER = /(?:^|\/)route\.(ts|js)$/
const CLIENT_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'request'])

/**
 * Discover API endpoints from:
 *  - Next.js route handlers (`app/**\/route.ts` exporting GET/POST/…),
 *  - client call sites: `fetch(...)`, `axios.get(...)`, `api.post(...)`, and
 *    similar `*Client`/`api*` method calls.
 * Each carries its HTTP method, endpoint, source file + line number.
 */
export function extractApis(ctx: ExtractContext): ApiNode[] {
  const apis: ApiNode[] = []

  for (const sf of ctx.sourceFiles) {
    const abs = sf.getFilePath()
    const relPath = toPosix(path.relative(ctx.repoRoot, abs))
    const serviceRefs = serviceReferences(ctx, abs)

    // --- Next.js route handlers ---
    if (ROUTE_HANDLER.test(relPath) && isUnderDir(relPath, 'app')) {
      const endpoint = endpointFromAppRoute(relPath)
      for (const [key, decls] of Array.from(sf.getExportedDeclarations())) {
        const method = key as HttpMethod
        if (!HTTP_METHODS.includes(method)) continue
        const decl = decls[0]
        apis.push({
          id: makeId('api', method, endpoint),
          name: `${method} ${endpoint}`,
          type: 'route-handler',
          endpoint,
          method,
          controller: path.basename(path.posix.dirname(relPath)),
          serviceRefs,
          filePath: relPath,
          lineNumber: decl ? decl.getStartLineNumber() : 1,
          sourceFile: relPath,
        })
      }
      continue
    }

    const pagesApi = pagesApiRel(relPath)
    if (pagesApi !== null) {
      const endpoint = '/api/' + pagesApi.replace(/\.(tsx|ts|jsx|js)$/, '').replace(/\/index$/, '')
      apis.push({
        id: makeId('api', 'ANY', endpoint),
        name: `ANY ${endpoint}`,
        type: 'route-handler',
        endpoint,
        method: detectPagesMethod(sf.getText()),
        controller: path.basename(relPath).replace(/\.(tsx|ts|jsx|js)$/, ''),
        serviceRefs,
        filePath: relPath,
        lineNumber: 1,
        sourceFile: relPath,
      })
      continue
    }

    // --- Client call sites (fetch/axios/api.*) ---
    for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const parsed = parseClientCall(call)
      if (!parsed) continue
      apis.push({
        id: makeId('api', parsed.kind, parsed.method, parsed.endpoint, relPath, String(call.getStartLineNumber())),
        name: `${parsed.method} ${parsed.endpoint}`,
        type: parsed.kind,
        endpoint: parsed.endpoint,
        method: parsed.method,
        controller: null,
        serviceRefs,
        filePath: relPath,
        lineNumber: call.getStartLineNumber(),
        sourceFile: relPath,
      })
    }
  }

  return apis
}

interface ClientCall {
  kind: 'fetch' | 'axios' | 'api-client'
  method: HttpMethod
  endpoint: string
}

function parseClientCall(call: CallExpression): ClientCall | null {
  const expr = call.getExpression()

  // fetch('/x', { method: 'POST' })
  if (Node.isIdentifier(expr) && expr.getText() === 'fetch') {
    const endpoint = firstStringArg(call)
    if (!endpoint) return null
    return { kind: 'fetch', method: methodFromOptions(call) ?? 'GET', endpoint }
  }

  // axios.get('/x') | api.post('/x') | client.request('/x') | axios('/x')
  if (Node.isPropertyAccessExpression(expr)) {
    const obj = expr.getExpression().getText()
    const prop = expr.getName().toLowerCase()
    if (!CLIENT_METHODS.has(prop)) return null
    if (!isHttpClient(obj)) return null
    const endpoint = firstStringArg(call)
    if (!endpoint) return null
    const method =
      prop === 'request'
        ? methodFromOptions(call) ?? 'GET'
        : (prop.toUpperCase() as HttpMethod)
    return { kind: obj === 'axios' ? 'axios' : 'api-client', method, endpoint }
  }

  // axios('/x', { method })
  if (Node.isIdentifier(expr) && expr.getText() === 'axios') {
    const endpoint = firstStringArg(call)
    if (!endpoint) return null
    return { kind: 'axios', method: methodFromOptions(call) ?? 'GET', endpoint }
  }

  return null
}

function isHttpClient(objText: string): boolean {
  return (
    objText === 'axios' ||
    /(^|\.)api$/i.test(objText) ||
    /api/i.test(objText) ||
    /client$/i.test(objText) ||
    /http$/i.test(objText)
  )
}

function firstStringArg(call: CallExpression): string | null {
  const arg = call.getArguments()[0]
  if (!arg) return null
  if (Node.isStringLiteral(arg)) return arg.getLiteralText()
  if (Node.isNoSubstitutionTemplateLiteral(arg)) return arg.getLiteralText()
  if (Node.isTemplateExpression(arg)) {
    // Best-effort: keep the literal head + mark interpolations.
    return arg.getText().replace(/`/g, '').replace(/\$\{[^}]*\}/g, ':param')
  }
  return null
}

function methodFromOptions(call: CallExpression): HttpMethod | null {
  for (const arg of call.getArguments()) {
    if (!Node.isObjectLiteralExpression(arg)) continue
    const prop = arg.getProperty('method')
    if (prop && Node.isPropertyAssignment(prop)) {
      const init = prop.getInitializer()
      if (init && Node.isStringLiteral(init)) {
        const m = init.getLiteralText().toUpperCase()
        if ((HTTP_METHODS as string[]).includes(m)) return m as HttpMethod
      }
    }
  }
  return null
}

function serviceReferences(ctx: ExtractContext, abs: string): string[] {
  const ie = ctx.importsByAbsPath.get(abs)
  if (!ie) return []
  const refs = new Set<string>()
  for (const imp of ie.imports) {
    for (const name of imp.names) if (/service$/i.test(name)) refs.add(name)
    if (/service/i.test(imp.moduleSpecifier)) imp.names.forEach((n) => refs.add(n))
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
  const m = source.match(/method\s*===?\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`]/i)
  return m ? (m[1].toUpperCase() as HttpMethod) : 'GET'
}
