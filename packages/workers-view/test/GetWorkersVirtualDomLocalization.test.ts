import { expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { getWorkersVirtualDom } from '../src/parts/GetWorkersVirtualDom/GetWorkersVirtualDom.ts'
import * as WorkersViewStrings from '../src/parts/WorkersViewStrings/WorkersViewStrings.ts'

test('uses WorkersViewStrings for worker labels, memory, empty state, and the context menu', () => {
  const worker = { id: 'worker-1', memory: null, name: 'Editor Worker', runtimeName: 'Editor Worker [worker-1]' }
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Electron, undefined, undefined, undefined, worker.id)

  expect(nodes.some((node) => node.textContent === WorkersViewStrings.workers())).toBe(false)
  expect(nodes.some((node) => node.textContent === WorkersViewStrings.name())).toBe(true)
  expect(nodes.some((node) => node.textContent === WorkersViewStrings.heapUse())).toBe(true)
  expect(nodes.some((node) => node.textContent === WorkersViewStrings.unavailable())).toBe(true)
  expect(nodes.some((node) => node.textContent === WorkersViewStrings.terminateWorker())).toBe(false)
  expect(nodes.find((node) => node.className === 'WorkersViewTable')?.ariaLabel).toBe(WorkersViewStrings.workers())

  const emptyNodes = getWorkersVirtualDom([], true, PlatformType.Web)
  expect(emptyNodes.some((node) => node.textContent === WorkersViewStrings.noWorkersAreRunning())).toBe(true)
})

test('localizes the disclosure action for workers with children', () => {
  const parent = { id: 'parent', memory: null, name: 'Parent Worker', runtimeName: 'Parent Worker' }
  const child = { id: 'child', memory: null, name: 'Child Worker', parentId: parent.id, runtimeName: 'Child Worker' }
  const nodes = getWorkersVirtualDom([parent, child], true, PlatformType.Web)
  expect(nodes.find((node) => node.className === 'WorkersViewDisclosure')?.ariaLabel).toBe(WorkersViewStrings.collapseWorker())
})
