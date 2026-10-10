import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import type { RefreshServices } from '../src/parts/Refresh/Refresh.ts'
import { refresh } from '../src/parts/Refresh/Refresh.ts'

const getWorkers = jest.fn<RefreshServices['getWorkers']>()
const getMemoryUsages = jest.fn<RefreshServices['getMemoryUsages']>()
const getShowMemoryUsageTrend = jest.fn<NonNullable<RefreshServices['getShowMemoryUsageTrend']>>()
const now = jest.fn(() => 60_000)
const services: RefreshServices = { getMemoryUsages, getShowMemoryUsageTrend, getWorkers, now }
const state = {
  domRendered: false,
  error: undefined,
  hasFocus: false,
  height: 100,
  loaded: false,
  memorySamples: [],
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
  getShowMemoryUsageTrend.mockResolvedValue(false)
})

afterEach(() => {
  jest.restoreAllMocks()
})

test('returns names without requesting measurements on web', async () => {
  const result = await refresh(state, services)
  expect(result.workers).toEqual([{ ...worker, cpu: null, memory: null }])
  expect(getMemoryUsages).not.toHaveBeenCalled()
})

test('keeps current workers without CPU data when listing fails', async () => {
  getWorkers.mockRejectedValue(new Error('worker list unavailable'))
  const result = await refresh({ ...state, workers: [{ ...worker, cpu: 5, memory: 12 }] }, services)
  expect(result.error?.message).toBe('worker list unavailable')
  expect(result.workers).toEqual([{ ...worker, cpu: null, memory: 12 }])
})

test('attributes heap measurements to each registered worker in Electron', async () => {
  getWorkers.mockResolvedValue([worker, { ...worker, id: 'worker-2', runtimeName: 'Editor Worker [worker-2]' }])
  getMemoryUsages.mockResolvedValueOnce({ [worker.runtimeName]: { usedSize: 4096 } })

  const result = await refresh({ ...state, platform: PlatformType.Electron }, services)

  expect(getMemoryUsages).toHaveBeenCalledTimes(1)
  expect(result.workers.map(({ memory }) => memory)).toEqual([4096, null])
})

test('calculates worker memory trends across irregular refresh intervals', async () => {
  getMemoryUsages.mockResolvedValue({ [worker.runtimeName]: { usedSize: 1200 } })
  getShowMemoryUsageTrend.mockResolvedValue(true)
  now.mockReturnValue(60_000)

  const result = await refresh(
    { ...state, memorySamples: [{ id: worker.id, memory: 1000, timestamp: 10_000 }], platform: PlatformType.Electron },
    { ...services, now },
  )

  expect(result.workers[0].memoryTrend).toEqual({ bytesPerSecond: 4, direction: 'growing' })
  expect(result.memorySamples).toEqual([
    { id: worker.id, memory: 1000, timestamp: 10_000 },
    { id: worker.id, memory: 1200, timestamp: 60_000 },
  ])
})

test('keeps the memory trend history bounded after reaching its sample limit', async () => {
  getMemoryUsages.mockResolvedValue({ [worker.runtimeName]: { usedSize: 1200 } })
  getShowMemoryUsageTrend.mockResolvedValue(true)
  now.mockReturnValue(60_000)
  const memorySamples = Array.from({ length: 61 }, (_, index) => ({ id: worker.id, memory: 1000 + index, timestamp: 59_000 }))
  const result = await refresh({ ...state, memorySamples, platform: PlatformType.Electron }, services)
  expect(result.memorySamples).toHaveLength(61)
  expect(result.memorySamples?.[0]).toEqual(memorySamples[1])
})

test('drops trend samples when the setting is disabled, measurements are unavailable, or workers disappear', async () => {
  const withSample = { ...state, memorySamples: [{ id: worker.id, memory: 1000, timestamp: 59_000 }], platform: PlatformType.Electron }
  getShowMemoryUsageTrend.mockResolvedValue(false)
  const disabled = await refresh(withSample, services)
  expect(disabled.memorySamples).toEqual([])

  getShowMemoryUsageTrend.mockResolvedValue(true)
  getMemoryUsages.mockRejectedValue(new Error('measurement unavailable'))
  const unavailable = await refresh(withSample, services)
  expect(unavailable.memorySamples).toEqual([])

  getMemoryUsages.mockResolvedValue({ [worker.runtimeName]: { usedSize: 1100 } })
  getWorkers.mockResolvedValue([])
  const removedWorker = await refresh(withSample, services)
  expect(removedWorker.memorySamples).toEqual([])
})

test('discards samples outside the one-minute window and avoids zero-time rates', async () => {
  getMemoryUsages.mockResolvedValue({ [worker.runtimeName]: { usedSize: 1100 } })
  getShowMemoryUsageTrend.mockResolvedValue(true)
  now.mockReturnValue(60_000)

  const expired = await refresh(
    { ...state, memorySamples: [{ id: worker.id, memory: 1000, timestamp: -1 }], platform: PlatformType.Electron },
    services,
  )
  expect(expired.workers[0].memoryTrend).toBeUndefined()
  expect(expired.memorySamples).toEqual([{ id: worker.id, memory: 1100, timestamp: 60_000 }])

  const sameTime = await refresh(
    { ...state, memorySamples: [{ id: worker.id, memory: 1000, timestamp: 60_000 }], platform: PlatformType.Electron },
    services,
  )
  expect(sameTime.workers[0].memoryTrend).toBeUndefined()
  expect(sameTime.memorySamples).toEqual([{ id: worker.id, memory: 1100, timestamp: 60_000 }])
})

test('keeps memory trends disabled outside Electron and resets history when a worker is removed and recreated', async () => {
  const sample = { id: worker.id, memory: 1000, timestamp: 59_000 }
  const previousState = { ...state, memorySamples: [sample], platform: PlatformType.Web }
  const webResult = await refresh(previousState, services)
  expect(webResult.memorySamples).toEqual([])
  expect(getShowMemoryUsageTrend).not.toHaveBeenCalled()

  getShowMemoryUsageTrend.mockResolvedValue(true)
  getMemoryUsages.mockResolvedValue({ [worker.runtimeName]: { usedSize: 1100 } })
  getWorkers.mockResolvedValue([])
  const removed = await refresh({ ...state, memorySamples: [sample], platform: PlatformType.Electron }, services)
  expect(removed.memorySamples).toEqual([])

  getWorkers.mockResolvedValue([worker])
  const recreated = await refresh(removed, services)
  expect(recreated.workers[0].memoryTrend).toBeUndefined()
  expect(recreated.memorySamples).toEqual([{ id: worker.id, memory: 1100, timestamp: 60_000 }])
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

test('updates CPU usage independently and clears stale values after a failed measurement', async () => {
  getMemoryUsages.mockResolvedValueOnce({ [worker.runtimeName]: { cpu: 68.5, usedSize: 4096 } })
  const first = await refresh({ ...state, platform: PlatformType.Electron }, services)
  expect(first.workers[0].cpu).toBe(68.5)
  getMemoryUsages.mockRejectedValueOnce(new Error('Debugger disconnected'))
  const second = await refresh(first, services)
  expect(second.workers[0].cpu).toBeNull()
})
