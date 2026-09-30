import { expect, test } from '@jest/globals'
import type { WorkersState } from '../src/parts/WorkersState/WorkersState.ts'
import { navigateWorkers } from '../src/parts/NavigateWorkers/NavigateWorkers.ts'

const state = {
  domRendered: false,
  error: undefined,
  hasFocus: false,
  height: 200,
  loaded: true,
  platform: 2,
  scrollTop: 0,
  selectedWorkerId: undefined,
  sortColumn: undefined,
  sortDirection: undefined,
  uid: 1,
  width: 400,
  workers: [
    { id: 'one', memory: 1, name: 'Zulu', runtimeName: 'Zulu' },
    { id: 'two', memory: 2, name: 'Alpha', runtimeName: 'Alpha' },
  ],
  x: 100,
  y: 200,
} satisfies WorkersState

test('keeps row navigation behavior for arrow and boundary keys', () => {
  expect(navigateWorkers(state, 'ArrowDown').selectedWorkerId).toBe('one')
  expect(navigateWorkers(state, 'ArrowUp').selectedWorkerId).toBe('two')
  expect(navigateWorkers({ ...state, selectedWorkerId: 'one' }, 'ArrowDown').selectedWorkerId).toBe('two')
  expect(navigateWorkers(state, 'Home').selectedWorkerId).toBe('one')
  expect(navigateWorkers(state, 'End').selectedWorkerId).toBe('two')
})
