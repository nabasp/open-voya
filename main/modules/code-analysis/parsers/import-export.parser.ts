import type { SourceFile } from 'ts-morph'

export interface ImportRef {
  /** Raw module specifier, e.g. "./AuthForm" or "react". */
  moduleSpecifier: string
  /** Absolute path of the resolved local file, or null for external/unresolved. */
  resolvedAbsPath: string | null
  /** Imported binding names (named + default + namespace). */
  names: string[]
  isExternal: boolean
}

export interface FileImportsExports {
  absPath: string
  imports: ImportRef[]
  /** Names exported by this file (named exports, default, re-exports). */
  exports: string[]
}

/**
 * Extract per-file import/export information with local-file resolution.
 * ts-morph resolves relative specifiers within the project to a SourceFile,
 * which we use to wire file→file `imports` edges; bare specifiers (react, etc.)
 * are kept as external references.
 */
export function parseImportsExports(sf: SourceFile): FileImportsExports {
  const imports: ImportRef[] = []

  for (const decl of sf.getImportDeclarations()) {
    const moduleSpecifier = decl.getModuleSpecifierValue()
    const target = decl.getModuleSpecifierSourceFile()
    const names: string[] = []
    const def = decl.getDefaultImport()
    if (def) names.push(def.getText())
    const ns = decl.getNamespaceImport()
    if (ns) names.push(ns.getText())
    for (const named of decl.getNamedImports()) names.push(named.getName())

    imports.push({
      moduleSpecifier,
      resolvedAbsPath: target ? target.getFilePath() : null,
      names,
      isExternal: !moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/'),
    })
  }

  // Re-exports (`export ... from '...'`) also create import-like dependencies.
  for (const decl of sf.getExportDeclarations()) {
    const moduleSpecifier = decl.getModuleSpecifierValue()
    if (!moduleSpecifier) continue
    const target = decl.getModuleSpecifierSourceFile()
    imports.push({
      moduleSpecifier,
      resolvedAbsPath: target ? target.getFilePath() : null,
      names: decl.getNamedExports().map((e) => e.getName()),
      isExternal: !moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/'),
    })
  }

  const exports = Array.from(sf.getExportedDeclarations().keys())

  return { absPath: sf.getFilePath(), imports, exports }
}
