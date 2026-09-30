import { expect, test } from '@jest/globals'
import { setError } from '../src/parts/SetError/SetError.ts'

const state = {
  domRendered: false,
  error: undefined,
  hasFocus: false,
  height: 100,
  loaded: false,
  platform: 0,
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

test('preserves the message from an Error instance', () => {
  const result = setError(state, new Error('Injected workers error'))
  expect(result.error?.message).toBe('Injected workers error')
})

test('preserves an error message transported as a plain object', () => {
  const result = setError(state, { message: 'Injected workers error' })
  expect(result.error?.message).toBe('Injected workers error')
})

test('converts values without an error message into an Error', () => {
  expect(setError(state, null).error?.message).toBe('null')
  expect(setError(state, 'failed').error?.message).toBe('failed')
  expect(setError(state, {}).error?.message).toBe('[object Object]')
  expect(setError(state, { message: 1 }).error?.message).toBe('[object Object]')
})
