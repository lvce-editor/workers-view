import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as ViewLifetime from '../ViewLifetime/ViewLifetime.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const create = (
  uid: number,
  _uri: string,
  _x: number,
  _y: number,
  width: number,
  height: number,
  platform: number,
  _assetDir: string,
): void => {
  ViewLifetime.create(uid)
  const state: WorkersState = { error: undefined, height, loaded: false, platform, uid, width, workers: [] }
  WorkersStates.set(uid, state, state)
}
