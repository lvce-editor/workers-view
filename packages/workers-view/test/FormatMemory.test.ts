import { expect, test } from '@jest/globals'
import { formatMemory } from '../src/parts/FormatMemory/FormatMemory.ts'

test('formats byte counts with binary units and existing precision', () => {
  expect(formatMemory(0)).toBe('0 B')
  expect(formatMemory(1.5)).toBe('2 B')
  expect(formatMemory(1023)).toBe('1023 B')
  expect(formatMemory(1024)).toBe('1.0 KiB')
  expect(formatMemory(1536)).toBe('1.5 KiB')
  expect(formatMemory(2047)).toBe('1.9 KiB')
  expect(formatMemory(1024 * 1024)).toBe('1.0 MiB')
  expect(formatMemory(1024 ** 3)).toBe('1.0 GiB')
})

test('marks invalid measurements unavailable', () => {
  expect(formatMemory(NaN)).toBe('Unavailable')
  expect(formatMemory(Infinity)).toBe('Unavailable')
  expect(formatMemory(-1)).toBe('Unavailable')
})
