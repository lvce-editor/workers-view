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
  error: undefined,
  height: 200,
  loaded: true,
  platform: PlatformType.Electron,
  scrollTop: 0,
  sortColumn: undefined,
  sortDirection: undefined,
  uid: 1,
  width: 400,
  workers,
  x: 100,
  y: 200,
}

const click = (target: WorkersState, clientX: number, clientY: number): WorkersState => handleTableClick(target, clientX, clientY, target.width)

test('uses the layout origin and platform column count for pointer sorting', () => {
  expect(click(state, 150, 250)).toMatchObject({ sortColumn: 'name', sortDirection: 'ascending' })
  expect(click(state, 350, 250)).toMatchObject({ sortColumn: 'memory', sortDirection: 'descending' })
  expect(click({ ...state, platform: PlatformType.Web }, 450, 250)).toMatchObject({ sortColumn: 'name' })
  expect(click(state, 99, 250)).toBe(state)
  expect(click(state, 500, 250)).toBe(state)
  expect(handleTableClick(state, 490, 250, 380)).toBe(state)
})

test('selects the displayed row after title, error and scrolling offsets', () => {
  expect(click(state, 150, 280)).toMatchObject({ selectedWorkerId: 'one' })
  expect(click(state, 150, 302)).toMatchObject({ selectedWorkerId: 'two' })
  const withError = { ...state, error: new Error('unavailable') }
  expect(click(withError, 150, 310)).toMatchObject({ selectedWorkerId: 'one' })
  const scrolled = { ...state, scrollTop: 22 }
  expect(click(scrolled, 150, 272)).toMatchObject({ selectedWorkerId: 'two' })
  expect(click(scrolled, 150, 250)).toMatchObject({ sortColumn: 'name' })
})

test('ignores clicks outside the table rows and header', () => {
  expect(click(state, 150, 240)).toBe(state)
  expect(click(state, 150, 400)).toBe(state)
  expect(click({ ...state, workers: [] }, 150, 280)).toMatchObject({ sortColumn: undefined })
})

test('tracks scroll position', () => {
  expect(scrollWorkers(state, 0)).toBe(state)
  expect(scrollWorkers(state, 22)).toMatchObject({ scrollTop: 22 })
  expect(scrollWorkers(state, -1)).toBe(state)
  expect(scrollWorkers(state, NaN)).toBe(state)
})
