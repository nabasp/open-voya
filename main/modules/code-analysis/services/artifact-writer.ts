import fs from 'fs'
import path from 'path'

import { app } from 'electron'

import type { AnalysisSnapshot } from '../types'

/**
 * Resolve the app-managed, version-scoped artifact directory for a run. Kept
 * outside the cloned repo so analysis output never pollutes user source:
 *   <userData>/analysis/<projectId>/v<version>/
 */
export function artifactDir(projectId: string, version: number): string {
  return path.join(app.getPath('userData'), 'analysis', projectId, `v${version}`)
}

/** Root dir holding all analysis-artifact versions for a project. */
export function projectArtifactDir(projectId: string): string {
  return path.join(app.getPath('userData'), 'analysis', projectId)
}

/** Best-effort removal of a project's analysis artifacts (on project delete). */
export function removeArtifacts(projectId: string): void {
  try {
    fs.rmSync(projectArtifactDir(projectId), { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

/**
 * Write the 10 normalized JSON artifacts for a run. These are intermediate
 * source-of-truth files consumed by later pipeline stages.
 */
export function writeArtifacts(
  projectId: string,
  version: number,
  snapshot: AnalysisSnapshot
): string {
  const dir = artifactDir(projectId, version)
  fs.mkdirSync(dir, { recursive: true })

  const files: Record<string, unknown> = {
    'repository.json': snapshot.repository,
    'files.json': snapshot.files,
    'routes.json': snapshot.routes,
    'components.json': snapshot.components,
    'services.json': snapshot.services,
    'apis.json': snapshot.apis,
    'models.json': snapshot.models,
    'navigation.json': snapshot.navigation,
    'relationships.json': snapshot.relationships,
    'graph.json': snapshot.graph,
  }

  for (const [name, data] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), JSON.stringify(data, null, 2), 'utf8')
  }

  return dir
}
