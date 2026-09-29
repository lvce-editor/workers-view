import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const focusWorkers = (state: WorkersState): WorkersState => ({ ...state, hasFocus: true })
