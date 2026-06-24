import { copyLocalFolder } from '../local-folder.service'
import type { PipelineStage } from '../types'

// MVP local-folder stage. Stage id matches the renderer's "Import local folder" row.
export const copyStage: PipelineStage = {
  id: 'import-local-folder',
  name: 'Import local folder',
  async execute(ctx) {
    if (!ctx.originalPath) throw new Error('Missing source folder')
    await copyLocalFolder({
      src: ctx.originalPath,
      dest: ctx.project.localProjectPath,
      log: ctx.log,
      signal: ctx.signal,
    })
  },
}
