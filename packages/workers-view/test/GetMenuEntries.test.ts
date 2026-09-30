import { afterEach, expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import type { WorkersState } from '../src/parts/WorkersState/WorkersState.ts'
import { getMenuEntries, getMenuEntriesForUid } from '../src/parts/GetMenuEntries/GetMenuEntries.ts'
import { getMenuEntryIds } from '../src/parts/GetMenuEntryIds/GetMenuEntryIds.ts'
import * as WorkersStates from '../src/parts/WorkersStates/WorkersStates.ts'

const worker = { id: 'worker-1', memory: null, name: 'Editor Worker', runtimeName: 'Editor Worker [worker-1]' }
const uid = 7
const state: WorkersState = {
  domRendered: false,
  error: undefined,
  hasFocus: false,
  height: 100,
  loaded: true,
  platform: PlatformType.Electron,
  scrollTop: 0,
  selectedWorkerId: undefined,
  sortColumn: undefined,
  sortDirection: undefined,
  uid,
  width: 100,
  workers: [worker],
  x: 0,
  y: 0,
}

afterEach(() => WorkersStates.dispose(uid))

test('registers the Workers context menu', () => {
  expect(getMenuEntryIds()).toEqual([35])
})

test('offers termination and heap snapshots for an Electron worker', () => {
  expect(getMenuEntries(state, worker.id)).toEqual([
    expect.objectContaining({ args: [worker.id], command: 'Workers.terminateWorker', label: 'Terminate Worker' }),
    expect.objectContaining({ args: [worker.id], command: 'Workers.takeHeapSnapshot', label: 'Take Heap Snapshot' }),
  ])
})

test('offers termination only in the browser', () => {
  expect(getMenuEntries({ ...state, platform: PlatformType.Web }, worker.id)).toEqual([
    expect.objectContaining({ args: [worker.id], command: 'Workers.terminateWorker' }),
  ])
})

test('does not create a menu for a stale worker', () => {
  expect(getMenuEntries(state, 'missing')).toEqual([])
})

test('gets menu entries from the current view state', () => {
  WorkersStates.set(uid, state, state)
  expect(getMenuEntriesForUid(uid, { workerId: worker.id })).toHaveLength(2)
})
