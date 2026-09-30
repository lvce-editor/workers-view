import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const resize = (state: WorkersState, x: number, y: number, width: number, height: number): WorkersState => ({ ...state, height, width, x, y })
