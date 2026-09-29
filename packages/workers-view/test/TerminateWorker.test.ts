import { beforeEach, expect, jest, test } from '@jest/globals'
import { createMockRpc } from '@lvce-editor/rpc'
import { RendererProcess } from '@lvce-editor/rpc-registry'
import { terminateWorker } from '../src/parts/TerminateWorker/TerminateWorker.ts'

const worker = { id: 'worker-1', memory: null, name: 'Worker', runtimeName: 'Worker' }
const state = {
  contextMenuWorkerId: 'worker-1',
  error: undefined,
  height: 100,
  loaded: true,
  platform: 1,
  selectedWorkerId: 'worker-1',
  sortColumn: undefined,
  sortDirection: undefined,
  uid: 1,
  width: 100,
  workers: [worker],
}

const terminate = jest.fn()
const getWorkers = jest.fn(() => [])

beforeEach(() => {
  jest.clearAllMocks()
  RendererProcess.set(createMockRpc({ commandMap: { 'Workers.getWorkers': getWorkers, 'Workers.terminate': terminate } }))
})

test('terminates the exact worker id and refreshes the list', async () => {
  const result = await terminateWorker(state, worker.id)
  expect(terminate).toHaveBeenCalledWith(worker.id)
  expect(getWorkers).toHaveBeenCalled()
  expect(result).toMatchObject({ contextMenuWorkerId: undefined, selectedWorkerId: undefined, workers: [] })
})

test('ignores a stale worker id without invoking the registry', async () => {
  const result = await terminateWorker(state, 'missing')
  expect(terminate).not.toHaveBeenCalled()
  expect(result.contextMenuWorkerId).toBeUndefined()
})
