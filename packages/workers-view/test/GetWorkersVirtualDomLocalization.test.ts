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
