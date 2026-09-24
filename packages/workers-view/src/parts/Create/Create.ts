import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const create = (uid: number, _uri: string, _x: number, _y: number, width: number, height: number, platform: number): void => {
  const state: WorkersState = { height, loaded: false, platform, uid, width, workers: [] }
  WorkersStates.set(uid, state, state)
}
