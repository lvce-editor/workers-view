import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as AutoRefresh from '../AutoRefresh/AutoRefresh.ts'
import * as RefreshWorkers from '../RefreshWorkers/RefreshWorkers.ts'
import * as ViewLifetime from '../ViewLifetime/ViewLifetime.ts'

export const loadContent = async (state: WorkersState): Promise<WorkersState> => {
  const { uid } = state
  const signal = ViewLifetime.get(uid)
  const newState = await RefreshWorkers.refresh(state)
  if (signal && !signal.aborted) AutoRefresh.start(uid)
  return newState
}
