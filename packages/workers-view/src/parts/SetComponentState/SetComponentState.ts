import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

const applyComponentState = (currentState: WorkersState, state: WorkersState): WorkersState => {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new TypeError('Workers state must be an object')
  }
  const { uid } = state
  if (uid !== currentState.uid) {
    throw new Error(`Workers state uid must remain ${currentState.uid}`)
  }
  return { ...state }
}

export const setComponentState = WorkersStates.wrapCommand(applyComponentState)
