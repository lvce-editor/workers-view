import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as RefreshWorkers from '../RefreshWorkers/RefreshWorkers.ts'
import * as RendererProcess from '../RendererProcess/RendererProcess.ts'

export const terminateWorker = async (state: WorkersState, workerId: string): Promise<WorkersState> => {
  const { workers } = state
  if (workers.every((worker) => worker.id !== workerId)) {
    return state
  }
  await RendererProcess.invoke('Workers.terminate', workerId)
  return RefreshWorkers.refresh({ ...state, selectedWorkerId: undefined })
}
