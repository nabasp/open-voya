import { gitClone } from '../git-clone.service'
import type { PipelineStage } from '../types'

// MVP git stage. Stage id matches the renderer's "Clone repository" row.
export const cloneStage: PipelineStage = {
  id: 'clone-repository',
  name: 'Clone repository',
  async execute(ctx) {
    if (!ctx.gitUrl) throw new Error('Missing git URL')
    await gitClone({
      url: ctx.gitUrl,
      dest: ctx.project.localProjectPath,
      branch: ctx.branch,
      log: ctx.log,
      signal: ctx.signal,
    })
  },
}
