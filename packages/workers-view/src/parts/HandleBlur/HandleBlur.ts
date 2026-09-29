import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const handleBlur = (state: WorkersState): WorkersState => ({ ...state, hasFocus: false })
