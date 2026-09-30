import { expect, test } from '@jest/globals'
import type { DisplayedWorker, WorkersState } from '../src/parts/WorkersState/WorkersState.ts'
import * as SortWorkers from '../src/parts/SortWorkers/SortWorkers.ts'
import * as ToggleSort from '../src/parts/SortWorkers/ToggleSort.ts'

const workers: readonly DisplayedWorker[] = [
  { id: 'large', memory: 1024 * 1024, name: 'Zulu', runtimeName: 'Zulu' },
  { id: 'small', memory: 1024, name: 'Alpha', runtimeName: 'Alpha' },
  { id: 'missing', memory: null, name: 'Beta', runtimeName: 'Beta' },
  { id: 'medium', memory: 64 * 1024, name: 'Gamma', runtimeName: 'Gamma' },
]

const state: WorkersState = {
  contextMenuWorkerId: undefined,
  domRendered: false,
  error: undefined,
  hasFocus: false,
  height: 100,
  loaded: true,
  platform: 1,
  selectedWorkerId: undefined,
  sortColumn: undefined,
  sortDirection: undefined,
  uid: 1,
  width: 200,
  workers,
}

test('sorts memory by raw bytes, keeps unavailable values last and uses name for ties', () => {
  expect(SortWorkers.sortWorkers(workers, 'memory', 'descending').map((worker) => worker.id)).toEqual(['large', 'medium', 'small', 'missing'])
  expect(SortWorkers.sortWorkers(workers, 'memory', 'ascending').map((worker) => worker.id)).toEqual(['small', 'medium', 'large', 'missing'])
})

test('sorts names both ways without mutating the original list', () => {
  expect(SortWorkers.sortWorkers(workers, 'name', 'ascending').map((worker) => worker.name)).toEqual(['Alpha', 'Beta', 'Gamma', 'Zulu'])
  expect(SortWorkers.sortWorkers(workers, 'name', 'descending').map((worker) => worker.name)).toEqual(['Zulu', 'Gamma', 'Beta', 'Alpha'])
  expect(workers.map((worker) => worker.id)).toEqual(['large', 'small', 'missing', 'medium'])
})

test('keeps original order when no sort is selected and resolves equal values consistently', () => {
  expect(SortWorkers.sortWorkers(workers, undefined, undefined)).toBe(workers)
  const equalValues: readonly DisplayedWorker[] = [
    { id: 'b', memory: 1024, name: 'Same', runtimeName: 'Same B' },
    { id: 'a', memory: 1024, name: 'Same', runtimeName: 'Same A' },
    { id: 'missing-b', memory: null, name: 'Unavailable', runtimeName: 'Unavailable B' },
    { id: 'missing-a', memory: null, name: 'Unavailable', runtimeName: 'Unavailable A' },
    { id: 'same', memory: 2048, name: 'Duplicate', runtimeName: 'Duplicate' },
    { id: 'same', memory: 2048, name: 'Duplicate', runtimeName: 'Duplicate' },
  ]
  expect(SortWorkers.sortWorkers(equalValues, 'memory', 'ascending').map((worker) => worker.id)).toEqual([
    'a',
    'b',
    'same',
    'same',
    'missing-a',
    'missing-b',
  ])
  expect(SortWorkers.sortWorkers(equalValues, 'name', 'ascending').map((worker) => worker.id)).toEqual([
    'same',
    'same',
    'a',
    'b',
    'missing-a',
    'missing-b',
  ])
})

test('selects the default direction for each column then toggles it', () => {
  const byMemory = ToggleSort.toggleSort(state, 'memory')
  expect(byMemory.sortDirection).toBe('descending')
  expect(ToggleSort.toggleSort(byMemory, 'memory').sortDirection).toBe('ascending')
  const byName = ToggleSort.toggleSort(state, 'name')
  expect(byName.sortDirection).toBe('ascending')
  expect(ToggleSort.toggleSort(byName, 'name').sortDirection).toBe('descending')
})
