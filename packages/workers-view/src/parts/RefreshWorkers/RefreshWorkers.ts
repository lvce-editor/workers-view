import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as Refresh from '../Refresh/Refresh.ts'
import * as RendererProcess from '../RendererProcess/RendererProcess.ts'
import * as SortWorkers from '../SortWorkers/SortWorkers.ts'
import * as ViewLifetime from '../ViewLifetime/ViewLifetime.ts'
import * as WorkerMemory from '../WorkerMemory/WorkerMemory.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const refresh = async (state: WorkersState): Promise<WorkersState> => {
  const { uid } = state
  const signal = ViewLifetime.get(uid)
  const refreshedState = await Refresh.refresh(state, {
    getMemoryUsages: () => (signal?.aborted ? Promise.resolve(new Map()) : WorkerMemory.getMemoryUsages(uid)),
    getWorkers: () => RendererProcess.invoke('Workers.getWorkers'),
  })
  const latestState = WorkersStates.get(uid)?.newState || state
  const { sortColumn, sortDirection } = latestState
  return {
    ...refreshedState,
    sortColumn,
    sortDirection,
    workers: SortWorkers.sortWorkers(refreshedState.workers, sortColumn, sortDirection),
  }
}
