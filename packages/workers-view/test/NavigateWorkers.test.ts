import { expect, test } from '@jest/globals'
import type { WorkersState } from '../src/parts/WorkersState/WorkersState.ts'
import * as NavigateWorkers from '../src/parts/NavigateWorkers/NavigateWorkers.ts'

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
  expect(NavigateWorkers.navigateWorkers(state, 'ArrowDown').selectedWorkerId).toBe('one')
  expect(NavigateWorkers.navigateWorkers(state, 'ArrowUp').selectedWorkerId).toBe('two')
  expect(NavigateWorkers.navigateWorkers({ ...state, selectedWorkerId: 'one' }, 'ArrowDown').selectedWorkerId).toBe('two')
  expect(NavigateWorkers.navigateWorkers(state, 'Home').selectedWorkerId).toBe('one')
  expect(NavigateWorkers.navigateWorkers(state, 'End').selectedWorkerId).toBe('two')
})

test('uses horizontal arrow keys to expand, collapse and move through the worker tree', () => {
  const treeState: WorkersState = {
    ...state,
    selectedWorkerId: 'extension-management',
    workers: [
      { id: 'renderer', memory: 1, name: 'Renderer Worker', runtimeName: 'Renderer Worker' },
      {
        id: 'extension-management',
        memory: 2,
        name: 'Extension Management Worker',
        parentId: 'renderer',
        runtimeName: 'Extension Management Worker',
      },
      { id: 'eslint', memory: 3, name: 'ESLint Worker', parentId: 'extension-management', runtimeName: 'ESLint Worker' },
    ],
  }
  expect(NavigateWorkers.focusChildOrExpand(treeState).selectedWorkerId).toBe('eslint')
  expect(NavigateWorkers.navigateWorkers({ ...treeState, collapsedWorkerIds: ['extension-management'] }, 'ArrowRight').collapsedWorkerIds).toEqual([])
  expect(NavigateWorkers.navigateWorkers({ ...treeState, selectedWorkerId: 'eslint' }, 'ArrowLeft').selectedWorkerId).toBe('extension-management')
  expect(NavigateWorkers.focusParentOrCollapse(treeState)).toMatchObject({
    collapsedWorkerIds: ['extension-management'],
    selectedWorkerId: 'extension-management',
  })
  expect(NavigateWorkers.navigateWorkers({ ...treeState, collapsedWorkerIds: ['extension-management'] }, 'ArrowLeft').selectedWorkerId).toBe(
    'renderer',
  )
  expect(NavigateWorkers.navigateWorkers({ ...treeState, selectedWorkerId: 'eslint' }, 'ArrowRight').selectedWorkerId).toBe('eslint')
  expect(
    NavigateWorkers.navigateWorkers({ ...treeState, collapsedWorkerIds: ['renderer'], selectedWorkerId: 'renderer' }, 'ArrowLeft').selectedWorkerId,
  ).toBe('renderer')
})
