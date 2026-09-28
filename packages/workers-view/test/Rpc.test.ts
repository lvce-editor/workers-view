import type { Rpc } from '@lvce-editor/rpc'
import { afterAll, afterEach, expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { createMockRpc, PlainMessagePortRpc } from '@lvce-editor/rpc'
import { MainProcess, RendererProcess as RendererProcessRegistry, RendererWorker } from '@lvce-editor/rpc-registry'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'
import { handleMessagePort } from '../src/parts/HandleMessagePort/HandleMessagePort.ts'
import { refresh } from '../src/parts/RefreshWorkers/RefreshWorkers.ts'
import * as RendererProcess from '../src/parts/RendererProcess/RendererProcess.ts'

const ports: MessagePort[] = []
const channel = (): MessageChannel => {
  const value = new MessageChannel()
  ports.push(value.port1, value.port2)
  return value
}
const connect = async (commands: Readonly<Record<string, unknown>> = {}, setAsRendererProcess?: boolean): Promise<Rpc> => {
  const { port1, port2 } = channel()
  const peer = await PlainMessagePortRpc.create({ commandMap: commands, messagePort: port2 })
  await commandMap['Workers.handleMessagePort'](port1, setAsRendererProcess)
  return peer
}

afterEach(() => {
  for (const port of ports) port.close()
  ports.length = 0
  commandMap['Workers.dispose'](7)
})

afterAll(async () => {
  await MainProcess.dispose()
})

test('registers a renderer port and dispatches commands before requesting a render', async () => {
  const requestRender = jest.fn()
  RendererWorker.registerMockRpc({ 'Viewlet.requestRender': requestRender })
  const peer = await connect({ 'Workers.getWorkers': () => [] })
  expect(await RendererProcess.invoke('Workers.getWorkers')).toEqual([])
  await peer.invoke('Viewlet.executeViewletCommand', 7, 'create', '', 0, 0, 200, 100, PlatformType.Web, '')
  expect(requestRender).toHaveBeenCalledTimes(1)
  expect(requestRender).toHaveBeenCalledWith(7)
})

test('does not replace the renderer connection when explicitly disabled', async () => {
  RendererProcessRegistry.set(createMockRpc({ commandMap: { 'Workers.getWorkers': () => ['original'] } }))
  await connect({}, false)
  expect(await RendererProcess.invoke('Workers.getWorkers')).toEqual(['original'])
})

test('rejects unknown and failed view commands without requesting a render', async () => {
  const requestRender = jest.fn()
  RendererWorker.registerMockRpc({ 'Viewlet.requestRender': requestRender })
  const peer = await connect()
  await expect(peer.invoke('Viewlet.executeViewletCommand', 7, 'unknown')).rejects.toThrow('Viewlet command not found: unknown')
  await expect(peer.invoke('Viewlet.executeViewletCommand', 999, 'diff2')).rejects.toThrow()
  expect(requestRender).not.toHaveBeenCalled()
})

test('initializes the main process once and measures each runtime in the correct window', async () => {
  const memoryUsage = jest.fn(() => ({ usedSize: 4096 }))
  const send = jest.fn(async (port: MessagePort, _command: string, _id: number): Promise<void> => {
    ports.push(port)
    await PlainMessagePortRpc.create({ commandMap: { 'ElectronDeveloper.getWorkerMemoryUsage': memoryUsage }, messagePort: port })
  })
  RendererWorker.registerMockRpc({
    'GetWindowId.getWindowId': () => 42,
    'SendMessagePortToMainProcess.sendMessagePortToMainProcess': send,
  })
  const worker = { id: '1', name: 'Editor Worker', runtimeName: 'Editor Worker [1]' }
  RendererProcessRegistry.set(createMockRpc({ commandMap: { 'Workers.getWorkers': () => [worker] } }))
  const state = { error: undefined, height: 100, loaded: false, platform: PlatformType.Electron, uid: 7, width: 200, workers: [] }
  const result = await refresh(state)
  expect(result.workers).toEqual([{ ...worker, memory: 4096 }])
  await refresh(result)
  expect(send).toHaveBeenCalledTimes(1)
  expect(send).toHaveBeenCalledWith(expect.any(MessagePort), 'HandleElectronMessagePort.handleElectronMessagePort', 0)
  expect(memoryUsage.mock.calls).toEqual([
    [42, worker.runtimeName],
    [42, worker.runtimeName],
  ])
})

test('waits for asynchronous commands before requesting a render', async () => {
  const finished = Promise.withResolvers<void>()
  const started = Promise.withResolvers<void>()
  const command = jest.fn((_uid: number, _argument: string): Promise<void> => {
    started.resolve()
    return finished.promise
  })
  const requestRender = jest.fn()
  RendererWorker.registerMockRpc({ 'Viewlet.requestRender': requestRender })
  const { port1, port2 } = channel()
  const peer = await PlainMessagePortRpc.create({ commandMap: {}, messagePort: port2 })
  await handleMessagePort(port1, { 'Workers.refresh': command })
  const pending = peer.invoke('Viewlet.executeViewletCommand', 7, 'refresh', 'argument')
  await started.promise
  expect(command).toHaveBeenCalledWith(7, 'argument')
  expect(requestRender).not.toHaveBeenCalled()
  finished.resolve()
  await pending
  expect(requestRender).toHaveBeenCalledWith(7)
})
