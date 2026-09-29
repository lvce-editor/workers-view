import { expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { getWorkersVirtualDom } from '../src/parts/GetWorkersVirtualDom/GetWorkersVirtualDom.ts'

const worker = { id: 'worker-1', memory: 1024, name: 'Editor Worker', runtimeName: 'Editor Worker [worker-1]' }

const everyElementHasClassName = (nodes: ReturnType<typeof getWorkersVirtualDom>): boolean => {
  return nodes.every((node) => typeof node.className === 'string' && node.className.length > 0)
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
  expect(states.map(([root]) => root?.childCount)).toEqual([2, 2, 3, 4])
})

test('uses PascalCase class names for every Workers view element', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Electron, new Error('Workers unavailable'))
  expect(nodes.map((node) => node.className)).toEqual([
    'WorkersView',
    'WorkersViewTitle',
    'WorkersViewError',
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
  expect(nodes.some((node) => node.textContent === 'JavaScript heap used')).toBe(true)
  expect(nodes.some((node) => node.textContent === 'Unavailable')).toBe(true)
})

test('formats worker memory in Electron', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Electron)
  expect(nodes.some((node) => node.textContent === '1.0 KiB')).toBe(true)
})

test('renders sortable headers and exposes the selected sort direction', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Electron, undefined, undefined, 'memory', 'descending')
  const headers = nodes.filter((node) => node.className === 'WorkersViewTableHeaderCell')
  expect(headers.map((header) => header['aria-sort'])).toEqual(['none', 'descending'])
  expect(nodes.filter((node) => node.className === 'WorkersViewTableHeaderButton').map((button) => button.onClick)).toEqual([2, 3])
})

test('marks the selected worker and renders its right-click action', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Electron, undefined, undefined, undefined, undefined, worker.id, worker.id, true)
  const row = nodes.find((node) => node.className?.includes('WorkersViewWorkerRow'))
  expect(row).toMatchObject({
    'aria-selected': true,
    className: 'WorkersViewWorkerRow WorkersViewWorkerRowSelected WorkersViewWorkerRowFocused',
    'data-workerId': worker.id,
  })
  expect(nodes.some((node) => node.className === 'WorkersViewContextMenu')).toBe(true)
  expect(nodes.some((node) => node.className === 'WorkersViewContextMenuItem' && node.textContent === 'Terminate Worker')).toBe(true)
})

test('shows only worker names outside Electron', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Web)
  expect(nodes.some((node) => node.textContent === 'Editor Worker')).toBe(true)
  expect(nodes.some((node) => node.textContent === 'JavaScript heap used')).toBe(false)
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
  expect(nodes.some((node) => node.textContent === 'Workers')).toBe(true)
  expect(nodes.some((node) => node.className === 'WorkersViewRefreshButton')).toBe(false)
  expect(nodes.some((node) => node.textContent === 'Name')).toBe(true)
  expect(nodes.some((node) => node.textContent === 'JavaScript heap used')).toBe(true)
  expect(nodes.some((node) => node.textContent === 'Unavailable')).toBe(true)
  expect(nodes[2]?.ariaLabel).toBe('Workers')
  expect(getWorkersVirtualDom([], true, PlatformType.Web).some((node) => node.textContent === 'No workers are running.')).toBe(true)
})

test('uses substituted strings in labels, empty state, and the table accessible name', () => {
  const strings = {
    javaScriptHeapUsed: (): string => 'translated heap',
    name: (): string => 'translated name',
    noWorkersAreRunning: (): string => 'translated empty state',
    terminateWorker: (): string => 'translated terminate',
    unavailable: (): string => 'translated unavailable',
    workers: (): string => 'translated workers',
  }
  const nodes = getWorkersVirtualDom([{ ...worker, memory: null }], true, PlatformType.Electron, undefined, strings)
  expect(nodes.some((node) => node.textContent === 'translated workers')).toBe(true)
  expect(nodes.some((node) => node.textContent === 'translated name')).toBe(true)
  expect(nodes.some((node) => node.textContent === 'translated heap')).toBe(true)
  expect(nodes.some((node) => node.textContent === 'translated unavailable')).toBe(true)
  expect(nodes[2]?.ariaLabel).toBe('translated workers')
  expect(getWorkersVirtualDom([], true, PlatformType.Web, undefined, strings).some((node) => node.textContent === 'translated empty state')).toBe(
    true,
  )
})
