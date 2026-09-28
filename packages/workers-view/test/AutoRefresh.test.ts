import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import * as AutoRefresh from '../src/parts/AutoRefresh/AutoRefresh.ts'

const update = jest.fn<(...args: readonly unknown[]) => Promise<void>>()

beforeEach(() => {
  jest.useFakeTimers()
  update.mockReset().mockResolvedValue(undefined)
  RendererWorker.registerMockRpc({ 'Viewlet.executeViewletCommand': update })
})

afterEach(() => {
  AutoRefresh.dispose(1)
  AutoRefresh.dispose(2)
  jest.useRealTimers()
  jest.restoreAllMocks()
})

test('starts only one interval per view and stops it on disposal', async () => {
  AutoRefresh.start(1)
  AutoRefresh.start(1)
  await jest.advanceTimersByTimeAsync(999)
  expect(update).not.toHaveBeenCalled()
  await jest.advanceTimersByTimeAsync(1)
  expect(update).toHaveBeenCalledTimes(1)
  expect(update).toHaveBeenCalledWith(1, 'autoRefresh')
  AutoRefresh.dispose(1)
  AutoRefresh.dispose(1)
  await jest.advanceTimersByTimeAsync(2000)
  expect(update).toHaveBeenCalledTimes(1)
  expect(jest.getTimerCount()).toBe(0)
})

test('skips overlapping updates while allowing other views to refresh', async () => {
  let resolveUpdate!: () => void
  update.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        resolveUpdate = resolve
      }),
  )
  AutoRefresh.start(1)
  await jest.advanceTimersByTimeAsync(1000)
  AutoRefresh.start(2)
  await jest.advanceTimersByTimeAsync(2000)
  expect(update.mock.calls).toEqual([
    [1, 'autoRefresh'],
    [2, 'autoRefresh'],
    [2, 'autoRefresh'],
  ])
  resolveUpdate()
  await jest.advanceTimersByTimeAsync(1000)
  expect(update.mock.calls.slice(-2)).toEqual([
    [1, 'autoRefresh'],
    [2, 'autoRefresh'],
  ])
})

test('reports a rejected update and allows the next tick to retry', async () => {
  const error = new Error('renderer unavailable')
  const log = jest.spyOn(console, 'error').mockImplementation(() => {})
  update.mockRejectedValueOnce(error)
  AutoRefresh.start(1)
  await jest.advanceTimersByTimeAsync(2000)
  expect(log).toHaveBeenCalledTimes(1)
  expect(log).toHaveBeenCalledWith(error)
  expect(update).toHaveBeenCalledTimes(2)
})
