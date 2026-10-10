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
  width: 200,
  workers,
  x: 0,
  y: 0,
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

test('keeps Renderer Worker first when the tree contains multiple roots', () => {
  const treeWorkers: readonly DisplayedWorker[] = [
    { id: 'other-root', memory: 1, name: 'Auxiliary Worker', runtimeName: 'Auxiliary Worker' },
    { id: 'child', memory: 2, name: 'Child Worker', parentId: 'other-root', runtimeName: 'Child Worker' },
    { id: 'renderer', memory: 3, name: 'Renderer Worker', runtimeName: 'Renderer Worker' },
  ]
  expect(SortWorkers.sortWorkers(treeWorkers, 'name', 'ascending').map((worker) => worker.id)).toEqual(['renderer', 'other-root', 'child'])
  expect(SortWorkers.sortWorkers([treeWorkers[0], treeWorkers[2]], undefined, undefined).map((worker) => worker.id)).toEqual([
    'renderer',
    'other-root',
  ])
  const reversedRoots: readonly DisplayedWorker[] = [
    { id: 'renderer', memory: 3, name: 'Renderer Worker', runtimeName: 'Renderer Worker' },
    { id: 'other-root', memory: 1, name: 'Auxiliary Worker', runtimeName: 'Auxiliary Worker' },
    { id: 'another-root', memory: 2, name: 'Beta Worker', runtimeName: 'Beta Worker' },
    { id: 'child', memory: 3, name: 'Child Worker', parentId: 'other-root', runtimeName: 'Child Worker' },
  ]
  expect(SortWorkers.sortWorkers(reversedRoots, 'name', 'ascending')[0]?.id).toBe('renderer')
})

test('keeps Renderer Worker first while sorting a flat worker list', () => {
  const flatWorkers: readonly DisplayedWorker[] = [
    { id: 'zulu', memory: 1, name: 'Zulu Worker', runtimeName: 'Zulu Worker' },
    { id: 'renderer', memory: 2, name: 'Renderer Worker', runtimeName: 'Renderer Worker' },
    { id: 'alpha', memory: 3, name: 'Alpha Worker', runtimeName: 'Alpha Worker' },
  ]
  expect(SortWorkers.sortWorkers(flatWorkers, 'name', 'ascending').map((worker) => worker.id)).toEqual(['renderer', 'alpha', 'zulu'])
})

test('preserves hierarchical order when sorting is not selected', () => {
  expect(SortWorkers.sortWorkers(workers, undefined, undefined)).toBe(workers)
  const nested: readonly DisplayedWorker[] = [
    { id: 'renderer', memory: 0, name: 'Renderer Worker', runtimeName: 'Renderer Worker' },
    ...workers.map((worker) => ({ ...worker, parentId: 'renderer' })),
  ]
  expect(SortWorkers.sortWorkers(nested, undefined, undefined).map((worker) => worker.id)).toEqual([
    'renderer',
    'large',
    'small',
    'missing',
    'medium',
  ])
})

test('keeps cyclic worker metadata in the sorted result', () => {
  const cyclic: readonly DisplayedWorker[] = [
    { id: 'cycle-a', memory: 1, name: 'Cycle A', parentId: 'cycle-b', runtimeName: 'Cycle A' },
    { id: 'cycle-b', memory: 2, name: 'Cycle B', parentId: 'cycle-a', runtimeName: 'Cycle B' },
  ]
  expect(SortWorkers.sortWorkers(cyclic, 'name', 'ascending').map((worker) => worker.id)).toEqual(['cycle-a', 'cycle-b'])
})

test('selects the default direction for each column then toggles it', () => {
  const byMemory = ToggleSort.toggleSort(state, 'memory')
  expect(byMemory.sortDirection).toBe('descending')
  expect(ToggleSort.toggleSort(byMemory, 'memory').sortDirection).toBe('ascending')
  const byName = ToggleSort.toggleSort(state, 'name')
  expect(byName.sortDirection).toBe('ascending')
  expect(ToggleSort.toggleSort(byName, 'name').sortDirection).toBe('descending')
})

test('sorts CPU numerically and keeps unavailable values last in either direction', () => {
  const values = workers.map((worker, index) => ({ ...worker, cpu: [70, 0, null, 9][index] }))
  expect(SortWorkers.sortWorkers(values, 'cpu', 'descending').map((worker) => worker.id)).toEqual(['large', 'medium', 'small', 'missing'])
  expect(SortWorkers.sortWorkers(values, 'cpu', 'ascending').map((worker) => worker.id)).toEqual(['small', 'medium', 'large', 'missing'])
})
