import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers/create-window'
import { getDb } from './db/database'
import { ensureWorkspace } from './modules/project-import/workspace.service'
import { projectRepository } from './modules/project-import/project.repository'
import { registerProjectImportIpc } from './modules/project-import/ipc'
import { registerCodeAnalysisIpc } from './modules/code-analysis/ipc/ipc'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
  await app.whenReady()

  // Initialize persistence + workspace, then reconcile any import that was
  // interrupted by a previous crash/quit so the UI never shows a stuck spinner.
  getDb()
  ensureWorkspace()
  projectRepository.reconcileStaleImports()

  const mainWindow = createWindow('main', {
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.js'),
    },
  })

  registerProjectImportIpc(() => mainWindow)
  registerCodeAnalysisIpc()

  if (isProd) {
    await mainWindow.loadURL('app://./dashboard')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/dashboard`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})
