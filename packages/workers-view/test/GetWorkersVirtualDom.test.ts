import { expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { getWorkersVirtualDom } from '../src/parts/GetWorkersVirtualDom/GetWorkersVirtualDom.ts'

const worker = { id: 'worker-1', memory: 1024, name: 'Editor Worker', runtimeName: 'Editor Worker [worker-1]' }

const everyElementHasClassName = (nodes: ReturnType<typeof getWorkersVirtualDom>): boolean => {
  return nodes.every((node) => typeof node.className === 'string' && node.className.length > 0)
}

test('gives every element a stable class in loading, populated, and empty states', () => {
  expect(everyElementHasClassName(getWorkersVirtualDom([], false, PlatformType.Web, undefined))).toBe(true)
  expect(everyElementHasClassName(getWorkersVirtualDom([worker], true, PlatformType.Web, undefined))).toBe(true)
  expect(everyElementHasClassName(getWorkersVirtualDom([worker], true, PlatformType.Electron, undefined))).toBe(true)
  expect(everyElementHasClassName(getWorkersVirtualDom([], true, PlatformType.Web, undefined))).toBe(true)
  expect(everyElementHasClassName(getWorkersVirtualDom([], true, PlatformType.Electron, undefined))).toBe(true)
})

test('shows a heap column in Electron and leaves missing measurements unavailable', () => {
  const nodes = getWorkersVirtualDom([{ ...worker, memory: null }], true, PlatformType.Electron, undefined)
  expect(nodes.some((node) => node.text === 'JavaScript heap used')).toBe(true)
  expect(nodes.some((node) => node.text === 'Unavailable')).toBe(true)
})

test('shows only worker names outside Electron', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Web, undefined)
  expect(nodes.some((node) => node.text === 'Editor Worker')).toBe(true)
  expect(nodes.some((node) => node.text === 'JavaScript heap used')).toBe(false)
  expect(nodes.some((node) => node.text === '1.0 KiB')).toBe(false)
})

test('shows an empty state after the first refresh', () => {
  const nodes = getWorkersVirtualDom([], true, PlatformType.Web, undefined)
  expect(nodes.some((node) => node.text === 'No workers are running.')).toBe(true)
})

test('does not show an empty state while loading or when a worker is present', () => {
  expect(getWorkersVirtualDom([], false, PlatformType.Web, undefined).some((node) => node.text === 'No workers are running.')).toBe(false)
  expect(getWorkersVirtualDom([worker], true, PlatformType.Electron, undefined).some((node) => node.text === 'No workers are running.')).toBe(false)
})

test('renders an error message with an alert role', () => {
  const nodes = getWorkersVirtualDom([], true, PlatformType.Web, new Error('Workers unavailable'))
  expect(nodes.some((node) => node.role === 'alert' && node.text === 'Workers unavailable')).toBe(true)
})
