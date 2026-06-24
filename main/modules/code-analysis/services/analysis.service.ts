import fs from 'fs'
import path from 'path'

import type { PipelineContext } from '../../project-import/types'
import type { AnalysisSnapshot, GraphEdge, GraphNode } from '../types'
import { scanRepository } from '../repository/repo-scanner'
import { buildTsProject } from '../parsers/ts-project'
import { parseImportsExports, type FileImportsExports } from '../parsers/import-export.parser'
import type { ExtractContext } from '../extractors/context'
import { extractComponents } from '../extractors/component.extractor'
import { extractRoutes } from '../extractors/route.extractor'
import { extractApis } from '../extractors/api.extractor'
import { extractServices } from '../extractors/service.extractor'
import { extractModels } from '../extractors/model.extractor'
import { extractUiElements } from '../extractors/ui-element.extractor'
import { extractNavigation } from '../extractors/navigation.extractor'
import { extractForms } from '../extractors/form.extractor'
import { extractHooks } from '../extractors/hook.extractor'
import { extractState } from '../extractors/state.extractor'
import { extractEventHandlers } from '../extractors/event-handler.extractor'
import { analyzeDependencies } from '../analyzers/dependency.analyzer'
import { analyzeActions } from '../analyzers/action.analyzer'
import { buildRelationshipGraph } from '../analyzers/relationship-graph.builder'
import { analysisRepository } from '../database/analysis.repository'
import { artifactDir, writeArtifacts } from './artifact-writer'
import { info, success } from '../utils/logging'
import { toPosix } from '../utils/ids'

/**
 * Orchestrates one repository-analysis run: scan → parse → extract → graph →
 * version → artifacts → persist. Pure discovery/normalization — it produces the
 * source-of-truth snapshot and emits `[INFO]/[SUCCESS]` progress, but generates
 * no manifest, docs, embeddings, or AI output.
 */
export const analysisService = {
  async run(ctx: PipelineContext): Promise<void> {
    const { log } = ctx
    const projectId = ctx.project.id
    const repoRoot = ctx.project.localProjectPath

    info(log, 'Starting analysis...')
    const version = analysisRepository.createVersion(projectId)

    try {
      // 1. Repository discovery + file inventory
      const { repository, files } = scanRepository(repoRoot, ctx.project.name)
      info(log, 'Repository discovered')
      info(log, `Scanning files... (${files.length} files, ${repository.totalDirectories} dirs)`)

      // 2. Build the shared ts-morph project + per-file import/export parse
      const { sourceFiles } = buildTsProject(repoRoot)
      const fileIdByAbsPath = new Map(files.map((f) => [toPosix(f.absPath), f.id]))
      const importsByAbsPath = new Map<string, FileImportsExports>()
      for (const sf of sourceFiles) {
        importsByAbsPath.set(sf.getFilePath(), parseImportsExports(sf))
      }
      const ec: ExtractContext = {
        repoRoot,
        sourceFiles,
        files,
        fileIdByAbsPath,
        importsByAbsPath,
      }

      // 3. Extraction
      info(log, 'Extracting routes...')
      const routes = extractRoutes(ec)
      info(log, 'Extracting components...')
      const components = extractComponents(ec)
      info(log, 'Extracting APIs...')
      const apis = extractApis(ec)
      info(log, 'Extracting services...')
      const services = extractServices(ec)
      info(log, 'Extracting models...')
      const models = extractModels(ec)
      info(log, 'Extracting forms...')
      const forms = extractForms(ec)
      info(log, 'Extracting hooks...')
      const hooks = extractHooks(ec)
      info(log, 'Extracting state management...')
      const state = extractState(ec)
      info(log, 'Extracting event handlers...')
      const eventHandlers = extractEventHandlers(ec)
      const uiElements = extractUiElements(ec)
      const navigation = extractNavigation(ec, routes)

      // 4. Relationships + graph + candidate actions
      info(log, 'Building relationship graph...')
      const fileRelationships = analyzeDependencies(ec)
      const actions = analyzeActions(ec, { apis, forms, eventHandlers })
      const graph = buildRelationshipGraph({
        files,
        routes,
        components,
        services,
        models,
        apis,
        uiElements,
        navigation,
        fileRelationships,
      })

      const snapshot: AnalysisSnapshot = {
        repository,
        files,
        routes,
        components,
        services,
        apis,
        models,
        forms,
        hooks,
        state,
        eventHandlers,
        actions,
        uiElements,
        navigation,
        relationships: fileRelationships,
        graph,
      }

      // 5. Persist artifacts + SQLite
      info(log, 'Saving analysis artifacts...')
      writeArtifacts(projectId, version.analysisVersion, snapshot)
      analysisRepository.persistSnapshot(version.id, snapshot)
      analysisRepository.completeVersion(version.id, {
        fileCount: files.length,
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
      })

      // Metrics summary (Definition of Done)
      info(
        log,
        `Metrics — Routes: ${routes.length}, Components: ${components.length}, ` +
          `Forms: ${forms.length}, API Endpoints: ${apis.length}, Services: ${services.length}, ` +
          `Hooks: ${hooks.length}, State: ${state.length}, Actions(raw): ${actions.length}`
      )
      success(
        log,
        `Analysis completed (v${version.analysisVersion}: ${files.length} files, ` +
          `${graph.nodes.length} nodes, ${graph.edges.length} edges)`
      )
    } catch (err) {
      analysisRepository.failVersion(version.id)
      throw err
    }
  },

  /** Read the latest completed snapshot from disk artifacts (for IPC). */
  getLatestSnapshot(projectId: string): AnalysisSnapshot | null {
    const latest = analysisRepository.latestCompleted(projectId)
    if (!latest) return null
    const dir = artifactDir(projectId, latest.analysisVersion)
    const read = <T>(name: string, fallback: T): T => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')) as T
      } catch {
        return fallback
      }
    }
    return {
      repository: read('repository.json', null as never),
      files: read('files.json', []),
      routes: read('routes.json', []),
      components: read('components.json', []),
      services: read('services.json', []),
      apis: read('apis.json', []),
      models: read('models.json', []),
      forms: read('forms.json', []),
      hooks: read('hooks.json', []),
      state: read('state.json', []),
      eventHandlers: read('event-handlers.json', []),
      actions: read('actions-raw.json', []),
      // UI elements are persisted as graph nodes (button/form/table/dialog), not
      // a standalone artifact, so they are surfaced through `graph` rather than here.
      uiElements: [],
      navigation: read('navigation.json', []),
      relationships: read('relationships.json', []),
      graph: read('graph.json', { nodes: [] as GraphNode[], edges: [] as GraphEdge[] }),
    }
  },

  getGraph(projectId: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const snap = this.getLatestSnapshot(projectId)
    return snap ? snap.graph : { nodes: [], edges: [] }
  },

  listVersions(projectId: string) {
    return analysisRepository.listVersions(projectId)
  },
}
