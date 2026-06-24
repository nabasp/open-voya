// Domain types for the Code Analysis module. Pure data — no Electron imports —
// so they can be shared with the renderer via `import type`. These are the
// normalized, engine-agnostic structures every downstream pipeline stage
// (manifest, knowledge docs, embeddings, LanceDB) consumes. Nothing here leaks
// the underlying parser (ts-morph) representation.

export type AnalysisStatus = 'running' | 'completed' | 'failed'

/** High-level facts about the analyzed repository. */
export interface RepositoryMeta {
  projectName: string
  repoPath: string
  repoRoot: string
  totalFiles: number
  totalDirectories: number
  scanTimestamp: string
}

/** One source file in the inventory. `id` is stable (derived from relPath). */
export interface FileNode {
  id: string
  name: string
  ext: string
  relPath: string
  absPath: string
  size: number
  hash: string
}

export interface RouteNode {
  id: string
  name: string
  path: string
  sourceFile: string
  parentRoute: string | null
  layoutFile: string | null
}

export type ComponentType = 'function' | 'class' | 'arrow' | 'memo' | 'unknown'

export interface ComponentNode {
  id: string
  name: string
  type: ComponentType
  filePath: string
  exports: string[]
  imports: string[]
}

export interface ServiceNode {
  id: string
  name: string
  filePath: string
  dependencies: string[]
  referencedApis: string[]
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export interface ApiNode {
  id: string
  endpoint: string
  method: HttpMethod
  controller: string | null
  serviceRefs: string[]
  sourceFile: string
}

export interface ModelNode {
  id: string
  entityName: string
  schemaName: string | null
  modelFile: string
  relationships: string[]
}

export type UiElementKind = 'button' | 'form' | 'table' | 'dialog'

export interface UiElementNode {
  id: string
  kind: UiElementKind
  label: string
  filePath: string
  componentId: string | null
}

export interface NavigationEdge {
  id: string
  fromId: string
  toId: string
  /** The literal href / route target as found in source. */
  target: string
}

// --- Relationship graph -----------------------------------------------------

export type GraphNodeType =
  | 'file'
  | 'route'
  | 'component'
  | 'service'
  | 'model'
  | 'api'
  | 'form'
  | 'button'
  | 'dialog'
  | 'table'

export type GraphEdgeType =
  | 'imports'
  | 'exports'
  | 'uses'
  | 'renders'
  | 'references'
  | 'calls'
  | 'navigates_to'
  | 'contains'

export interface GraphNode {
  id: string
  type: GraphNodeType
  label: string
  filePath: string | null
  meta?: Record<string, unknown>
}

export interface GraphEdge {
  fromId: string
  toId: string
  type: GraphEdgeType
}

/** A file→file (or node→node) dependency relationship. */
export interface Relationship {
  fromId: string
  toId: string
  type: GraphEdgeType
}

// --- Aggregate snapshot + versioning ---------------------------------------

/** The full normalized output of one analysis run (mirrors the JSON artifacts). */
export interface AnalysisSnapshot {
  repository: RepositoryMeta
  files: FileNode[]
  routes: RouteNode[]
  components: ComponentNode[]
  services: ServiceNode[]
  apis: ApiNode[]
  models: ModelNode[]
  uiElements: UiElementNode[]
  navigation: NavigationEdge[]
  relationships: Relationship[]
  graph: { nodes: GraphNode[]; edges: GraphEdge[] }
}

export interface AnalysisVersionMeta {
  id: string
  projectId: string
  analysisVersion: number
  fileCount: number
  nodeCount: number
  edgeCount: number
  status: AnalysisStatus
  startedAt: string
  completedAt: string | null
}
