import type { Rpc } from '@lvce-editor/rpc'
import { PlainMessagePortRpc } from '@lvce-editor/rpc'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import { waitForResult } from '../WaitForResult/WaitForResult.ts'

interface Session {
  readonly runtimeName: string
  readonly sessionId: string
  readonly targetId: string
}
interface Usage {
  readonly usedSize: number
}
interface Connection {
  readonly controller: AbortController
  pending?: Promise<Readonly<Record<string, Usage>>> | undefined
  readonly port: MessagePort
  readonly remotePort: MessagePort
  rpc?: Promise<Rpc>
  readonly sessions: Record<string, Session>
  readonly sessionOrder: string[]
}

const createDictionary = <T>(): Record<string, T> => Object.create(null) as Record<string, T>

const connections: Record<number, Connection> = createDictionary()

export const dispose = (uid: number): void => {
  const connection = connections[uid]
  if (!connection) return
  delete connections[uid]
  connection.controller.abort()
  connection.port.close()
  connection.remotePort.close()
  connection.sessionOrder.length = 0
}

// The connection owns mutable port and session state.
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
const connect = async (connection: Connection): Promise<Rpc> => {
  const rpc = await PlainMessagePortRpc.create({ commandMap: {}, messagePort: connection.port })
  const windowId = await RendererWorker.getWindowId()
  if (connection.controller.signal.aborted) throw new Error('Worker memory connection is closed')
  await RendererWorker.invokeAndTransfer(
    'SendMessagePortToMainProcess.sendMessagePortToMainProcess',
    connection.remotePort,
    'WorkerMemory.handleMessagePort',
    windowId,
  )
  return rpc
}

const create = (uid: number): Connection => {
  const { port1, port2 } = new MessageChannel()
  const connection: Connection = {
    controller: new AbortController(),
    port: port1,
    remotePort: port2,
    sessions: createDictionary(),
    sessionOrder: [],
  }
  connections[uid] = connection
  port1.addEventListener(
    'close',
    () => {
      if (connections[uid] === connection) dispose(uid)
    },
    { once: true },
  )
  connection.rpc = connect(connection)
  return connection
}

type Invoke = <T>(method: string, ...args: readonly unknown[]) => Promise<T>

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
const synchronizeSessions = async (connection: Connection, invoke: Invoke): Promise<void> => {
  const targetIds = await invoke<readonly string[]>('WorkerMemory.getTargets')
  const targets = createDictionary<boolean>()
  for (const targetId of targetIds) targets[targetId] = true
  const removed: string[] = []
  for (const targetId of connection.sessionOrder) {
    const session = connection.sessions[targetId]
    if (Object.hasOwn(targets, targetId)) {
      continue
    }

    delete connection.sessions[targetId]
    removed.push(session.sessionId)
  }
  const retained = connection.sessionOrder.filter((targetId) => Object.hasOwn(targets, targetId))
  connection.sessionOrder.splice(0, connection.sessionOrder.length, ...retained)
  if (removed.length > 0) await invoke('WorkerMemory.detach', removed)
  const added = targetIds.filter((targetId) => !Object.hasOwn(connection.sessions, targetId))
  if (added.length > 0) {
    const sessions = await invoke<readonly (Session | null)[]>('WorkerMemory.attach', added)
    for (const session of sessions) {
      if (session) {
        if (!Object.hasOwn(connection.sessions, session.targetId)) connection.sessionOrder.push(session.targetId)
        connection.sessions[session.targetId] = session
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
const query = async (connection: Connection): Promise<Readonly<Record<string, Usage>>> => {
  const rpc = await waitForResult(connection.controller.signal, connection.rpc!)
  const invoke = <T>(method: string, ...args: readonly unknown[]): Promise<T> => {
    connection.controller.signal.throwIfAborted()
    return waitForResult(connection.controller.signal, rpc.invoke(method, ...args))
  }
  await synchronizeSessions(connection, invoke)
  const sessions = connection.sessionOrder.map((targetId) => connection.sessions[targetId])
  const usages = await invoke<readonly (Usage | null)[]>(
    'WorkerMemory.getHeapUsages',
    sessions.map((session) => session.sessionId),
  )
  const result = createDictionary<Usage>()
  const failed: string[] = []
  for (const [index, session] of sessions.entries()) {
    const usage = usages[index]
    if (usage && Number.isFinite(usage.usedSize)) {
      result[session.runtimeName] = usage
    } else {
      delete connection.sessions[session.targetId]
      connection.sessionOrder.splice(connection.sessionOrder.indexOf(session.targetId), 1)
      failed.push(session.sessionId)
    }
  }
  if (failed.length > 0) await invoke('WorkerMemory.detach', failed)
  return result
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
const runQuery = async (uid: number, connection: Connection): Promise<Readonly<Record<string, Usage>>> => {
  try {
    return await query(connection)
  } catch (error) {
    if (connections[uid] === connection) dispose(uid)
    throw error
  } finally {
    connection.pending = undefined
  }
}

export const getMemoryUsages = (uid: number): Promise<Readonly<Record<string, Usage>>> => {
  const connection = connections[uid] || create(uid)
  connection.pending ||= runQuery(uid, connection)
  return connection.pending
}
