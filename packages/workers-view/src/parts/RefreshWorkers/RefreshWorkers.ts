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
    getMemoryUsages: () =>
      signal?.aborted ? Promise.resolve(Object.create(null) as Record<string, { readonly usedSize: number }>) : WorkerMemory.getMemoryUsages(uid),
    getShowMemoryUsageTrend: async () => (await RendererProcess.invoke('Preferences.get', 'workers.memoryUsageTrend.enabled')) === true,
    getWorkers: () => RendererProcess.invoke('Workers.getWorkers'),
    now: Date.now,
  })
  const latestState = WorkersStates.get(uid)?.newState || state
  const { selectedWorkerId, sortColumn, sortDirection } = latestState
  const selectedWorkerExists = refreshedState.workers.some((worker) => worker.id === selectedWorkerId)
  const workerIds = new Set(refreshedState.workers.map((worker) => worker.id))
  let nextSelectedWorkerId = selectedWorkerId
  if (!selectedWorkerExists && selectedWorkerId) {
    nextSelectedWorkerId = refreshedState.workers[0]?.id
  }
  return {
    ...refreshedState,
    collapsedWorkerIds: (latestState.collapsedWorkerIds || []).filter((id) => workerIds.has(id)),
    hasFocus: latestState.hasFocus,
    selectedWorkerId: nextSelectedWorkerId,
    sortColumn,
    sortDirection,
    workers: SortWorkers.sortWorkers(refreshedState.workers, sortColumn, sortDirection),
  }
}
