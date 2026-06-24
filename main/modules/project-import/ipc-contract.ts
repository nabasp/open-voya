// Single source of truth for IPC channel names + payload shapes.
// Electron-free so the renderer can import both the channel constants (values)
// and the payload types — mirroring how renderer/preload.d.ts imports from main.

import type { BuildLogEvent, Project, ProjectStatus, SourceType } from './types'

export const IpcChannels = {
  // request/response (ipcRenderer.invoke / ipcMain.handle)
  pickFolder: 'project.import.pickFolder',
  validate: 'project.import.validate',
  start: 'project.import.start',
  history: 'project.import.history',
  delete: 'project.delete',
  list: 'project.list',
  get: 'project.get',
  // streaming events (webContents.send / window.ipc.on)
  logs: 'project.import.logs',
  status: 'project.import.status',
  listChanged: 'project.list.changed',
} as const

export interface PickFolderResult {
  path: string | null
}

export interface ImportRequest {
  sourceType: SourceType
  gitUrl?: string
  localPath?: string
  projectName: string
  branch?: string
}

export interface ValidateResult {
  ok: boolean
  error?: string
}

export interface StartResult {
  projectId: string
}

export type StageStatus = 'active' | 'done' | 'failed'

export interface StatusEvent {
  projectId: string
  status: ProjectStatus
  stageId?: string
  stageStatus?: StageStatus
  error?: string
}

export type { BuildLogEvent, Project }
