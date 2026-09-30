import { afterEach, expect, jest, test } from '@jest/globals'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import type { WorkersState } from '../src/parts/WorkersState/WorkersState.ts'
import { showWorkerContextMenu } from '../src/parts/ShowWorkerContextMenu/ShowWorkerContextMenu.ts'
import * as WorkersStates from '../src/parts/WorkersStates/WorkersStates.ts'

const worker = { id: 'worker-1', memory: null, name: 'Worker', runtimeName: 'Worker [1]' }
const uid = 42
const state = {
  domRendered: true,
  error: undefined,
  hasFocus: false,
  height: 100,
  loaded: true,
  platform: 0,
  scrollTop: 0,
  selectedWorkerId: undefined,
  sortColumn: undefined,
  sortDirection: undefined,
  uid,
  width: 100,
  workers: [worker],
  x: 0,
  y: 0,
} satisfies WorkersState

afterEach(() => WorkersStates.dispose(uid))

test('selects the row and opens the shared menu at the pointer coordinates', async () => {
  const showContextMenu = jest.fn<(...args: readonly unknown[]) => Promise<void>>(async () => {})
  RendererWorker.registerMockRpc({ 'ContextMenu.show2': showContextMenu })
  WorkersStates.set(uid, state, state)
  const result = await showWorkerContextMenu(state, worker.id, 10, 20)
  expect(result).toMatchObject({ hasFocus: true, selectedWorkerId: worker.id })
  expect(WorkersStates.get(uid).newState).toMatchObject({ hasFocus: true, selectedWorkerId: worker.id })
  expect(showContextMenu).toHaveBeenCalledWith(42, 35, 10, 20, { workerId: worker.id })
})

test('does not open a menu for a worker that disappeared', async () => {
  const showContextMenu = jest.fn<(...args: readonly unknown[]) => Promise<void>>(async () => {})
  RendererWorker.registerMockRpc({ 'ContextMenu.show2': showContextMenu })
  await expect(showWorkerContextMenu(state, 'missing', 10, 20)).resolves.toBe(state)
  expect(showContextMenu).not.toHaveBeenCalled()
})
