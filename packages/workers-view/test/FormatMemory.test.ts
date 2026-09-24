import { expect, test } from '@jest/globals'
import { formatMemory } from '../src/parts/FormatMemory/FormatMemory.ts'

test('formats JavaScript heap byte counts with explicit binary units', () => {
  expect(formatMemory(0)).toBe('0 B')
  expect(formatMemory(1024)).toBe('1.0 KiB')
  expect(formatMemory(1024 * 1024)).toBe('1.0 MiB')
})

test('marks invalid measurements unavailable', () => {
  expect(formatMemory(NaN)).toBe('Unavailable')
  expect(formatMemory(-1)).toBe('Unavailable')
})
