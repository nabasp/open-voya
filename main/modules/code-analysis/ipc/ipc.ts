import { ipcMain } from 'electron'

import { AnalysisIpcChannels, type AnalysisGetRequest } from './ipc-contract'
import { analysisService } from '../services/analysis.service'

/**
 * Registers read-only `analysis.*` IPC handlers exposing the latest completed
 * analysis snapshot / versions / graph for a project. This stage only produces
 * data; these endpoints let the renderer and later stages consume it.
 */
export function registerCodeAnalysisIpc(): void {
  ipcMain.handle(AnalysisIpcChannels.get, (_e, req: AnalysisGetRequest) =>
    analysisService.getLatestSnapshot(req.projectId)
  )

  ipcMain.handle(AnalysisIpcChannels.versions, (_e, req: AnalysisGetRequest) =>
    analysisService.listVersions(req.projectId)
  )

  ipcMain.handle(AnalysisIpcChannels.graph, (_e, req: AnalysisGetRequest) =>
    analysisService.getGraph(req.projectId)
  )
}
