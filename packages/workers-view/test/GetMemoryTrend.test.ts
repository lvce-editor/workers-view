import { expect, test } from '@jest/globals'
import type { MemorySample } from '../src/parts/WorkersState/WorkersState.ts'
import { getMemoryTrend } from '../src/parts/GetMemoryTrend/GetMemoryTrend.ts'

test('reports growth in bytes per second', () => {
  expect(
    getMemoryTrend([
      { id: 'worker-1', memory: 1000, timestamp: 0 },
      { id: 'worker-1', memory: 1400, timestamp: 20_000 },
    ]),
  ).toEqual({ bytesPerSecond: 20, direction: 'growing' })
})

test('reports shrinkage in bytes per second', () => {
  expect(
    getMemoryTrend([
      { id: 'worker-1', memory: 1400, timestamp: 0 },
      { id: 'worker-1', memory: 900, timestamp: 10_000 },
    ]),
  ).toEqual({ bytesPerSecond: 50, direction: 'shrinking' })
})

test('omits trends for a single sample, unchanged usage, or invalid elapsed time', () => {
  expect(getMemoryTrend([{ id: 'worker-1', memory: 1000, timestamp: 0 }])).toBeUndefined()
  expect(
    getMemoryTrend([
      { id: 'worker-1', memory: 1000, timestamp: 0 },
      { id: 'worker-1', memory: 1000, timestamp: 1000 },
    ]),
  ).toBeUndefined()
  expect(
    getMemoryTrend([
      { id: 'worker-1', memory: 1000, timestamp: 1000 },
      { id: 'worker-1', memory: 2000, timestamp: 1000 },
    ]),
  ).toBeUndefined()
})

test('ignores incomplete sample arrays', () => {
  const samples: MemorySample[] = []
  samples.length = 2
  samples[1] = { id: 'worker-1', memory: 2000, timestamp: 1000 }
  expect(getMemoryTrend(samples)).toBeUndefined()
})
