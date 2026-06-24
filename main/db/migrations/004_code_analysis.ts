import type { Migration } from './index'

// Repository-analysis snapshots produced by the ts-morph analysis pipeline stage.
// `analysis_runs` is the versioned header (one row per analysis run per project);
// every other table holds the normalized discovery output for a single run and
// FK-references the run via `analysis_id`. Downstream stages (manifest, knowledge
// docs, embeddings, LanceDB) read the latest completed run.
export const migration004: Migration = {
  version: 4,
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS analysis_runs (
        id               TEXT PRIMARY KEY,
        project_id       TEXT NOT NULL,
        analysis_version INTEGER NOT NULL,
        file_count       INTEGER NOT NULL DEFAULT 0,
        node_count       INTEGER NOT NULL DEFAULT 0,
        edge_count       INTEGER NOT NULL DEFAULT 0,
        status           TEXT NOT NULL,
        started_at       TEXT NOT NULL,
        completed_at     TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_runs_version
        ON analysis_runs(project_id, analysis_version);
      CREATE INDEX IF NOT EXISTS idx_analysis_runs_project
        ON analysis_runs(project_id);

      CREATE TABLE IF NOT EXISTS analysis_files (
        id          TEXT NOT NULL,
        analysis_id TEXT NOT NULL,
        name        TEXT NOT NULL,
        ext         TEXT,
        rel_path    TEXT NOT NULL,
        abs_path    TEXT NOT NULL,
        size        INTEGER NOT NULL DEFAULT 0,
        hash        TEXT,
        PRIMARY KEY (analysis_id, id),
        FOREIGN KEY (analysis_id) REFERENCES analysis_runs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_analysis_files_run ON analysis_files(analysis_id);

      CREATE TABLE IF NOT EXISTS analysis_routes (
        id           TEXT NOT NULL,
        analysis_id  TEXT NOT NULL,
        name         TEXT NOT NULL,
        path         TEXT NOT NULL,
        source_file  TEXT,
        parent_route TEXT,
        layout_file  TEXT,
        PRIMARY KEY (analysis_id, id),
        FOREIGN KEY (analysis_id) REFERENCES analysis_runs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_analysis_routes_run ON analysis_routes(analysis_id);

      CREATE TABLE IF NOT EXISTS analysis_components (
        id          TEXT NOT NULL,
        analysis_id TEXT NOT NULL,
        name        TEXT NOT NULL,
        type        TEXT,
        file_path   TEXT NOT NULL,
        exports     TEXT,
        imports     TEXT,
        PRIMARY KEY (analysis_id, id),
        FOREIGN KEY (analysis_id) REFERENCES analysis_runs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_analysis_components_run ON analysis_components(analysis_id);

      CREATE TABLE IF NOT EXISTS analysis_services (
        id             TEXT NOT NULL,
        analysis_id    TEXT NOT NULL,
        name           TEXT NOT NULL,
        file_path      TEXT NOT NULL,
        dependencies   TEXT,
        referenced_apis TEXT,
        PRIMARY KEY (analysis_id, id),
        FOREIGN KEY (analysis_id) REFERENCES analysis_runs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_analysis_services_run ON analysis_services(analysis_id);

      CREATE TABLE IF NOT EXISTS analysis_models (
        id           TEXT NOT NULL,
        analysis_id  TEXT NOT NULL,
        entity_name  TEXT NOT NULL,
        schema_name  TEXT,
        model_file   TEXT,
        relationships TEXT,
        PRIMARY KEY (analysis_id, id),
        FOREIGN KEY (analysis_id) REFERENCES analysis_runs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_analysis_models_run ON analysis_models(analysis_id);

      CREATE TABLE IF NOT EXISTS analysis_apis (
        id            TEXT NOT NULL,
        analysis_id   TEXT NOT NULL,
        endpoint      TEXT NOT NULL,
        method        TEXT NOT NULL,
        controller    TEXT,
        service_refs  TEXT,
        source_file   TEXT,
        PRIMARY KEY (analysis_id, id),
        FOREIGN KEY (analysis_id) REFERENCES analysis_runs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_analysis_apis_run ON analysis_apis(analysis_id);

      CREATE TABLE IF NOT EXISTS analysis_relationships (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id TEXT NOT NULL,
        from_id     TEXT NOT NULL,
        to_id       TEXT NOT NULL,
        type        TEXT NOT NULL,
        FOREIGN KEY (analysis_id) REFERENCES analysis_runs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_analysis_relationships_run ON analysis_relationships(analysis_id);

      CREATE TABLE IF NOT EXISTS analysis_graph_nodes (
        id          TEXT NOT NULL,
        analysis_id TEXT NOT NULL,
        type        TEXT NOT NULL,
        label       TEXT NOT NULL,
        file_path   TEXT,
        meta        TEXT,
        PRIMARY KEY (analysis_id, id),
        FOREIGN KEY (analysis_id) REFERENCES analysis_runs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_analysis_graph_nodes_run ON analysis_graph_nodes(analysis_id);

      CREATE TABLE IF NOT EXISTS analysis_graph_edges (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id TEXT NOT NULL,
        from_id     TEXT NOT NULL,
        to_id       TEXT NOT NULL,
        type        TEXT NOT NULL,
        FOREIGN KEY (analysis_id) REFERENCES analysis_runs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_analysis_graph_edges_run ON analysis_graph_edges(analysis_id);
    `)
  },
}
