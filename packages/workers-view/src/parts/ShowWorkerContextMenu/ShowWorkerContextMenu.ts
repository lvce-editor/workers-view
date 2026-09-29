import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const showWorkerContextMenu = (state: WorkersState, workerId: string): WorkersState => {
  const { workers } = state
  if (workers.every((worker) => worker.id !== workerId)) return state
  return {
    ...state,
    contextMenuWorkerId: workerId,
    hasFocus: true,
    selectedWorkerId: workerId,
  }
}
