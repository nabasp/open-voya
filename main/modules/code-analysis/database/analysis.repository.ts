import { randomUUID } from 'crypto'

import { getDb } from '../../../db/database'
import type { AnalysisSnapshot, AnalysisStatus, AnalysisVersionMeta } from '../types'

interface RunRow {
  id: string
  project_id: string
  analysis_version: number
  file_count: number
  node_count: number
  edge_count: number
  status: AnalysisStatus
  started_at: string
  completed_at: string | null
}

function rowToMeta(r: RunRow): AnalysisVersionMeta {
  return {
    id: r.id,
    projectId: r.project_id,
    analysisVersion: r.analysis_version,
    fileCount: r.file_count,
    nodeCount: r.node_count,
    edgeCount: r.edge_count,
    status: r.status,
    startedAt: r.started_at,
    completedAt: r.completed_at,
  }
}

/**
 * Data access for analysis snapshots. `createVersion` opens a new
 * (project, version) run; `persistSnapshot` bulk-writes all normalized rows in a
 * single transaction; `completeVersion` finalizes counts + timestamp. Downstream
 * stages call `latestCompleted` to fetch the source-of-truth run.
 */
export const analysisRepository = {
  /** Open a new run for a project at `MAX(version)+1`, status=running. */
  createVersion(projectId: string): AnalysisVersionMeta {
    const db = getDb()
    const next =
      (db
        .prepare(
          `SELECT MAX(analysis_version) AS v FROM analysis_runs WHERE project_id = ?`
        )
        .get(projectId) as { v: number | null }).v ?? 0
    const id = randomUUID()
    const startedAt = new Date().toISOString()
    db.prepare(
      `INSERT INTO analysis_runs
         (id, project_id, analysis_version, file_count, node_count, edge_count, status, started_at, completed_at)
       VALUES (?, ?, ?, 0, 0, 0, 'running', ?, NULL)`
    ).run(id, projectId, next + 1, startedAt)
    return {
      id,
      projectId,
      analysisVersion: next + 1,
      fileCount: 0,
      nodeCount: 0,
      edgeCount: 0,
      status: 'running',
      startedAt,
      completedAt: null,
    }
  },

  /** Bulk-write the full normalized snapshot for a run in one transaction. */
  persistSnapshot(analysisId: string, snapshot: AnalysisSnapshot): void {
    const db = getDb()

    const insertFile = db.prepare(
      `INSERT INTO analysis_files (id, analysis_id, name, ext, rel_path, abs_path, size, hash)
       VALUES (@id, @analysisId, @name, @ext, @relPath, @absPath, @size, @hash)`
    )
    const insertRoute = db.prepare(
      `INSERT INTO analysis_routes (id, analysis_id, name, path, source_file, parent_route, layout_file)
       VALUES (@id, @analysisId, @name, @path, @sourceFile, @parentRoute, @layoutFile)`
    )
    const insertComponent = db.prepare(
      `INSERT INTO analysis_components (id, analysis_id, name, type, file_path, exports, imports)
       VALUES (@id, @analysisId, @name, @type, @filePath, @exports, @imports)`
    )
    const insertService = db.prepare(
      `INSERT INTO analysis_services (id, analysis_id, name, file_path, dependencies, referenced_apis)
       VALUES (@id, @analysisId, @name, @filePath, @dependencies, @referencedApis)`
    )
    const insertModel = db.prepare(
      `INSERT INTO analysis_models (id, analysis_id, entity_name, schema_name, model_file, relationships)
       VALUES (@id, @analysisId, @entityName, @schemaName, @modelFile, @relationships)`
    )
    const insertApi = db.prepare(
      `INSERT INTO analysis_apis (id, analysis_id, endpoint, method, controller, service_refs, source_file)
       VALUES (@id, @analysisId, @endpoint, @method, @controller, @serviceRefs, @sourceFile)`
    )
    const insertRelationship = db.prepare(
      `INSERT INTO analysis_relationships (analysis_id, from_id, to_id, type)
       VALUES (@analysisId, @fromId, @toId, @type)`
    )
    const insertGraphNode = db.prepare(
      `INSERT INTO analysis_graph_nodes (id, analysis_id, type, label, file_path, meta)
       VALUES (@id, @analysisId, @type, @label, @filePath, @meta)`
    )
    const insertGraphEdge = db.prepare(
      `INSERT INTO analysis_graph_edges (analysis_id, from_id, to_id, type)
       VALUES (@analysisId, @fromId, @toId, @type)`
    )

    const tx = db.transaction(() => {
      for (const f of snapshot.files) {
        insertFile.run({ analysisId, ...f })
      }
      for (const r of snapshot.routes) {
        insertRoute.run({ analysisId, ...r })
      }
      for (const c of snapshot.components) {
        insertComponent.run({
          analysisId,
          id: c.id,
          name: c.name,
          type: c.type,
          filePath: c.filePath,
          exports: JSON.stringify(c.exports),
          imports: JSON.stringify(c.imports),
        })
      }
      for (const s of snapshot.services) {
        insertService.run({
          analysisId,
          id: s.id,
          name: s.name,
          filePath: s.filePath,
          dependencies: JSON.stringify(s.dependencies),
          referencedApis: JSON.stringify(s.referencedApis),
        })
      }
      for (const m of snapshot.models) {
        insertModel.run({
          analysisId,
          id: m.id,
          entityName: m.entityName,
          schemaName: m.schemaName,
          modelFile: m.modelFile,
          relationships: JSON.stringify(m.relationships),
        })
      }
      for (const a of snapshot.apis) {
        insertApi.run({
          analysisId,
          id: a.id,
          endpoint: a.endpoint,
          method: a.method,
          controller: a.controller,
          serviceRefs: JSON.stringify(a.serviceRefs),
          sourceFile: a.sourceFile,
        })
      }
      for (const rel of snapshot.relationships) {
        insertRelationship.run({ analysisId, ...rel })
      }
      for (const n of snapshot.graph.nodes) {
        insertGraphNode.run({
          analysisId,
          id: n.id,
          type: n.type,
          label: n.label,
          filePath: n.filePath,
          meta: n.meta ? JSON.stringify(n.meta) : null,
        })
      }
      for (const e of snapshot.graph.edges) {
        insertGraphEdge.run({ analysisId, ...e })
      }
    })
    tx()
  },

  /** Finalize a run: record counts + completion time, status=completed. */
  completeVersion(
    analysisId: string,
    counts: { fileCount: number; nodeCount: number; edgeCount: number }
  ): void {
    getDb()
      .prepare(
        `UPDATE analysis_runs
            SET file_count = ?, node_count = ?, edge_count = ?, status = 'completed', completed_at = ?
          WHERE id = ?`
      )
      .run(counts.fileCount, counts.nodeCount, counts.edgeCount, new Date().toISOString(), analysisId)
  },

  /** Mark a run failed (e.g. on stage error). */
  failVersion(analysisId: string): void {
    getDb()
      .prepare(
        `UPDATE analysis_runs SET status = 'failed', completed_at = ? WHERE id = ?`
      )
      .run(new Date().toISOString(), analysisId)
  },

  /** All runs for a project, newest version first. */
  listVersions(projectId: string): AnalysisVersionMeta[] {
    const rows = getDb()
      .prepare(
        `SELECT * FROM analysis_runs WHERE project_id = ? ORDER BY analysis_version DESC`
      )
      .all(projectId) as RunRow[]
    return rows.map(rowToMeta)
  },

  /**
   * Remove all analysis data for a project (child tables first, then the runs)
   * in one transaction. Must run before deleting the project row, since
   * `analysis_runs` FK-references `projects(id)`.
   */
  deleteForProject(projectId: string): void {
    const db = getDb()
    const childTables = [
      'analysis_files',
      'analysis_routes',
      'analysis_components',
      'analysis_services',
      'analysis_models',
      'analysis_apis',
      'analysis_relationships',
      'analysis_graph_nodes',
      'analysis_graph_edges',
    ]
    const tx = db.transaction((pid: string) => {
      for (const table of childTables) {
        db.prepare(
          `DELETE FROM ${table} WHERE analysis_id IN (SELECT id FROM analysis_runs WHERE project_id = ?)`
        ).run(pid)
      }
      db.prepare(`DELETE FROM analysis_runs WHERE project_id = ?`).run(pid)
    })
    tx(projectId)
  },

  /** The latest completed run metadata, or null. */
  latestCompleted(projectId: string): AnalysisVersionMeta | null {
    const row = getDb()
      .prepare(
        `SELECT * FROM analysis_runs
          WHERE project_id = ? AND status = 'completed'
          ORDER BY analysis_version DESC LIMIT 1`
      )
      .get(projectId) as RunRow | undefined
    return row ? rowToMeta(row) : null
  },
}
