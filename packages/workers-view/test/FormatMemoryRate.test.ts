import { expect, test } from '@jest/globals'
import { formatMemoryRate } from '../src/parts/FormatMemoryRate/FormatMemoryRate.ts'

test('formats rates in readable decimal units', () => {
  expect(formatMemoryRate(0)).toBe('0 B/s')
  expect(formatMemoryRate(999)).toBe('999 B/s')
  expect(formatMemoryRate(2100)).toBe('2.1 kB/s')
  expect(formatMemoryRate(1_250_000)).toBe('1.3 MB/s')
})

test('marks invalid rates unavailable', () => {
  expect(formatMemoryRate(NaN)).toBe('Unavailable')
})
