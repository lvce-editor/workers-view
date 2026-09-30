import { expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { getWorkersVirtualDom } from '../src/parts/GetWorkersVirtualDom/GetWorkersVirtualDom.ts'

const worker = { id: 'worker-1', memory: 1024, name: 'Editor Worker', runtimeName: 'Editor Worker [worker-1]' }

const everyElementHasClassName = (nodes: ReturnType<typeof getWorkersVirtualDom>): boolean => {
  return nodes.every((node) => typeof node.className === 'string' && node.className.length > 0)
}

const getSubtreeEnd = (nodes: ReturnType<typeof getWorkersVirtualDom>, index: number): number => {
  let cursor = index + 1
  for (let child = 0; child < (nodes[index]?.childCount ?? 0); child++) {
    cursor = getSubtreeEnd(nodes, cursor)
  }
  return cursor
}

const getDirectChildren = (nodes: ReturnType<typeof getWorkersVirtualDom>, className: string): ReturnType<typeof getWorkersVirtualDom>[number][] => {
  const parentIndex = nodes.findIndex((node) => node.className?.split(' ').includes(className))
  if (parentIndex === -1) {
    return []
  }
  const children = []
  let cursor = parentIndex + 1
  const end = getSubtreeEnd(nodes, parentIndex)
  while (cursor < end) {
    children.push(nodes[cursor])
    cursor = getSubtreeEnd(nodes, cursor)
  }
  return children
}

test('gives every element a stable class in loading, populated, and empty states', () => {
  expect(everyElementHasClassName(getWorkersVirtualDom([], false, PlatformType.Web))).toBe(true)
  expect(everyElementHasClassName(getWorkersVirtualDom([worker], true, PlatformType.Web))).toBe(true)
  expect(everyElementHasClassName(getWorkersVirtualDom([worker], true, PlatformType.Electron))).toBe(true)
  expect(everyElementHasClassName(getWorkersVirtualDom([], true, PlatformType.Web))).toBe(true)
  expect(everyElementHasClassName(getWorkersVirtualDom([], true, PlatformType.Electron))).toBe(true)
})

test('declares the actual number of root children in every view state', () => {
  const states = [
    getWorkersVirtualDom([], false, PlatformType.Web),
    getWorkersVirtualDom([worker], true, PlatformType.Web),
    getWorkersVirtualDom([], true, PlatformType.Web),
    getWorkersVirtualDom([], true, PlatformType.Web, new Error('Workers unavailable')),
  ]
  expect(states.map(([root]) => root?.childCount)).toEqual([1, 1, 1, 2])
})

test('wraps the table and empty state while keeping errors at the view level', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Electron, new Error('Workers unavailable'), undefined, undefined, worker.id)
  expect(getDirectChildren(nodes, 'WorkersView').map((node) => node.className)).toEqual(['WorkersViewError', 'WorkersViewTableContainer'])
  expect(getDirectChildren(nodes, 'WorkersViewTableContainer').map((node) => node.className)).toEqual(['WorkersViewTable'])
  const tableChildren = getDirectChildren(nodes, 'WorkersViewTable')
  expect(tableChildren.map((node) => node.className)).toEqual([
    'WorkersViewTableHeaderRow',
    'WorkersViewWorkerRow WorkersViewWorkerRowSelected WorkersViewWorkerRowBlurred',
  ])
  expect(getDirectChildren(nodes, 'WorkersViewWorkerRow').map((node) => node.className)).toEqual(['WorkersViewWorkerCell', 'WorkersViewWorkerCell'])

  const emptyNodes = getWorkersVirtualDom([], true, PlatformType.Web)
  expect(getDirectChildren(emptyNodes, 'WorkersViewTableContainer').map((node) => node.className)).toEqual([
    'WorkersViewTable',
    'WorkersViewEmptyState',
  ])
})

test('uses PascalCase class names for every Workers view element', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Electron, new Error('Workers unavailable'))
  expect(nodes.map((node) => node.className)).toEqual([
    'WorkersView',
    'WorkersViewError',
    'WorkersViewTableContainer',
    'WorkersViewTable',
    'WorkersViewTableHeaderRow',
    'WorkersViewTableHeaderCell',
    'WorkersViewTableHeaderButton',
    'WorkersViewTableHeaderCell',
    'WorkersViewTableHeaderButton',
    'WorkersViewWorkerRow',
    'WorkersViewWorkerCell',
    'WorkersViewWorkerCell',
  ])
  expect(getWorkersVirtualDom([], true, PlatformType.Web).map((node) => node.className)).toContain('WorkersViewEmptyState')
})

test('shows a heap column in Electron and leaves missing measurements unavailable', () => {
  const nodes = getWorkersVirtualDom([{ ...worker, memory: null }], true, PlatformType.Electron)
  expect(nodes.some((node) => node.textContent === 'Heap use')).toBe(true)
  expect(nodes.some((node) => node.textContent === 'Unavailable')).toBe(true)
})

test('formats worker memory in Electron', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Electron)
  expect(nodes.some((node) => node.textContent === '1.0 KiB')).toBe(true)
})

test('renders accessible red growth and green shrinkage rates beside heap usage', () => {
  const growing = getWorkersVirtualDom([{ ...worker, memoryTrend: { bytesPerSecond: 2100, direction: 'growing' } }], true, PlatformType.Electron)
  expect(growing.find((node) => node.className === 'WorkersViewMemoryTrend WorkersViewMemoryTrendGrowing')).toMatchObject({
    ariaLabel: 'Memory growing at 2.1 kB/s',
    textContent: '↑ 2.1 kB/s',
  })
  expect(getDirectChildren(growing, 'WorkersViewWorkerRow').map(({ className }) => className)).toEqual([
    'WorkersViewWorkerCell',
    'WorkersViewWorkerCell',
  ])

  const shrinking = getWorkersVirtualDom([{ ...worker, memoryTrend: { bytesPerSecond: 1024, direction: 'shrinking' } }], true, PlatformType.Electron)
  expect(shrinking.find((node) => node.className === 'WorkersViewMemoryTrend WorkersViewMemoryTrendShrinking')).toMatchObject({
    ariaLabel: 'Memory shrinking at 1.0 kB/s',
    textContent: '↓ 1.0 kB/s',
  })
})

test('renders sortable headers and exposes the selected sort direction', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Electron, undefined, 'memory', 'descending')
  const headers = nodes.filter((node) => node.className === 'WorkersViewTableHeaderCell')
  expect(headers.map((header) => header['aria-sort'])).toEqual(['none', 'descending'])
  const table = nodes.find((node) => node.className === 'WorkersViewTable')
  const buttons = nodes.filter((node) => node.className === 'WorkersViewTableHeaderButton')
  expect(table?.onClick).toBe(9)
  expect(buttons.map((button) => button.onClick)).toEqual([undefined, undefined])
  expect(buttons.map((button) => button.onKeyDown)).toEqual([11, 11])
  expect(buttons.map((button) => button['data-sortColumn'])).toEqual(['name', 'memory'])
  expect(nodes.filter((node) => node.className?.startsWith('WorkersViewWorkerRow')).map((row) => row.onClick)).toEqual([12])
})

test('marks the selected worker without rendering an inline context menu', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Electron, undefined, undefined, undefined, worker.id, true)
  const row = nodes.find((node) => node.className?.includes('WorkersViewWorkerRow'))
  expect(row).toMatchObject({
    'aria-selected': true,
    className: 'WorkersViewWorkerRow WorkersViewWorkerRowSelected WorkersViewWorkerRowFocused',
    'data-workerId': worker.id,
  })
  expect(nodes.some((node) => node.className === 'WorkersViewContextMenu')).toBe(false)
})

test('shows only worker names outside Electron', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Web)
  expect(nodes.some((node) => node.textContent === 'Editor Worker')).toBe(true)
  expect(nodes.some((node) => node.textContent === 'Heap use')).toBe(false)
  expect(nodes.some((node) => node.textContent === '1.0 KiB')).toBe(false)
})

test('shows an empty state after the first refresh', () => {
  const nodes = getWorkersVirtualDom([], true, PlatformType.Web)
  expect(nodes.some((node) => node.textContent === 'No workers are running.')).toBe(true)
})

test('does not show an empty state while loading or when a worker is present', () => {
  expect(getWorkersVirtualDom([], false, PlatformType.Web).some((node) => node.textContent === 'No workers are running.')).toBe(false)
  expect(getWorkersVirtualDom([worker], true, PlatformType.Electron).some((node) => node.textContent === 'No workers are running.')).toBe(false)
})

test('renders an error message with an alert role', () => {
  const nodes = getWorkersVirtualDom([], true, PlatformType.Web, new Error('Workers unavailable'))
  expect(nodes.some((node) => node.role === 'alert' && node.textContent === 'Workers unavailable')).toBe(true)
})

test('uses the existing English strings by default', () => {
  const nodes = getWorkersVirtualDom([{ ...worker, memory: null }], true, PlatformType.Electron)
  expect(nodes.some((node) => node.textContent === 'Workers')).toBe(false)
  expect(nodes.some((node) => node.className === 'WorkersViewRefreshButton')).toBe(false)
  expect(nodes.some((node) => node.textContent === 'Name')).toBe(true)
  expect(nodes.some((node) => node.textContent === 'Heap use')).toBe(true)
  expect(nodes.some((node) => node.textContent === 'Unavailable')).toBe(true)
  expect(nodes.find((node) => node.className === 'WorkersViewTable')?.ariaLabel).toBe('Workers')
  expect(getWorkersVirtualDom([], true, PlatformType.Web).some((node) => node.textContent === 'No workers are running.')).toBe(true)
})
