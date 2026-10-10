import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const toggleWorker = (state: WorkersState, workerId: string): WorkersState => {
  const { collapsedWorkerIds = [], workers } = state
  const workerExists = workers.some((worker) => worker.id === workerId)
  if (!workerExists || workers.every((worker) => worker.parentId !== workerId)) return state
  const currentCollapsedWorkerIds = collapsedWorkerIds
  const nextCollapsedWorkerIds = currentCollapsedWorkerIds.includes(workerId)
    ? currentCollapsedWorkerIds.filter((id) => id !== workerId)
    : [...currentCollapsedWorkerIds, workerId]
  return { ...state, collapsedWorkerIds: nextCollapsedWorkerIds, hasFocus: true, selectedWorkerId: workerId }
}
