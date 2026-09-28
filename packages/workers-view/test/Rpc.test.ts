import { afterEach, expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import * as Rpc from '@lvce-editor/rpc'
import { MainProcess, RendererProcess as RendererProcessRegistry, RendererWorker } from '@lvce-editor/rpc-registry'

const rendererRpc = Rpc.createMockRpc({ commandMap: { 'Workers.getWorkers': () => [] } })
const createPortRpc = jest.fn<typeof Rpc.PlainMessagePortRpc.create>().mockResolvedValue(rendererRpc)
const memoryUsage = jest.fn<(...args: readonly unknown[]) => Promise<{ usedSize: number }>>().mockResolvedValue({ usedSize: 4096 })
const mainRpc = Rpc.createMockRpc({ commandMap: { 'ElectronDeveloper.getWorkerMemoryUsage': memoryUsage } })
const createMainRpc = jest.fn<typeof Rpc.LazyTransferMessagePortRpcParent.create>().mockResolvedValue(mainRpc)

jest.unstable_mockModule('@lvce-editor/rpc', () => ({
  ...Rpc,
  LazyTransferMessagePortRpcParent: { create: createMainRpc },
  PlainMessagePortRpc: { create: createPortRpc },
}))

const { commandMap } = await import('../src/parts/CommandMap/CommandMap.ts')
const { handleMessagePort } = await import('../src/parts/HandleMessagePort/HandleMessagePort.ts')
const { initializeMainProcess } = await import('../src/parts/InitializeMainProcess/InitializeMainProcess.ts')
const { refresh } = await import('../src/parts/RefreshWorkers/RefreshWorkers.ts')
const RendererProcess = await import('../src/parts/RendererProcess/RendererProcess.ts')

const port = {} as MessagePort
const state = { error: undefined, height: 100, loaded: false, platform: PlatformType.Electron, uid: 7, width: 200, workers: [] }

afterEach(() => {
  jest.clearAllMocks()
})

test('registers a renderer port and dispatches commands before requesting a render', async () => {
  const requestRender = jest.fn<(...args: readonly unknown[]) => Promise<void>>().mockResolvedValue(undefined)
  RendererWorker.registerMockRpc({ 'Viewlet.requestRender': requestRender })
  await commandMap['Workers.handleMessagePort'](port)
  expect(createPortRpc).toHaveBeenCalledWith({ commandMap: expect.any(Object), messagePort: port })
  expect(await RendererProcess.invoke('Workers.getWorkers')).toEqual([])
  const execute = createPortRpc.mock.calls[0][0].commandMap['Viewlet.executeViewletCommand']
  await execute(7, 'create', '', 0, 0, 200, 100, PlatformType.Web, '')
  expect(requestRender).toHaveBeenCalledTimes(1)
  expect(requestRender).toHaveBeenCalledWith(7)
  commandMap['Workers.dispose'](7)
})

test('does not replace the renderer connection when explicitly disabled', async () => {
  RendererProcessRegistry.set(Rpc.createMockRpc({ commandMap: { 'Workers.getWorkers': () => ['original'] } }))
  await commandMap['Workers.handleMessagePort'](port, false)
  expect(await RendererProcess.invoke('Workers.getWorkers')).toEqual(['original'])
})

test('rejects unknown and failed view commands without requesting a render', async () => {
  const requestRender = jest.fn()
  RendererWorker.registerMockRpc({ 'Viewlet.requestRender': requestRender })
  await commandMap['Workers.handleMessagePort'](port)
  const execute = createPortRpc.mock.calls[0][0].commandMap['Viewlet.executeViewletCommand']
  await expect(execute(7, 'unknown')).rejects.toThrow('Viewlet command not found: unknown')
  await expect(execute(999, 'diff2')).rejects.toThrow()
  expect(requestRender).not.toHaveBeenCalled()
})

test('creates the main process RPC and forwards its port through the renderer worker', async () => {
  const send = jest.fn<(...args: readonly unknown[]) => Promise<void>>().mockResolvedValue(undefined)
  RendererWorker.registerMockRpc({ 'SendMessagePortToMainProcess.sendMessagePortToMainProcess': send })
  await initializeMainProcess()
  expect(createMainRpc).toHaveBeenCalledWith({ commandMap: {}, send: expect.any(Function) })
  await createMainRpc.mock.calls[0][0].send(port)
  expect(send).toHaveBeenCalledTimes(1)
  expect(send).toHaveBeenCalledWith(port, 'HandleElectronMessagePort.handleElectronMessagePort', 0)
  await MainProcess.getWorkerMemoryUsage(3, 'worker')
  expect(memoryUsage).toHaveBeenCalledTimes(1)
  expect(memoryUsage).toHaveBeenCalledWith(3, 'worker')
})

test('initializes Electron measurements once and uses each worker runtime name and window id', async () => {
  const workers = [
    { id: '1', name: 'Editor Worker', runtimeName: 'Editor Worker [1]' },
    { id: '2', name: 'Editor Worker', runtimeName: 'Editor Worker [2]' },
  ]
  RendererProcessRegistry.set(Rpc.createMockRpc({ commandMap: { 'Workers.getWorkers': () => workers } }))
  RendererWorker.registerMockRpc({ 'GetWindowId.getWindowId': () => 42 })
  const result = await refresh(state)
  expect(result.workers).toEqual(workers.map((worker) => ({ ...worker, memory: 4096 })))
  expect(memoryUsage.mock.calls).toEqual([
    [42, workers[0].runtimeName],
    [42, workers[1].runtimeName],
  ])
  await refresh(result)
  expect(createMainRpc).toHaveBeenCalledTimes(1)
  expect(memoryUsage).toHaveBeenCalledTimes(4)
})

test('waits for asynchronous commands before requesting a render', async () => {
  let finish!: () => void
  const command = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve
      }),
  )
  const requestRender = jest.fn()
  RendererWorker.registerMockRpc({ 'Viewlet.requestRender': requestRender })
  await handleMessagePort(port, { 'Workers.refresh': command })
  const execute = createPortRpc.mock.calls[0][0].commandMap['Viewlet.executeViewletCommand']
  const pending = execute(7, 'refresh', 'argument')
  expect(command).toHaveBeenCalledWith(7, 'argument')
  expect(requestRender).not.toHaveBeenCalled()
  finish()
  await pending
  expect(requestRender).toHaveBeenCalledWith(7)
})
