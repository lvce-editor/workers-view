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

test('shows a heap column in Electron and leaves missing measurements unavailable', () => {
  const nodes = getWorkersVirtualDom([{ ...worker, memory: null }], true, PlatformType.Electron)
  expect(nodes.some((node) => node.text === 'JavaScript heap used')).toBe(true)
  expect(nodes.some((node) => node.text === 'Unavailable')).toBe(true)
})

test('shows only worker names outside Electron', () => {
  const nodes = getWorkersVirtualDom([worker], true, PlatformType.Web)
  expect(nodes.some((node) => node.text === 'Editor Worker')).toBe(true)
  expect(nodes.some((node) => node.text === 'JavaScript heap used')).toBe(false)
  expect(nodes.some((node) => node.text === '1.0 KiB')).toBe(false)
})

test('shows an empty state after the first refresh', () => {
  const nodes = getWorkersVirtualDom([], true, PlatformType.Web)
  expect(nodes.some((node) => node.text === 'No workers are running.')).toBe(true)
})

test('does not show an empty state while loading or when a worker is present', () => {
  expect(getWorkersVirtualDom([], false, PlatformType.Web).some((node) => node.text === 'No workers are running.')).toBe(false)
  expect(getWorkersVirtualDom([worker], true, PlatformType.Electron).some((node) => node.text === 'No workers are running.')).toBe(false)
})

test('uses the existing English strings by default', () => {
  const nodes = getWorkersVirtualDom([{ ...worker, memory: null }], true, PlatformType.Electron)
  expect(nodes.some((node) => node.text === 'Workers')).toBe(true)
  expect(nodes.some((node) => node.text === 'Refresh')).toBe(true)
  expect(nodes.some((node) => node.text === 'Name')).toBe(true)
  expect(nodes.some((node) => node.text === 'JavaScript heap used')).toBe(true)
  expect(nodes.some((node) => node.text === 'Unavailable')).toBe(true)
  expect(nodes[3]?.ariaLabel).toBe('Workers')
  expect(getWorkersVirtualDom([], true, PlatformType.Web).some((node) => node.text === 'No workers are running.')).toBe(true)
})
