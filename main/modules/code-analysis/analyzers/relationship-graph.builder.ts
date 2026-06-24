import type {
  ApiNode,
  ComponentNode,
  FileNode,
  GraphEdge,
  GraphNode,
  ModelNode,
  NavigationEdge,
  Relationship,
  RouteNode,
  ServiceNode,
  UiElementNode,
} from '../types'

export interface GraphInput {
  files: FileNode[]
  routes: RouteNode[]
  components: ComponentNode[]
  services: ServiceNode[]
  models: ModelNode[]
  apis: ApiNode[]
  uiElements: UiElementNode[]
  navigation: NavigationEdge[]
  /** File→file import relationships from the dependency analyzer. */
  fileRelationships: Relationship[]
}

/**
 * Assemble the normalized relationship graph from every extractor output.
 * Node types: file|route|component|service|model|api|form|button|dialog|table.
 * Edge types: imports|exports|uses|renders|references|calls|navigates_to|contains.
 * This graph is the source of truth that later powers the Manifest stage.
 */
export function buildRelationshipGraph(input: GraphInput): {
  nodes: GraphNode[]
  edges: GraphEdge[]
} {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const fileIdByRelPath = new Map(input.files.map((f) => [f.relPath, f.id]))
  const nodeIds = new Set<string>()

  const addNode = (n: GraphNode) => {
    if (nodeIds.has(n.id)) return
    nodeIds.add(n.id)
    nodes.push(n)
  }
  const addEdge = (fromId: string, toId: string, type: GraphEdge['type']) => {
    edges.push({ fromId, toId, type })
  }
  const containedBy = (filePath: string | null, childId: string) => {
    if (!filePath) return
    const fileId = fileIdByRelPath.get(filePath)
    if (fileId) addEdge(fileId, childId, 'contains')
  }

  // --- Nodes ---
  for (const f of input.files) {
    addNode({ id: f.id, type: 'file', label: f.relPath, filePath: f.relPath })
  }
  for (const r of input.routes) {
    addNode({ id: r.id, type: 'route', label: r.path, filePath: r.sourceFile })
    containedBy(r.sourceFile, r.id)
  }
  for (const c of input.components) {
    addNode({ id: c.id, type: 'component', label: c.name, filePath: c.filePath })
    containedBy(c.filePath, c.id)
  }
  for (const s of input.services) {
    addNode({ id: s.id, type: 'service', label: s.name, filePath: s.filePath })
    containedBy(s.filePath, s.id)
  }
  for (const m of input.models) {
    addNode({ id: m.id, type: 'model', label: m.entityName, filePath: m.modelFile })
    containedBy(m.modelFile, m.id)
  }
  for (const a of input.apis) {
    addNode({
      id: a.id,
      type: 'api',
      label: `${a.method} ${a.endpoint}`,
      filePath: a.sourceFile,
    })
    containedBy(a.sourceFile, a.id)
  }
  for (const u of input.uiElements) {
    // UI element graph node types are the element kind itself.
    addNode({ id: u.id, type: u.kind, label: u.label, filePath: u.filePath })
    containedBy(u.filePath, u.id)
  }

  // --- Edges ---
  // file→file imports
  for (const rel of input.fileRelationships) {
    if (nodeIds.has(rel.fromId) && nodeIds.has(rel.toId)) {
      addEdge(rel.fromId, rel.toId, rel.type)
    }
  }

  // component → ui element (same file): renders
  const componentsByFile = groupBy(input.components, (c) => c.filePath)
  for (const u of input.uiElements) {
    const comps = componentsByFile.get(u.filePath)
    if (comps && comps.length) addEdge(comps[0].id, u.id, 'renders')
  }

  // route → component (route file's components): references
  const routeByFile = groupBy(input.routes, (r) => r.sourceFile)
  for (const c of input.components) {
    const routesInFile = routeByFile.get(c.filePath)
    if (routesInFile) {
      for (const r of routesInFile) addEdge(r.id, c.id, 'references')
    }
  }

  // api → service / service → service: uses
  const serviceByName = new Map<string, string>()
  for (const s of input.services) serviceByName.set(s.name.toLowerCase(), s.id)
  for (const a of input.apis) {
    for (const ref of a.serviceRefs) {
      const sid = serviceByName.get(ref.toLowerCase())
      if (sid) addEdge(a.id, sid, 'uses')
    }
  }
  for (const s of input.services) {
    for (const ref of s.referencedApis) {
      const sid = serviceByName.get(ref.toLowerCase())
      if (sid && sid !== s.id) addEdge(s.id, sid, 'uses')
    }
  }

  // navigation: navigates_to (only when both endpoints are graph nodes)
  for (const n of input.navigation) {
    if (nodeIds.has(n.fromId) && nodeIds.has(n.toId)) {
      addEdge(n.fromId, n.toId, 'navigates_to')
    }
  }

  return { nodes, edges }
}

function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const arr = map.get(k)
    if (arr) arr.push(item)
    else map.set(k, [item])
  }
  return map
}
