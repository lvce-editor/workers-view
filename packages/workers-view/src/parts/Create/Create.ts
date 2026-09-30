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
  const state: WorkersState = {
    contextMenuWorkerId: undefined,
    domRendered: false,
    error: undefined,
    hasFocus: false,
    height,
    loaded: false,
    platform,
    selectedWorkerId: undefined,
    sortColumn: undefined,
    sortDirection: undefined,
    uid,
    width,
    workers: [],
  }
  WorkersStates.set(uid, state, state)
}
