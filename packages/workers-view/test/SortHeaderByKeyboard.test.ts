import { expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import type { WorkersState } from '../src/parts/WorkersState/WorkersState.ts'
import { sortHeaderByKeyboard } from '../src/parts/SortHeaderByKeyboard/SortHeaderByKeyboard.ts'

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
  workers: [
    { id: 'one', memory: 1, name: 'Zulu', runtimeName: 'Zulu' },
    { id: 'two', memory: 2, name: 'Alpha', runtimeName: 'Alpha' },
  ],
  x: 100,
  y: 200,
} satisfies WorkersState

test('sorts an activated header from Enter and Space', () => {
  expect(sortHeaderByKeyboard(state, 'Enter', 'cpu')).toMatchObject({ sortColumn: 'cpu', sortDirection: 'descending' })
  expect(sortHeaderByKeyboard(state, 'Enter', 'name')).toMatchObject({ sortColumn: 'name', sortDirection: 'ascending' })
  expect(sortHeaderByKeyboard(state, ' ', 'memory')).toMatchObject({ sortColumn: 'memory', sortDirection: 'descending' })
})

test('ignores unsupported keys and columns', () => {
  expect(sortHeaderByKeyboard(state, 'ArrowDown', 'name')).toBe(state)
  expect(sortHeaderByKeyboard(state, 'Enter', 'worker')).toBe(state)
  const webState = { ...state, platform: PlatformType.Web }
  expect(sortHeaderByKeyboard(webState, 'Enter', 'memory')).toBe(webState)
})
