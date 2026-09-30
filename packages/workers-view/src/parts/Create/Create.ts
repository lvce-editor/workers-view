import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as ViewLifetime from '../ViewLifetime/ViewLifetime.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const create = (uid: number, _uri: string, x: number, y: number, width: number, height: number, platform: number, _assetDir: string): void => {
  ViewLifetime.create(uid)
  const state: WorkersState = {
    domRendered: false,
    error: undefined,
    hasFocus: false,
    height,
    loaded: false,
    platform,
    scrollTop: 0,
    selectedWorkerId: undefined,
    sortColumn: undefined,
    sortDirection: undefined,
    uid,
    width,
    workers: [],
    x,
    y,
  }
  WorkersStates.set(uid, state, state)
}
