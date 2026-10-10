import { expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import type { DisplayedWorker, WorkersState } from '../src/parts/WorkersState/WorkersState.ts'
import * as AriaRoles from '../src/parts/AriaRoles/AriaRoles.ts'
import * as GetVisibleWorkers from '../src/parts/GetVisibleWorkers/GetVisibleWorkers.ts'
import { getWorkersVirtualDom } from '../src/parts/GetWorkersVirtualDom/GetWorkersVirtualDom.ts'
import * as RenderCss from '../src/parts/RenderCss/RenderCss.ts'
import * as SortWorkers from '../src/parts/SortWorkers/SortWorkers.ts'
import * as ToggleWorker from '../src/parts/ToggleWorker/ToggleWorker.ts'

const workers: readonly DisplayedWorker[] = [
  { id: 'extension', memory: 0, name: 'ESLint Worker', parentId: 'extension-management', runtimeName: 'ESLint Worker' },
  { id: 'builtin', memory: 0, name: 'Panel Worker', parentId: 'renderer', runtimeName: 'Panel Worker' },
  { id: 'extension-management', memory: 0, name: 'Extension Management Worker', parentId: 'renderer', runtimeName: 'Extension Management Worker' },
  { id: 'renderer', memory: 0, name: 'Renderer Worker', runtimeName: 'Renderer Worker' },
]

test('sorts each branch while keeping Renderer Worker first', () => {
  const sorted = SortWorkers.sortWorkers(workers, 'name', 'ascending')
  expect(sorted.map(({ id }) => id)).toEqual(['renderer', 'extension-management', 'extension', 'builtin'])
})

test('renders visible descendants and hides them when their parent is collapsed', () => {
  expect(GetVisibleWorkers.getVisibleWorkers(workers, []).map(({ depth, id }) => [id, depth])).toEqual([
    ['renderer', 1],
    ['builtin', 2],
    ['extension-management', 2],
    ['extension', 3],
  ])
  expect(GetVisibleWorkers.getVisibleWorkers(workers, ['extension-management']).map(({ id }) => id)).toEqual([
    'renderer',
    'builtin',
    'extension-management',
  ])
})

test('retains stable worker selection while toggling an expanded parent', () => {
  const state = {
    collapsedWorkerIds: [],
    selectedWorkerId: 'renderer',
    workers,
  } as unknown as WorkersState
  const collapsedState = ToggleWorker.toggleWorker(state, 'extension-management')
  expect(collapsedState).toMatchObject({
    collapsedWorkerIds: ['extension-management'],
    selectedWorkerId: 'extension-management',
  })
  expect(ToggleWorker.toggleWorker(collapsedState, 'extension-management')).toMatchObject({ collapsedWorkerIds: [] })
})

test('orphaned workers remain visible as roots', () => {
  const workersWithOrphan = [...workers, { id: 'orphan', memory: 0, name: 'Orphan Worker', parentId: 'missing', runtimeName: 'Orphan' }]
  expect(GetVisibleWorkers.getVisibleWorkers(workersWithOrphan, []).map(({ id }) => id)).toContain('orphan')
})

test('keeps cyclic worker metadata reachable', () => {
  const cyclicWorkers = [
    { id: 'cycle-a', memory: 0, name: 'Cycle A', parentId: 'cycle-b', runtimeName: 'Cycle A' },
    { id: 'cycle-b', memory: 0, name: 'Cycle B', parentId: 'cycle-a', runtimeName: 'Cycle B' },
  ]
  expect(GetVisibleWorkers.getVisibleWorkers(cyclicWorkers, []).map(({ id }) => id)).toEqual(['cycle-a', 'cycle-b'])
})

test('renders tree grid levels and accessible disclosure controls', () => {
  const nodes = getWorkersVirtualDom(workers, true, PlatformType.Web, undefined, undefined, undefined, 'renderer', false)
  const rows = nodes.filter((node) => node.className?.startsWith('WorkersViewWorkerRow'))
  expect(rows.map((row) => [row.ariaLevel, row.ariaExpanded])).toEqual([
    [1, true],
    [2, undefined],
    [2, true],
    [3, undefined],
  ])
  expect(nodes.filter((node) => node.className === 'WorkersViewDisclosure')).toHaveLength(2)
  expect(nodes.find((node) => node.className === 'WorkersViewTable')?.role).toBe(AriaRoles.TreeGrid)
  const collapsed = getWorkersVirtualDom(workers, true, PlatformType.Web, undefined, undefined, undefined, 'extension-management', false, [
    'extension-management',
  ])
  expect(collapsed.filter((node) => node.className === 'WorkersViewDisclosure').map((node) => node.textContent)).toEqual(['▾', '▸'])
})

test('adds indentation CSS for nested rows', () => {
  const css = RenderCss.renderCss({} as WorkersState, { height: 100, uid: 1, width: 100, workers } as unknown as WorkersState)[2]
  expect(css).toContain('.WorkersViewIndent-2{padding-left:16px;}')
  expect(css).toContain('.WorkersViewDisclosure')
})

test('ignores disclosure requests for missing and leaf workers', () => {
  const state = { collapsedWorkerIds: [], workers } as unknown as WorkersState
  expect(ToggleWorker.toggleWorker(state, 'missing')).toBe(state)
  expect(ToggleWorker.toggleWorker(state, 'extension')).toBe(state)
})
