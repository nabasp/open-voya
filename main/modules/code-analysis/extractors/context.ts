import type { SourceFile } from 'ts-morph'

import type { FileNode } from '../types'
import type { FileImportsExports } from '../parsers/import-export.parser'

/** Shared inputs threaded into every extractor (built once per analysis run). */
export interface ExtractContext {
  repoRoot: string
  sourceFiles: SourceFile[]
  files: FileNode[]
  /** absolute file path → stable FileNode id. */
  fileIdByAbsPath: Map<string, string>
  /** absolute file path → parsed imports/exports. */
  importsByAbsPath: Map<string, FileImportsExports>
}

/** Resolve a FileNode id for an absolute path, or null when not inventoried. */
export function fileIdFor(ctx: ExtractContext, absPath: string): string | null {
  return ctx.fileIdByAbsPath.get(absPath) ?? null
}
