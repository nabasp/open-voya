// Domain types for the Code Analysis module. Pure data — no Electron imports —
// so they can be shared with the renderer via `import type`. These are the
// normalized, engine-agnostic structures every downstream pipeline stage
// (manifest, knowledge docs, embeddings, LanceDB) consumes. Nothing here leaks
// the underlying parser (ts-morph) representation.
//
// Every discovered entity carries `id`, `name`, `filePath`, `lineNumber`, and a
// non-empty `type` discriminator so findings are traceable back to source.

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

export type RouteKind = 'page' | 'layout' | 'route-element'

export interface RouteNode {
  id: string
  name: string
  type: RouteKind
  path: string
  filePath: string
  lineNumber: number
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
  lineNumber: number
  exports: string[]
  imports: string[]
  /** Prop names (destructured) or the props parameter type text. */
  props: string[]
  isDefaultExport: boolean
}

export interface ServiceNode {
  id: string
  name: string
  type: 'service'
  filePath: string
  lineNumber: number
  dependencies: string[]
  referencedApis: string[]
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export type ApiKind = 'route-handler' | 'fetch' | 'axios' | 'api-client'

export interface ApiNode {
  id: string
  name: string
  type: ApiKind
  endpoint: string
  method: HttpMethod
  controller: string | null
  serviceRefs: string[]
  filePath: string
  lineNumber: number
  sourceFile: string
}

export interface ModelNode {
  id: string
  name: string
  type: 'model'
  entityName: string
  schemaName: string | null
  modelFile: string
  filePath: string
  lineNumber: number
  relationships: string[]
}

export type UiElementKind = 'button' | 'form' | 'table' | 'dialog'

export interface UiElementNode {
  id: string
  name: string
  type: UiElementKind
  kind: UiElementKind
  label: string
  filePath: string
  lineNumber: number
  componentId: string | null
}

// --- Forms ------------------------------------------------------------------

export type FormType = 'form' | 'form-field' | 'react-hook-form' | 'formik'

export interface FormNode {
  id: string
  name: string
  type: FormType
  filePath: string
  lineNumber: number
  fields: string[]
}

// --- Hooks ------------------------------------------------------------------

export interface HookNode {
  id: string
  name: string
  type: 'hook'
  filePath: string
  lineNumber: number
  inputs: string[]
  outputs: string[]
  sideEffects: string[]
}

// --- State management -------------------------------------------------------

export type StateKind =
  | 'redux-slice'
  | 'zustand-store'
  | 'context'
  | 'usestate-cluster'

export interface StateNode {
  id: string
  name: string
  type: StateKind
  filePath: string
  lineNumber: number
  detail: string
}

// --- Event handlers ---------------------------------------------------------

export interface EventHandlerNode {
  id: string
  name: string
  type: 'event-handler'
  event: string
  handler: string
  filePath: string
  lineNumber: number
}

// --- Candidate business actions (pre-dedup) ---------------------------------

export type CrudOp = 'create' | 'read' | 'update' | 'delete' | 'unknown'
export type ActionSource = 'api' | 'form' | 'handler' | 'naming'

export interface ActionCandidate {
  id: string
  name: string
  type: 'action'
  op: CrudOp
  source: ActionSource
  filePath: string
  lineNumber: number
  detail: string
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

export interface NavigationEdge {
  id: string
  fromId: string
  toId: string
  /** The literal href / route target as found in source. */
  target: string
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
  forms: FormNode[]
  hooks: HookNode[]
  state: StateNode[]
  eventHandlers: EventHandlerNode[]
  actions: ActionCandidate[]
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
