import { expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { MainProcess, RendererWorker } from '@lvce-editor/rpc-registry'
import type { WorkersState } from '../src/parts/WorkersState/WorkersState.ts'
import { takeHeapSnapshot } from '../src/parts/TakeHeapSnapshot/TakeHeapSnapshot.ts'

const worker = { id: 'worker-1', memory: null, name: 'Worker', runtimeName: 'Worker [1]' }
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
  uid: 1,
  width: 100,
  workers: [worker],
  x: 0,
  y: 0,
}

test('takes a snapshot of the selected worker and opens the returned URI', async () => {
  const takeSnapshot = jest.fn<(...args: readonly unknown[]) => Promise<string>>(async () => 'file:///worker.heapsnapshot')
  const getWindowId = jest.fn<(...args: readonly unknown[]) => Promise<number>>(async () => 7)
  const openUri = jest.fn<(...args: readonly unknown[]) => Promise<void>>(async () => {})
  MainProcess.registerMockRpc({ 'ElectronDeveloper.takeWorkerHeapSnapshot': takeSnapshot })
  RendererWorker.registerMockRpc({ 'GetWindowId.getWindowId': getWindowId, 'Main.openUri': openUri })
  await takeHeapSnapshot(state, worker.id)
  expect(takeSnapshot).toHaveBeenCalledWith(7, worker.runtimeName)
  expect(openUri).toHaveBeenCalledWith('file:///worker.heapsnapshot')
})

const unsupportedState: WorkersState = { ...state, platform: PlatformType.Web }
const staleState: WorkersState = { ...state, workers: [] }

test.each<[string, Readonly<WorkersState>, string]>([
  ['stale worker', staleState, worker.id],
  ['unsupported platform', unsupportedState, worker.id],
])('does not start a snapshot for a %s', async (_name, currentState, workerId) => {
  await expect(takeHeapSnapshot(currentState, workerId)).resolves.toBe(currentState)
})
