import { expect, test } from '@jest/globals'
import { focusWorkers } from '../src/parts/FocusWorkers/FocusWorkers.ts'
import { focusFirst, focusLast, focusNext, focusPrevious, navigateWorkers } from '../src/parts/NavigateWorkers/NavigateWorkers.ts'
import { selectWorker } from '../src/parts/SelectWorker/SelectWorker.ts'
import { showWorkerContextMenu } from '../src/parts/ShowWorkerContextMenu/ShowWorkerContextMenu.ts'

const worker = (id: string): { id: string; memory: null; name: string; runtimeName: string } => ({ id, memory: null, name: id, runtimeName: id })
const state = {
  domRendered: false,
  error: undefined,
  hasFocus: false,
  height: 100,
  loaded: true,
  platform: 1,
  scrollTop: 0,
  selectedWorkerId: undefined,
  sortColumn: undefined,
  sortDirection: undefined,
  uid: 1,
  width: 100,
  workers: [worker('one'), worker('two'), worker('three')],
  x: 0,
  y: 0,
}

test('selects a visible worker and ignores an unknown id', () => {
  expect(selectWorker(state, 'two')).toMatchObject({ hasFocus: true, selectedWorkerId: 'two' })
  expect(selectWorker(state, 'missing')).toBe(state)
})

test('restores focused selection styling when the list receives focus', () => {
  expect(focusWorkers({ ...state, hasFocus: false, selectedWorkerId: 'two' })).toMatchObject({ hasFocus: true, selectedWorkerId: 'two' })
})

test.each([
  ['ArrowDown', undefined, 'one'],
  ['ArrowDown', 'one', 'two'],
  ['ArrowDown', 'three', 'three'],
  ['ArrowUp', undefined, 'three'],
  ['ArrowUp', 'three', 'two'],
  ['ArrowUp', 'one', 'one'],
  ['Home', 'two', 'one'],
  ['End', 'two', 'three'],
])('navigates %s from %s to %s', (key, selectedWorkerId, expectedId) => {
  expect(navigateWorkers({ ...state, selectedWorkerId }, key)).toMatchObject({
    hasFocus: true,
    selectedWorkerId: expectedId,
  })
})

test('dispatches declarative navigation commands to the existing selection behavior', () => {
  expect(focusNext(state).selectedWorkerId).toBe('one')
  expect(focusPrevious({ ...state, selectedWorkerId: 'two' }).selectedWorkerId).toBe('one')
  expect(focusFirst({ ...state, selectedWorkerId: 'two' }).selectedWorkerId).toBe('one')
  expect(focusLast({ ...state, selectedWorkerId: 'two' }).selectedWorkerId).toBe('three')
})

test('ignores unsupported keys and leaves an empty list unchanged', () => {
  expect(navigateWorkers(state, 'Enter')).toBe(state)
  const empty = { ...state, workers: [] }
  expect(navigateWorkers(empty, 'ArrowDown')).toBe(empty)
})

test('ignores a stale row when opening its context menu', async () => {
  await expect(showWorkerContextMenu(state, 'missing', 10, 20)).resolves.toBe(state)
})
