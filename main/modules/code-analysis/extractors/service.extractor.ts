import path from 'path'

import type { ServiceNode } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

const SERVICE_FILE = /\.service\.(ts|js)$/
// Note: deliberately excludes Next.js `app/api/**` route handlers — those are
// API endpoints (see api.extractor), not services.
const SERVICE_DIR = /(?:^|\/)(services|lib)\//

/**
 * Discover service modules: files named `*.service.ts` or exporting `*Service`
 * symbols, plus class/function exports living under `services/`, `lib/`, `api/`.
 * Records local-file dependencies and any referenced API/service symbols.
 */
export function extractServices(ctx: ExtractContext): ServiceNode[] {
  const services: ServiceNode[] = []

  for (const sf of ctx.sourceFiles) {
    const abs = sf.getFilePath()
    const relPath = toPosix(path.relative(ctx.repoRoot, abs))
    const exportedNames = Array.from(sf.getExportedDeclarations().keys())

    const byFilename = SERVICE_FILE.test(relPath)
    const byDir = SERVICE_DIR.test(relPath) && exportedNames.length > 0
    const byExportName = exportedNames.filter((n) => /service$/i.test(n))

    if (!byFilename && !byDir && byExportName.length === 0) continue

    const name = byExportName[0] ?? deriveServiceName(relPath, exportedNames)
    if (!name) continue

    // Line of the named/derived export (best-effort), else top of file.
    const decl = sf.getExportedDeclarations().get(name)?.[0]
    const lineNumber = decl ? decl.getStartLineNumber() : 1

    const ie = ctx.importsByAbsPath.get(abs)
    const dependencies = ie
      ? dedupe(
          ie.imports
            .filter((i) => !i.isExternal)
            .map((i) => i.moduleSpecifier)
        )
      : []
    const referencedApis = ie
      ? dedupe(ie.imports.flatMap((i) => i.names).filter((n) => /service$/i.test(n) && n !== name))
      : []

    services.push({
      id: makeId('service', relPath, name),
      name,
      type: 'service',
      filePath: relPath,
      lineNumber,
      dependencies,
      referencedApis,
    })
  }

  return services
}

function deriveServiceName(relPath: string, exportedNames: string[]): string | null {
  const base = path.basename(relPath).replace(/\.(service\.)?(tsx|ts|jsx|js)$/, '')
  if (base && base !== 'index') {
    return base.replace(/[-_.]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s/g, '')
  }
  return exportedNames[0] ?? null
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr))
}
