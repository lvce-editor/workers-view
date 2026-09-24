import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import type { RefreshServices } from '../src/parts/Refresh/Refresh.ts'
import { refresh } from '../src/parts/Refresh/Refresh.ts'

const getWorkers = jest.fn<RefreshServices['getWorkers']>()
const getMemoryUsage = jest.fn<RefreshServices['getMemoryUsage']>()
const services: RefreshServices = { getMemoryUsage, getWorkers }
const state = { height: 100, loaded: false, platform: PlatformType.Web, uid: 7, width: 200, workers: [] }
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
  expect(getMemoryUsage).not.toHaveBeenCalled()
})

test('attributes heap measurements to each registered worker in Electron', async () => {
  getWorkers.mockResolvedValue([worker, { ...worker, id: 'worker-2', runtimeName: 'Editor Worker [worker-2]' }])
  getMemoryUsage.mockResolvedValueOnce({ usedSize: 4096 }).mockResolvedValueOnce(null)

  const result = await refresh({ ...state, platform: PlatformType.Electron }, services)

  expect(getMemoryUsage).toHaveBeenNthCalledWith(1, worker.runtimeName)
  expect(result.workers.map(({ memory }) => memory)).toEqual([4096, null])
})

test('keeps unavailable measurements distinct from zero when measurement fails', async () => {
  getMemoryUsage.mockRejectedValue(new Error('Worker disappeared'))

  const result = await refresh({ ...state, platform: PlatformType.Electron }, services)

  expect(result.workers[0].memory).toBeNull()
})

test('rejects invalid heap sizes as unavailable', async () => {
  getMemoryUsage.mockResolvedValue({ usedSize: NaN })

  const result = await refresh({ ...state, platform: PlatformType.Electron }, services)

  expect(result.workers[0].memory).toBeNull()
})
