import { afterEach, expect, jest, test } from '@jest/globals'
import { PlatformType, ViewletCommand } from '@lvce-editor/constants'
import { createMockRpc } from '@lvce-editor/rpc'
import { RendererProcess } from '@lvce-editor/rpc-registry'
import type { TrackedWorker } from '../src/parts/WorkersState/WorkersState.ts'
import * as AutoRefresh from '../src/parts/AutoRefresh/AutoRefresh.ts'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'
import * as GetWorkersVirtualDom from '../src/parts/GetWorkersVirtualDom/GetWorkersVirtualDom.ts'
import * as WorkersStates from '../src/parts/WorkersStates/WorkersStates.ts'

const uid = 7
const create = (): void => commandMap['Workers.create'](uid, '', 0, 0, 200, 100, PlatformType.Web, '')

afterEach(() => {
  commandMap['Workers.dispose'](uid)
  jest.useRealTimers()
})

test('creates an unloaded view and renders its initial DOM and dimensions', () => {
  create()
  const { newState, oldState } = WorkersStates.get(uid)
  expect(oldState).toBe(newState)
  expect(newState).toEqual({
    error: undefined,
    height: 100,
    loaded: false,
    platform: PlatformType.Web,
    sortColumn: undefined,
    sortDirection: undefined,
    uid,
    width: 200,
    workers: [],
  })
  const diff = commandMap['Workers.diff2'](uid)
  expect(diff).toEqual([1, 2])
  expect(commandMap['Workers.render2'](uid, diff)).toEqual([
    [ViewletCommand.SetDom2, uid, GetWorkersVirtualDom.getWorkersVirtualDom([], false, PlatformType.Web)],
    [ViewletCommand.SetCss, uid, 'width:200px;height:100px;overflow:auto;'],
  ])
})

test('loads workers, commits the rendered state, and disposes the refresh timer and state', async () => {
  jest.useFakeTimers()
  const worker = { id: '1', name: 'Editor Worker', runtimeName: 'Editor Worker [1]' }
  RendererProcess.set(createMockRpc({ commandMap: { 'Workers.getWorkers': () => [worker] } }))
  create()
  await commandMap['Workers.loadContent'](uid)
  const { newState } = WorkersStates.get(uid)
  expect(newState.loaded).toBe(true)
  expect(newState.workers).toEqual([{ ...worker, memory: null }])
  expect(jest.getTimerCount()).toBe(1)
  commandMap['Workers.render2'](uid, commandMap['Workers.diff2'](uid))
  expect(WorkersStates.get(uid).oldState).toBe(newState)
  expect(commandMap['Workers.diff2'](uid)).toEqual([1])
  expect(commandMap['Workers.render2'](uid, [])).toEqual([])
  commandMap['Workers.dispose'](uid)
  expect(WorkersStates.get(uid)).toBeUndefined()
  expect(jest.getTimerCount()).toBe(0)
})

test('resizes without losing loaded content', async () => {
  create()
  const previous = { ...WorkersStates.get(uid).newState, loaded: true, workers: [{ id: '1', memory: 0, name: 'Worker', runtimeName: 'Worker [1]' }] }
  WorkersStates.set(uid, previous, previous)
  await commandMap['Workers.resize'](uid, 450, 300)
  expect(WorkersStates.get(uid).newState).toEqual({ ...previous, height: 300, width: 450 })
  expect(previous.width).toBe(200)
})

test('exposes and updates the current component state', async () => {
  create()
  const state = commandMap['Workers.getComponentState'](uid)
  expect(state).toBe(WorkersStates.get(uid).newState)

  const updatedState = { ...state, loaded: true, workers: [{ id: '1', memory: 0, name: 'Worker', runtimeName: 'Worker [1]' }] }
  await commandMap['Workers.setComponentState'](uid, updatedState)

  expect(commandMap['Workers.getComponentState'](uid)).toEqual(updatedState)
  expect(WorkersStates.get(uid).newState).toEqual(updatedState)
})

test('rejects component state with a changed uid or an invalid value', async () => {
  create()
  const state = commandMap['Workers.getComponentState'](uid)

  await expect(commandMap['Workers.setComponentState'](uid, { ...state, uid: uid + 1 })).rejects.toThrow(`Workers state uid must remain ${uid}`)
  await expect(commandMap['Workers.setComponentState'](uid, [] as never)).rejects.toThrow('Workers state must be an object')
  expect(commandMap['Workers.getComponentState'](uid)).toBe(state)
})

test('component state commands reject a disposed view', async () => {
  create()
  commandMap['Workers.dispose'](uid)

  expect(() => commandMap['Workers.getComponentState'](uid)).toThrow()
  await expect(commandMap['Workers.setComponentState'](uid, {})).rejects.toThrow()
})

test('automatic refresh preserves an error until a manual refresh succeeds', async () => {
  const getWorkers = jest.fn(() => [])
  RendererProcess.set(createMockRpc({ commandMap: { 'Workers.getWorkers': getWorkers } }))
  create()
  const error = new Error('workers unavailable')
  await commandMap['Workers.setError'](uid, error)
  const failedState = WorkersStates.get(uid).newState
  await commandMap['Workers.autoRefresh'](uid)
  expect(WorkersStates.get(uid).newState).toBe(failedState)
  expect(getWorkers).not.toHaveBeenCalled()
  await commandMap['Workers.refresh'](uid)
  expect(WorkersStates.get(uid).newState.error).toBeUndefined()
  await commandMap['Workers.autoRefresh'](uid)
  expect(getWorkers).toHaveBeenCalledTimes(2)
})

test('refresh preserves a sort selection made while worker data is loading', async () => {
  const workerResponse = Promise.withResolvers<readonly TrackedWorker[]>()
  RendererProcess.set(
    createMockRpc({
      commandMap: { 'Workers.getWorkers': () => workerResponse.promise },
    }),
  )
  create()
  const refreshPromise = commandMap['Workers.refresh'](uid)
  await commandMap['Workers.sortByName'](uid)
  workerResponse.resolve([
    { id: 'z', name: 'Zulu', runtimeName: 'Zulu' },
    { id: 'a', name: 'Alpha', runtimeName: 'Alpha' },
  ])
  await refreshPromise
  const { newState } = WorkersStates.get(uid)
  expect(newState.sortColumn).toBe('name')
  expect(newState.sortDirection).toBe('ascending')
  expect(newState.workers.map((worker) => worker.name)).toEqual(['Alpha', 'Zulu'])
})

test('sorts memory by default in descending order when its header command is selected', async () => {
  create()
  await commandMap['Workers.sortByMemory'](uid)
  const { newState } = WorkersStates.get(uid)
  expect(newState.sortColumn).toBe('memory')
  expect(newState.sortDirection).toBe('descending')
})

test('exposes the refresh event handler', () => {
  expect(commandMap['Workers.renderEventListeners']()).toEqual([
    { name: 1, params: ['refresh'], preventDefault: true },
    { name: 2, params: ['sortByName'], preventDefault: true },
    { name: 3, params: ['sortByMemory'], preventDefault: true },
  ])
})

test('disposal also stops an independently started refresh interval', () => {
  jest.useFakeTimers()
  create()
  AutoRefresh.start(uid)
  commandMap['Workers.dispose'](uid)
  expect(jest.getTimerCount()).toBe(0)
})
