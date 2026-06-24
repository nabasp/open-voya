import type { PipelineContext, PipelineStage } from '../types'

export type StageStatus = 'active' | 'done' | 'failed'
export type StageReporter = (
  stageId: string,
  status: StageStatus,
  error?: string
) => void

/**
 * Runs stages in order. Each stage is wrapped in try/catch; on failure the
 * error is logged + reported and the pipeline stops (rethrows). Future build
 * stages implement PipelineStage and are simply appended — no refactor.
 */
export async function runPipeline(
  stages: PipelineStage[],
  ctx: PipelineContext,
  report?: StageReporter
): Promise<void> {
  for (const stage of stages) {
    report?.(stage.id, 'active')
    ctx.log('info', `> ${stage.name}`)
    try {
      await stage.execute(ctx)
      report?.(stage.id, 'done')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      ctx.log('error', message)
      report?.(stage.id, 'failed', message)
      throw err
    }
  }
}
