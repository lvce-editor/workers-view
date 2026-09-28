import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as Refresh from '../Refresh/Refresh.ts'
import * as RendererProcess from '../RendererProcess/RendererProcess.ts'
import * as ViewLifetime from '../ViewLifetime/ViewLifetime.ts'
import * as WorkerMemory from '../WorkerMemory/WorkerMemory.ts'

export const refresh = (state: WorkersState): Promise<WorkersState> => {
  const { uid } = state
  const signal = ViewLifetime.get(uid)
  return Refresh.refresh(state, {
    getMemoryUsages: () => (signal?.aborted ? Promise.resolve(new Map()) : WorkerMemory.getMemoryUsages(uid)),
    getWorkers: () => RendererProcess.invoke('Workers.getWorkers'),
  })
}
