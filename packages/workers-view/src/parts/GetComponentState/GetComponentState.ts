import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const getComponentState = (uid: number): WorkersState => {
  return WorkersStates.get(uid).newState
}
