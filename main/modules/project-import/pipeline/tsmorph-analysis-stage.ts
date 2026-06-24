import { analysisService } from '../../code-analysis/services/analysis.service'
import type { PipelineStage } from '../types'

// Repository-analysis stage. Runs immediately after clone/copy and produces the
// normalized source-of-truth (files, routes, components, services, models, APIs,
// UI elements, navigation, relationship graph) consumed by later stages. Stage
// id matches the renderer's "ts-morph analysis" row.
export const tsmorphAnalysisStage: PipelineStage = {
  id: 'tsmorph-analysis',
  name: 'ts-morph analysis',
  async execute(ctx) {
    await analysisService.run(ctx)
  },
}
