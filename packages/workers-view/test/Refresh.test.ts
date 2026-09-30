import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import type { RefreshServices } from '../src/parts/Refresh/Refresh.ts'
import { refresh } from '../src/parts/Refresh/Refresh.ts'

const getWorkers = jest.fn<RefreshServices['getWorkers']>()
const getMemoryUsages = jest.fn<RefreshServices['getMemoryUsages']>()
const services: RefreshServices = { getMemoryUsages, getWorkers }
const state = {
  domRendered: false,
  error: undefined,
  hasFocus: false,
  height: 100,
  loaded: false,
  platform: PlatformType.Web,
  scrollTop: 0,
  selectedWorkerId: undefined,
  sortColumn: undefined,
  sortDirection: undefined,
  uid: 7,
  width: 200,
  workers: [],
  x: 0,
  y: 0,
}
const worker = { id: 'worker-1', name: 'Editor Worker', runtimeName: 'Editor Worker [worker-1]' }

beforeEach(() => {
  jest.clearAllMocks()
  getWorkers.mockResolvedValue([worker])
})

afterEach(() => {
  jest.restoreAllMocks()
})

test('returns names without requesting measurements on web', async () => {
  const result = await refresh(state, services)
  expect(result.workers).toEqual([{ ...worker, memory: null }])
  expect(getMemoryUsages).not.toHaveBeenCalled()
})

test('attributes heap measurements to each registered worker in Electron', async () => {
  getWorkers.mockResolvedValue([worker, { ...worker, id: 'worker-2', runtimeName: 'Editor Worker [worker-2]' }])
  getMemoryUsages.mockResolvedValueOnce({ [worker.runtimeName]: { usedSize: 4096 } })

  const result = await refresh({ ...state, platform: PlatformType.Electron }, services)

  expect(getMemoryUsages).toHaveBeenCalledTimes(1)
  expect(result.workers.map(({ memory }) => memory)).toEqual([4096, null])
})

test('keeps unavailable measurements distinct from zero when measurement fails', async () => {
  getMemoryUsages.mockRejectedValue(new Error('Worker disappeared'))

  const result = await refresh({ ...state, platform: PlatformType.Electron }, services)

  expect(result.workers[0].memory).toBeNull()
})

test('rejects invalid heap sizes as unavailable', async () => {
  getMemoryUsages.mockResolvedValue({ [worker.runtimeName]: { usedSize: NaN } })

  const result = await refresh({ ...state, platform: PlatformType.Electron }, services)

  expect(result.workers[0].memory).toBeNull()
})

test('records worker-list failures as an error state', async () => {
  getWorkers.mockRejectedValue(new Error('Workers unavailable'))

  const result = await refresh(state, services)

  expect(result.error?.message).toBe('Workers unavailable')
  expect(result.loaded).toBe(true)
})

test('preserves a worker-list rejection message transported as an object', async () => {
  getWorkers.mockRejectedValue({ message: 'Workers unavailable' })

  const result = await refresh(state, services)

  expect(result.error?.message).toBe('Workers unavailable')
})

test('clears an old error after a successful refresh', async () => {
  const result = await refresh({ ...state, error: new Error('Workers unavailable') }, services)

  expect(result.error).toBeUndefined()
  expect(result.workers).toHaveLength(1)
})
