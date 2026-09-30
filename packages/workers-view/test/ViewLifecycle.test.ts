import { afterEach, expect, jest, test } from '@jest/globals'
import { PlatformType, ViewletCommand } from '@lvce-editor/constants'
import { createMockRpc } from '@lvce-editor/rpc'
import { RendererProcess } from '@lvce-editor/rpc-registry'
import type { TrackedWorker } from '../src/parts/WorkersState/WorkersState.ts'
import * as AutoRefresh from '../src/parts/AutoRefresh/AutoRefresh.ts'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'
import * as DiffType from '../src/parts/DiffType/DiffType.ts'
import * as GetWorkersVirtualDom from '../src/parts/GetWorkersVirtualDom/GetWorkersVirtualDom.ts'
import * as WhenExpression from '../src/parts/WhenExpression/WhenExpression.ts'
import * as WorkersStates from '../src/parts/WorkersStates/WorkersStates.ts'

const uid = 7
const create = (): void => commandMap['Workers.create'](uid, '', 10, 20, 200, 100, PlatformType.Web, '')

afterEach(() => {
  commandMap['Workers.dispose'](uid)
  jest.useRealTimers()
})

test('creates an unloaded view and renders its initial DOM and dimensions', () => {
  create()
  const { newState, oldState } = WorkersStates.get(uid)
  expect(oldState).toBe(newState)
  expect(newState).toEqual({
    domRendered: false,
    error: undefined,
    hasFocus: false,
    height: 100,
    loaded: false,
    platform: PlatformType.Web,
    scrollTop: 0,
    selectedWorkerId: undefined,
    sortColumn: undefined,
    sortDirection: undefined,
    uid,
    width: 200,
    workers: [],
    x: 10,
    y: 20,
  })
  const diff = commandMap['Workers.diff2'](uid)
  expect(diff).toEqual([DiffType.RenderDom, DiffType.RenderCss])
  expect(commandMap['Workers.render2'](uid, diff)).toEqual([
    [ViewletCommand.SetDom2, uid, GetWorkersVirtualDom.getWorkersVirtualDom([], false, PlatformType.Web)],
    [ViewletCommand.SetCss, uid, 'width:200px;height:100px;overflow:hidden;'],
  ])
})

test('does not consider a view mounted after rendering dimensions only', () => {
  create()
  commandMap['Workers.render2'](uid, [DiffType.RenderCss])
  expect(WorkersStates.get(uid).newState.domRendered).toBe(false)
  expect(commandMap['Workers.diff2'](uid)).toContain(DiffType.RenderDom)
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
  expect(WorkersStates.get(uid).oldState).toBe(WorkersStates.get(uid).newState)
  expect(WorkersStates.get(uid).newState.domRendered).toBe(true)
  expect(commandMap['Workers.diff2'](uid)).toEqual([DiffType.RenderIncremental])
  expect(commandMap['Workers.render2'](uid, [])).toEqual([])
  commandMap['Workers.dispose'](uid)
  expect(WorkersStates.get(uid)).toBeUndefined()
  expect(jest.getTimerCount()).toBe(0)
})

test('patches changed state and emits no patches when the rendered content is unchanged', async () => {
  create()
  const initialDiff = commandMap['Workers.diff2'](uid)
  commandMap['Workers.render2'](uid, initialDiff)

  const worker = { id: '1', memory: 1024, name: 'Editor Worker', runtimeName: 'Editor Worker [1]' }
  const loadedState = { ...WorkersStates.get(uid).newState, loaded: true, workers: [worker] }
  await commandMap['Workers.setComponentState'](uid, loadedState)
  const firstUpdate = commandMap['Workers.render2'](uid, commandMap['Workers.diff2'](uid))
  expect(firstUpdate[0]?.[0]).toBe(ViewletCommand.SetPatches)
  expect(firstUpdate[0]?.[2]).not.toEqual([])

  await commandMap['Workers.setComponentState'](uid, loadedState)
  const unchangedUpdate = commandMap['Workers.render2'](uid, commandMap['Workers.diff2'](uid))
  expect(unchangedUpdate[0]).toEqual([ViewletCommand.SetPatches, uid, []])

  const changedState = {
    ...loadedState,
    workers: [
      { ...worker, name: 'Renamed Worker' },
      { ...worker, id: '2', name: 'Added Worker' },
    ],
  }
  await commandMap['Workers.setComponentState'](uid, changedState)
  const changedUpdate = commandMap['Workers.render2'](uid, commandMap['Workers.diff2'](uid))
  expect(changedUpdate[0]?.[0]).toBe(ViewletCommand.SetPatches)
  expect(changedUpdate[0]?.[2]).not.toEqual([])

  await commandMap['Workers.setComponentState'](uid, { ...changedState, workers: [] })
  const removedUpdate = commandMap['Workers.render2'](uid, commandMap['Workers.diff2'](uid))
  expect(removedUpdate[0]?.[0]).toBe(ViewletCommand.SetPatches)
  expect(removedUpdate[0]?.[2]).not.toEqual([])
})

test('resizes without losing loaded content', async () => {
  create()
  commandMap['Workers.render2'](uid, commandMap['Workers.diff2'](uid))
  const previous = { ...WorkersStates.get(uid).newState, loaded: true, workers: [{ id: '1', memory: 0, name: 'Worker', runtimeName: 'Worker [1]' }] }
  WorkersStates.set(uid, previous, previous)
  await commandMap['Workers.resize'](uid, 20, 30, 450, 300)
  expect(WorkersStates.get(uid).newState).toEqual({ ...previous, height: 300, width: 450, x: 20, y: 30 })
  expect(previous.width).toBe(200)
  const diff = commandMap['Workers.diff2'](uid)
  expect(diff).toEqual([DiffType.RenderIncremental, DiffType.RenderCss])
  expect(commandMap['Workers.render2'](uid, diff)).toEqual([
    [ViewletCommand.SetPatches, uid, expect.any(Array)],
    [ViewletCommand.SetCss, uid, 'width:450px;height:300px;overflow:hidden;'],
  ])
  expect(commandMap['Workers.diff2'](uid)).toEqual([DiffType.RenderIncremental])
  await commandMap['Workers.resize'](uid, 20, 30, 450, 60)
  expect(commandMap['Workers.diff2'](uid)).toEqual([DiffType.RenderIncremental, DiffType.RenderCss])
  expect(commandMap['Workers.render2'](uid, [2])).toEqual([[ViewletCommand.SetCss, uid, 'width:450px;height:60px;overflow:hidden;']])
})

test('clears focused selection styling on blur', async () => {
  create()
  const state = { ...WorkersStates.get(uid).newState, hasFocus: true, selectedWorkerId: 'worker-1' }
  WorkersStates.set(uid, state, state)

  await commandMap['Workers.handleBlur'](uid)

  expect(WorkersStates.get(uid).newState).toEqual({ ...state, hasFocus: false })
  const diff = commandMap['Workers.diff2'](uid)
  expect(diff).toContain(DiffType.RenderFocusContext)
  expect(commandMap['Workers.render2'](uid, diff)).toContainEqual(['Viewlet.unsetAdditionalFocus', uid, WhenExpression.FocusWorkers])
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

test('refresh preserves the selected worker by stable id', async () => {
  const workers = [
    { id: 'worker-a', name: 'Alpha', runtimeName: 'Alpha' },
    { id: 'worker-b', name: 'Beta', runtimeName: 'Beta' },
  ]
  RendererProcess.set(createMockRpc({ commandMap: { 'Workers.getWorkers': () => workers } }))
  create()
  const initial = {
    ...WorkersStates.get(uid).newState,
    hasFocus: true,
    selectedWorkerId: 'worker-b',
  }
  await commandMap['Workers.setComponentState'](uid, initial)
  await commandMap['Workers.refresh'](uid)
  expect(WorkersStates.get(uid).newState).toMatchObject({
    hasFocus: true,
    selectedWorkerId: 'worker-b',
  })
})

test('refresh falls back to the first remaining worker when selection disappears', async () => {
  RendererProcess.set(createMockRpc({ commandMap: { 'Workers.getWorkers': () => [{ id: 'worker-a', name: 'Alpha', runtimeName: 'Alpha' }] } }))
  create()
  const initial = {
    ...WorkersStates.get(uid).newState,
    selectedWorkerId: 'worker-b',
  }
  await commandMap['Workers.setComponentState'](uid, initial)
  await commandMap['Workers.refresh'](uid)
  expect(WorkersStates.get(uid).newState).toMatchObject({ selectedWorkerId: 'worker-a' })
})

test('sorts memory by default in descending order when its header command is selected', async () => {
  create()
  await commandMap['Workers.sortByMemory'](uid)
  const { newState } = WorkersStates.get(uid)
  expect(newState.sortColumn).toBe('memory')
  expect(newState.sortDirection).toBe('descending')
})

test('registers the sort event handlers without a refresh button handler', () => {
  expect(commandMap['Workers.renderEventListeners']()).toEqual([
    { name: 13, params: ['handleBlur'], preventDefault: false },
    { name: 8, params: ['focusWorkers'], preventDefault: true },
    {
      name: 6,
      params: ['showWorkerContextMenu', 'event.currentTarget.dataset.workerId', 'event.clientX', 'event.clientY'],
      preventDefault: true,
    },
    {
      name: 9,
      params: ['handleTableClick', 'event.clientX', 'event.clientY', 'event.currentTarget.clientWidth'],
      preventDefault: true,
    },
    { name: 10, params: ['scrollWorkers', 'event.currentTarget.scrollTop'], preventDefault: false },
    {
      name: 11,
      params: ['sortHeaderByKeyboard', 'event.key', 'event.currentTarget.dataset.sortColumn'],
      preventDefault: true,
      stopPropagation: true,
    },
    {
      name: 12,
      params: ['selectWorker', 'event.currentTarget.dataset.workerId'],
      preventDefault: true,
      stopPropagation: true,
    },
  ])
})

test('disposal also stops an independently started refresh interval', () => {
  jest.useFakeTimers()
  create()
  AutoRefresh.start(uid)
  commandMap['Workers.dispose'](uid)
  expect(jest.getTimerCount()).toBe(0)
})
