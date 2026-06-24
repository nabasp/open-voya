// Helpers for deriving + sanitizing a project name from a Git URL or folder.
// The charset mirrors the backend's isValidProjectName (workspace.service.ts).

export const VALID_NAME = /^[A-Za-z0-9._-]+$/;

export function isValidProjectName(name: string): boolean {
  return VALID_NAME.test(name);
}

/** Trim, collapse whitespace to '-', drop invalid filesystem chars. */
export function sanitizeName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
}

/** "https://github.com/user/my-project.git" → "my-project" (also scp/ssh form). */
export function deriveNameFromGitUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  const segment = trimmed.split(/[/:]/).pop() ?? "";
  return sanitizeName(segment.replace(/\.git$/i, ""));
}

/** "/Users/x/projects/openboat" → "openboat". */
export function deriveNameFromFolder(path: string): string {
  const base = path.split(/[\\/]/).filter(Boolean).pop() ?? "";
  return sanitizeName(base);
}
