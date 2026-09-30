import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const scrollWorkers = (state: WorkersState, scrollTop: number): WorkersState => {
  const { scrollTop: currentScrollTop } = state
  if (!Number.isFinite(scrollTop) || scrollTop < 0 || scrollTop === currentScrollTop) {
    return state
  }
  return { ...state, scrollTop }
}
