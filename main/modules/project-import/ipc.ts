import { dialog, ipcMain, type BrowserWindow, type OpenDialogOptions } from 'electron'

import { IpcChannels } from './ipc-contract'
import type { ImportRequest } from './ipc-contract'
import { projectImportService } from './project-import.service'
import { projectRepository } from './project.repository'

/**
 * Registers all project.* IPC handlers. `getWindow` resolves the window used to
 * parent the native folder picker. Import events are sent back through the
 * invoking renderer's webContents (e.sender).
 */
export function registerProjectImportIpc(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IpcChannels.pickFolder, async () => {
    const win = getWindow()
    const opts: OpenDialogOptions = { properties: ['openDirectory'] }
    const result = win
      ? await dialog.showOpenDialog(win, opts)
      : await dialog.showOpenDialog(opts)
    if (result.canceled || result.filePaths.length === 0) return { path: null }
    return { path: result.filePaths[0] }
  })

  ipcMain.handle(IpcChannels.validate, (_e, req: ImportRequest) =>
    projectImportService.validate(req)
  )

  ipcMain.handle(IpcChannels.start, (e, req: ImportRequest) =>
    projectImportService.start(req, e.sender)
  )

  ipcMain.handle(IpcChannels.history, (_e, payload: { id: string }) =>
    projectRepository.listLogs(payload.id)
  )

  ipcMain.handle(IpcChannels.delete, (e, payload: { id: string }) =>
    projectImportService.deleteProject(payload.id, e.sender)
  )

  ipcMain.handle(IpcChannels.list, () => projectRepository.list())

  ipcMain.handle(IpcChannels.get, (_e, payload: { id: string }) =>
    projectRepository.get(payload.id)
  )
}
