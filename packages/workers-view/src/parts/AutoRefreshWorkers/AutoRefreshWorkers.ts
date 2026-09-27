import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as RefreshWorkers from '../RefreshWorkers/RefreshWorkers.ts'

export const autoRefresh = (state: WorkersState): WorkersState | Promise<WorkersState> => {
  const { error } = state
  return error ? state : RefreshWorkers.refresh(state)
}
