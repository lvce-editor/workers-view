import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as ToError from '../ToError/ToError.ts'

export const setError = (state: WorkersState, error: unknown): WorkersState => ({ ...state, error: ToError.toError(error) })
