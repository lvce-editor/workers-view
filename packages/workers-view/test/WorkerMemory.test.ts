import { afterEach, expect, jest, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { PlainMessagePortRpc, createMockRpc } from '@lvce-editor/rpc'
import { RendererWorker, RendererProcess } from '@lvce-editor/rpc-registry'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'
import * as WorkerMemory from '../src/parts/WorkerMemory/WorkerMemory.ts'
import * as WorkersStates from '../src/parts/WorkersStates/WorkersStates.ts'

const ports: MessagePort[] = []
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const fixture = () => {
  const getTargets = jest.fn(async () => ['a', 'b'])
  const attach = jest.fn(async (ids: readonly string[]) =>
    ids.map((id) => ({ runtimeName: `Worker ${id}`, sessionId: `session-${id}`, targetId: id })),
  )
  const getHeapUsages = jest.fn<(ids: readonly string[]) => Promise<readonly ({ usedSize: number } | null)[]>>(async (ids) =>
    ids.map(() => ({ cpu: null, usedSize: 1024 })),
  )
  const getCpuUsages = jest.fn<(ids: readonly string[]) => Promise<readonly (number | null)[]>>(async (ids) => ids.map(() => null))
  const detach = jest.fn(async (_ids: readonly string[]) => {})
  const send = jest.fn(async (port: MessagePort, _command: string, _windowId: number) => {
    ports.push(port)
    await PlainMessagePortRpc.create({
      commandMap: {
        'WorkerMemory.attach': attach,
        'WorkerMemory.detach': detach,
        'WorkerMemory.getCpuUsages': getCpuUsages,
        'WorkerMemory.getHeapUsages': getHeapUsages,
        'WorkerMemory.getTargets': getTargets,
      },
      messagePort: port,
    })
  })
  RendererWorker.registerMockRpc({
    'GetWindowId.getWindowId': () => 42,
    'SendMessagePortToMainProcess.sendMessagePortToMainProcess': send,
  })
  return { attach, detach, getCpuUsages, getHeapUsages, getTargets, send }
}

afterEach(() => {
  commandMap['Workers.dispose'](7)
  for (const port of ports) port.close()
  ports.length = 0
})

test('caches names and sessions while batching each refresh over one dedicated port', async () => {
  const { attach, getHeapUsages, send } = fixture()
  for (let i = 0; i < 3; i++) {
    expect(await WorkerMemory.getMemoryUsages(7)).toEqual({
      'Worker a': { cpu: null, usedSize: 1024 },
      'Worker b': { cpu: null, usedSize: 1024 },
    })
  }
  expect(send).toHaveBeenCalledTimes(1)
  expect(send).toHaveBeenCalledWith(expect.any(MessagePort), 'WorkerMemory.handleMessagePort', 42)
  expect(attach).toHaveBeenCalledTimes(1)
  expect(attach).toHaveBeenCalledWith(['a', 'b'])
  expect(getHeapUsages.mock.calls).toEqual(Array.from({ length: 3 }, () => [['session-a', 'session-b']]))
})

test('discovers added workers and releases removed workers without reevaluating survivors', async () => {
  const { attach, detach, getTargets } = fixture()
  await WorkerMemory.getMemoryUsages(7)
  getTargets.mockResolvedValue(['b', 'c'])
  expect(await WorkerMemory.getMemoryUsages(7)).toEqual({
    'Worker b': { cpu: null, usedSize: 1024 },
    'Worker c': { cpu: null, usedSize: 1024 },
  })
  expect(attach.mock.calls).toEqual([[['a', 'b']], [['c']]])
  expect(detach).toHaveBeenCalledWith(['session-a'])
})

test('coalesces overlapping requests and closes the port on disposal', async () => {
  const { getHeapUsages } = fixture()
  const started = Promise.withResolvers<void>()
  const pending = Promise.withResolvers<readonly { usedSize: number }[]>()
  getHeapUsages.mockImplementationOnce(() => {
    started.resolve()
    return pending.promise
  })
  const first = WorkerMemory.getMemoryUsages(7)
  expect(WorkerMemory.getMemoryUsages(7)).toBe(first)
  await started.promise
  const closed = new Promise((resolve) => ports[0].addEventListener('close', resolve, { once: true }))
  WorkerMemory.dispose(7)
  await expect(first).rejects.toThrow('closed')
  await closed
  pending.resolve([])
})

test('retries a failed session without disturbing successful measurements', async () => {
  const { attach, detach, getHeapUsages } = fixture()
  getHeapUsages.mockResolvedValueOnce([null, { usedSize: 0 }])
  expect(await WorkerMemory.getMemoryUsages(7)).toEqual({ 'Worker b': { cpu: null, usedSize: 0 } })
  expect(detach).toHaveBeenCalledWith(['session-a'])
  await WorkerMemory.getMemoryUsages(7)
  expect(attach.mock.calls).toEqual([[['a', 'b']], [['a']]])
})

test('closes failed connections and reconnects on the next refresh', async () => {
  const { getTargets, send } = fixture()
  getTargets.mockRejectedValueOnce(new Error('debugger detached'))
  await expect(WorkerMemory.getMemoryUsages(7)).rejects.toThrow('debugger detached')
  await WorkerMemory.getMemoryUsages(7)
  expect(send).toHaveBeenCalledTimes(2)
})

test('loads Electron memory before polling and disposes the timer and connection', async () => {
  const { send } = fixture()
  const worker = { id: 'a', name: 'Worker', runtimeName: 'Worker a' }
  RendererProcess.set(createMockRpc({ commandMap: { 'Workers.getWorkers': () => [worker] } }))
  commandMap['Workers.create'](7, '', 0, 0, 200, 100, PlatformType.Electron, '')
  await commandMap['Workers.loadContent'](7)
  expect(WorkersStates.get(7).newState.workers).toEqual([{ ...worker, cpu: null, memory: 1024 }])
  expect(send).toHaveBeenCalledTimes(1)
})

test('does not open a port or restart polling when disposed during worker discovery', async () => {
  const { send } = fixture()
  const workers = Promise.withResolvers<readonly unknown[]>()
  RendererProcess.set(createMockRpc({ commandMap: { 'Workers.getWorkers': () => workers.promise } }))
  commandMap['Workers.create'](7, '', 0, 0, 200, 100, PlatformType.Electron, '')
  const loading = commandMap['Workers.loadContent'](7)
  commandMap['Workers.dispose'](7)
  workers.resolve([])
  await loading
  expect(send).not.toHaveBeenCalled()
  expect(WorkersStates.get(7)).toBeUndefined()
})

test('cancels initialization before transferring the port if the view closes', async () => {
  const windowId = Promise.withResolvers<number>()
  const send = jest.fn()
  RendererWorker.registerMockRpc({
    'GetWindowId.getWindowId': () => windowId.promise,
    'SendMessagePortToMainProcess.sendMessagePortToMainProcess': send,
  })
  const request = WorkerMemory.getMemoryUsages(7)
  WorkerMemory.dispose(7)
  windowId.resolve(42)
  await expect(request).rejects.toThrow('closed')
  expect(send).not.toHaveBeenCalled()
})

test('ignores targets that disappear during attachment', async () => {
  const { attach } = fixture()
  attach.mockResolvedValueOnce([null] as any)
  expect(await WorkerMemory.getMemoryUsages(7)).toEqual(Object.create(null))
})

test('safely handles prototype property names as targets and worker names', async () => {
  const { attach, getTargets } = fixture()
  getTargets.mockResolvedValue(['__proto__', 'constructor'])
  attach.mockResolvedValue([
    { runtimeName: '__proto__', sessionId: 'session-proto', targetId: '__proto__' },
    { runtimeName: 'constructor', sessionId: 'session-constructor', targetId: 'constructor' },
  ])

  const usages = await WorkerMemory.getMemoryUsages(7)

  expect(Object.getPrototypeOf(usages)).toBeNull()
  expect(Object.hasOwn(usages, '__proto__')).toBe(true)
  expect(usages.__proto__).toEqual({ cpu: null, usedSize: 1024 })
  expect(usages.constructor).toEqual({ cpu: null, usedSize: 1024 })
})

test('keeps heap results aligned with sessions when target names are integer-like', async () => {
  const { attach, getHeapUsages, getTargets } = fixture()
  getTargets.mockResolvedValue(['10', '2'])
  attach.mockResolvedValue([
    { runtimeName: '10', sessionId: 'session-10', targetId: '10' },
    { runtimeName: '2', sessionId: 'session-2', targetId: '2' },
  ])
  getHeapUsages.mockResolvedValueOnce([{ usedSize: 10 }, { usedSize: 2 }])

  const usages = await WorkerMemory.getMemoryUsages(7)

  expect(getHeapUsages).toHaveBeenCalledWith(['session-10', 'session-2'])
  expect(usages['10']).toEqual({ cpu: null, usedSize: 10 })
  expect(usages['2']).toEqual({ cpu: null, usedSize: 2 })
})

test('reconnects after the main process closes the port', async () => {
  const { send } = fixture()
  await WorkerMemory.getMemoryUsages(7)
  ports[0].close()
  await new Promise((resolve) => setTimeout(resolve, 20))
  await WorkerMemory.getMemoryUsages(7)
  expect(send).toHaveBeenCalledTimes(2)
})

test('attributes CPU samples by session order and preserves heaps when an older host rejects CPU requests', async () => {
  const { getCpuUsages } = fixture()
  getCpuUsages.mockResolvedValueOnce([72.5, 0])
  expect(await WorkerMemory.getMemoryUsages(7)).toEqual({
    'Worker a': { cpu: 72.5, usedSize: 1024 },
    'Worker b': { cpu: 0, usedSize: 1024 },
  })
  getCpuUsages.mockRejectedValueOnce(new Error('Unknown worker memory command'))
  expect(await WorkerMemory.getMemoryUsages(7)).toEqual({
    'Worker a': { cpu: null, usedSize: 1024 },
    'Worker b': { cpu: null, usedSize: 1024 },
  })
})
