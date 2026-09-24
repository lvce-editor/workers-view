import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const resize = (state: WorkersState, width: number, height: number): WorkersState => ({ ...state, height, width })
