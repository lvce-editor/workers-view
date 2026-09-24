import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as AutoRefresh from '../AutoRefresh/AutoRefresh.ts'
import * as RefreshWorkers from '../RefreshWorkers/RefreshWorkers.ts'

export const loadContent = async (state: WorkersState): Promise<WorkersState> => {
  const { uid } = state
  const newState = await RefreshWorkers.refresh(state)
  AutoRefresh.start(uid)
  return newState
}
