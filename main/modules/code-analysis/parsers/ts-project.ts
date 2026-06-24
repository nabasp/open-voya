import path from 'path'

import { Project, ScriptTarget, ModuleKind, ts } from 'ts-morph'
import type { SourceFile } from 'ts-morph'

import { IGNORED_DIRS } from '../utils/ignore'

/**
 * Build a single in-memory ts-morph Project over the repo's JS/TS/JSX/TSX
 * files, reused by every extractor. We deliberately do NOT load the repo's
 * tsconfig (`skipAddingFilesFromTsConfig`) — analysis must work on arbitrary
 * repos that may have no/odd config — and we never emit. Type resolution is
 * lightweight (no node_modules typecheck), which is all the extractors need.
 */
export function buildTsProject(repoRoot: string): { project: Project; sourceFiles: SourceFile[] } {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    compilerOptions: {
      allowJs: true,
      jsx: ts.JsxEmit.Preserve,
      target: ScriptTarget.Latest,
      module: ModuleKind.ESNext,
      noEmit: true,
      allowNonTsExtensions: true,
    },
  })

  const ignoreGlobs = Array.from(IGNORED_DIRS).map((d) => `!${toGlob(repoRoot, `**/${d}/**`)}`)
  project.addSourceFilesAtPaths([
    toGlob(repoRoot, '**/*.{ts,tsx,js,jsx,mjs,cjs}'),
    ...ignoreGlobs,
  ])

  return { project, sourceFiles: project.getSourceFiles() }
}

function toGlob(root: string, pattern: string): string {
  // ts-morph/globby expect POSIX-style globs even on Windows.
  return path.posix.join(root.replace(/\\/g, '/'), pattern)
}
