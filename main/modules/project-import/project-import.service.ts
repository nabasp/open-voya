import { randomUUID } from 'crypto'
import type { WebContents } from 'electron'

import { projectRepository } from './project.repository'
import {
  WORKSPACE_ROOT,
  ensureWorkspace,
  isNonEmptyDir,
  isValidProjectName,
  pathExists,
  removeDir,
  resolveProjectPath,
} from './workspace.service'
import { emitLog, emitListChanged, emitStatus } from './log-emitter'
import { runPipeline } from './pipeline/pipeline-engine'
import { cloneStage } from './pipeline/clone-stage'
import { copyStage } from './pipeline/copy-stage'
import type { ImportRequest, StartResult, ValidateResult } from './ipc-contract'
import type { LogFn, PipelineContext } from './types'

function isValidGitUrl(url: string): boolean {
  return /^(https?:\/\/|git@|ssh:\/\/|git:\/\/)/.test(url)
}

export const projectImportService = {
  validate(req: ImportRequest): ValidateResult {
    const name = req.projectName?.trim()
    if (!name) return { ok: false, error: 'Project name is required' }
    if (!isValidProjectName(name)) {
      return {
        ok: false,
        error: 'Project name may only contain letters, numbers, dot, dash, underscore',
      }
    }
    if (projectRepository.existsByName(name)) {
      return { ok: false, error: `A project named "${name}" already exists` }
    }
    if (isNonEmptyDir(resolveProjectPath(name))) {
      return { ok: false, error: `Destination folder already exists for "${name}"` }
    }

    if (req.sourceType === 'git') {
      const url = req.gitUrl?.trim()
      if (!url) return { ok: false, error: 'Git repository URL is required' }
      if (!isValidGitUrl(url)) return { ok: false, error: 'Enter a valid Git URL' }
    } else {
      const p = req.localPath?.trim()
      if (!p) return { ok: false, error: 'Select a project folder' }
      if (!pathExists(p)) return { ok: false, error: 'Selected folder does not exist' }
    }
    return { ok: true }
  },

  /**
   * Validates, creates the project record (status=importing), then kicks off the
   * import pipeline asynchronously. Returns the new projectId immediately so the
   * renderer can navigate to the Build screen and subscribe to live logs.
   */
  start(req: ImportRequest, wc: WebContents): StartResult {
    const validation = this.validate(req)
    if (!validation.ok) throw new Error(validation.error)

    ensureWorkspace()

    const name = req.projectName.trim()
    const now = new Date().toISOString()
    const id = randomUUID()
    const project = projectRepository.create({
      id,
      name,
      sourceType: req.sourceType,
      gitUrl: req.sourceType === 'git' ? req.gitUrl?.trim() ?? null : null,
      originalPath: req.sourceType === 'local' ? req.localPath?.trim() ?? null : null,
      localProjectPath: resolveProjectPath(name),
      branch: req.branch?.trim() || null,
      status: 'importing',
      createdAt: now,
      updatedAt: now,
    })
    emitListChanged(wc)

    // Run the pipeline in the background; logs/status stream via IPC events.
    void this.runImport(project.id, req, wc)

    return { projectId: id }
  },

  /** Delete a project: remove its workspace folder and DB rows (logs + record). */
  deleteProject(id: string, wc: WebContents): { ok: true } {
    const project = projectRepository.get(id)
    if (project) {
      // Guard: only ever remove paths inside the managed workspace root.
      if (project.localProjectPath.startsWith(WORKSPACE_ROOT)) {
        removeDir(project.localProjectPath)
      }
    }
    projectRepository.deleteProject(id)
    emitListChanged(wc)
    return { ok: true }
  },

  async runImport(projectId: string, req: ImportRequest, wc: WebContents): Promise<void> {
    const project = projectRepository.get(projectId)
    if (!project) return

    const stages = req.sourceType === 'git' ? [cloneStage] : [copyStage]
    // Each log line is tagged with the stage currently running, then both
    // streamed live and persisted for history/replay.
    let currentStageId: string | undefined = stages[0]?.id
    const log: LogFn = (level, message, progressKey) => {
      const event = {
        projectId,
        timestamp: new Date().toISOString(),
        level,
        message,
        stageId: currentStageId,
        progressKey,
      }
      emitLog(wc, event)
      projectRepository.appendLog({
        projectId,
        stageId: currentStageId ?? null,
        ts: event.timestamp,
        level,
        message,
        progressKey,
      })
    }

    const ctx: PipelineContext = {
      project,
      workspacePath: WORKSPACE_ROOT,
      sourceType: req.sourceType,
      gitUrl: req.gitUrl?.trim(),
      originalPath: req.localPath?.trim(),
      branch: req.branch?.trim() || undefined,
      log,
    }

    log('info', '> Creating workspace')
    try {
      await runPipeline(stages, ctx, (stageId, stageStatus, error) => {
        currentStageId = stageId
        emitStatus(wc, {
          projectId,
          status: stageStatus === 'failed' ? 'failed' : 'importing',
          stageId,
          stageStatus,
          error,
        })
      })
      projectRepository.updateStatus(projectId, 'ready')
      log('info', '> Project ready')
      emitStatus(wc, { projectId, status: 'ready' })
      emitListChanged(wc)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      projectRepository.updateStatus(projectId, 'failed')
      removeDir(project.localProjectPath)
      emitStatus(wc, { projectId, status: 'failed', error: message })
      emitListChanged(wc)
    }
  },
}
