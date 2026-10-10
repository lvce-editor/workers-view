import { expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import type { WorkersState } from '../src/parts/WorkersState/WorkersState.ts'
import { handleTableClick } from '../src/parts/HandleTableClick/HandleTableClick.ts'
import { scrollWorkers } from '../src/parts/ScrollWorkers/ScrollWorkers.ts'

const workers = [
  { id: 'one', memory: 1, name: 'Zulu', runtimeName: 'Zulu' },
  { id: 'two', memory: 2, name: 'Alpha', runtimeName: 'Alpha' },
  { id: 'three', memory: 3, name: 'Mike', runtimeName: 'Mike' },
]

const state = {
  domRendered: false,
  error: undefined,
  hasFocus: false,
  height: 200,
  loaded: true,
  platform: PlatformType.Electron,
  scrollTop: 0,
  selectedWorkerId: undefined,
  sortColumn: undefined,
  sortDirection: undefined,
  uid: 1,
  width: 400,
  workers,
  x: 100,
  y: 200,
}

const click = (target: WorkersState, clientX: number, clientY: number): WorkersState => handleTableClick(target, clientX, clientY, target.width)

test('sorts the visible columns and maps the former CPU region to heap sorting', () => {
  expect(click(state, 150, 210)).toMatchObject({ sortColumn: 'name', sortDirection: 'ascending' })
  expect(click(state, 350, 210)).toMatchObject({ sortColumn: 'memory', sortDirection: 'descending' })
  expect(click(state, 450, 210)).toMatchObject({ sortColumn: 'memory', sortDirection: 'descending' })
  expect(click({ ...state, platform: PlatformType.Web }, 450, 210)).toMatchObject({ sortColumn: 'name' })
  expect(click(state, 99, 210)).toBe(state)
  expect(click(state, 500, 210)).toBe(state)
  expect(handleTableClick(state, 490, 210, 380)).toBe(state)
})

test('selects the displayed row after error and scrolling offsets', () => {
  expect(click(state, 150, 230)).toMatchObject({ selectedWorkerId: 'one' })
  expect(click(state, 150, 252)).toMatchObject({ selectedWorkerId: 'two' })
  const withError = { ...state, error: new Error('unavailable') }
  expect(click(withError, 150, 260)).toMatchObject({ selectedWorkerId: 'one' })
  const scrolled = { ...state, scrollTop: 22 }
  expect(click(scrolled, 150, 225)).toMatchObject({ selectedWorkerId: 'two' })
  expect(click(scrolled, 150, 210)).toMatchObject({ sortColumn: 'name' })
})

test('ignores clicks outside the table rows and header', () => {
  expect(click(state, 150, 199)).toBe(state)
  expect(click(state, 150, 400)).toBe(state)
  expect(click({ ...state, workers: [] }, 150, 230)).toMatchObject({ sortColumn: undefined })
})

test('tracks scroll position', () => {
  expect(scrollWorkers(state, 0)).toBe(state)
  expect(scrollWorkers(state, 22)).toMatchObject({ scrollTop: 22 })
  expect(scrollWorkers(state, -1)).toBe(state)
  expect(scrollWorkers(state, NaN)).toBe(state)
})
