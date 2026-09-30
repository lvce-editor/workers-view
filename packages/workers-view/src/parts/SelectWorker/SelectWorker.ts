import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const selectWorker = (state: WorkersState, workerId: string): WorkersState => {
  const { workers } = state
  if (workers.every((worker) => worker.id !== workerId)) return state
  return { ...state, hasFocus: true, selectedWorkerId: workerId }
}
