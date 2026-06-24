// Directories never walked during repository scanning / parsing. Mirrors the
// folders excluded by the spec plus framework build output.
export const IGNORED_DIRS = new Set<string>([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  'generated',
  '.next',
  'out',
  '.turbo',
  '.cache',
  '.vercel',
])

/** Source extensions ts-morph parses (JS/TS + JSX/TSX). */
export const SOURCE_EXTENSIONS = new Set<string>([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
])

export function isIgnoredDir(name: string): boolean {
  return IGNORED_DIRS.has(name)
}

export function isSourceFile(ext: string): boolean {
  return SOURCE_EXTENSIONS.has(ext.toLowerCase())
}
