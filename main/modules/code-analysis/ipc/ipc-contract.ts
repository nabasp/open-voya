// IPC channel names + payload shapes for the Code Analysis module. Electron-free
// so the renderer can import both the channel constants and the payload types.
// These are read-only endpoints over completed analysis snapshots — later stages
// and the renderer consume them; this stage never receives commands.

import type { AnalysisSnapshot, AnalysisVersionMeta, GraphEdge, GraphNode } from '../types'

export const AnalysisIpcChannels = {
  // request/response (ipcRenderer.invoke / ipcMain.handle)
  get: 'analysis.get', // latest completed snapshot for a project
  versions: 'analysis.versions', // all run metadata for a project
  graph: 'analysis.graph', // just the relationship graph for the latest run
} as const

export interface AnalysisGetRequest {
  projectId: string
}

export type AnalysisGetResult = AnalysisSnapshot | null

export type AnalysisVersionsResult = AnalysisVersionMeta[]

export interface AnalysisGraphResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
