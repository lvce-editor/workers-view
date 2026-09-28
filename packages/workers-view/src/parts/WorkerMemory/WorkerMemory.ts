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
  pending?: Promise<ReadonlyMap<string, Usage>> | undefined
  readonly port: MessagePort
  readonly remotePort: MessagePort
  rpc?: Promise<Rpc>
  readonly sessions: Map<string, Session>
}

const connections = new Map<number, Connection>()

export const dispose = (uid: number): void => {
  const connection = connections.get(uid)
  if (!connection) return
  connections.delete(uid)
  connection.controller.abort()
  connection.port.close()
  connection.remotePort.close()
  connection.sessions.clear()
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
    sessions: new Map(),
  }
  connections.set(uid, connection)
  port1.addEventListener(
    'close',
    () => {
      if (connections.get(uid) === connection) dispose(uid)
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
  const targets = new Set(targetIds)
  const removed: string[] = []
  for (const [targetId, session] of connection.sessions) {
    if (targets.has(targetId)) {
      continue
    }

    connection.sessions.delete(targetId)
    removed.push(session.sessionId)
  }
  if (removed.length > 0) await invoke('WorkerMemory.detach', removed)
  const added = targetIds.filter((targetId) => !connection.sessions.has(targetId))
  if (added.length > 0) {
    const sessions = await invoke<readonly (Session | null)[]>('WorkerMemory.attach', added)
    for (const session of sessions) {
      if (session) connection.sessions.set(session.targetId, session)
    }
  }
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
const query = async (connection: Connection): Promise<ReadonlyMap<string, Usage>> => {
  const rpc = await waitForResult(connection.controller.signal, connection.rpc!)
  const invoke = <T>(method: string, ...args: readonly unknown[]): Promise<T> => {
    connection.controller.signal.throwIfAborted()
    return waitForResult(connection.controller.signal, rpc.invoke(method, ...args))
  }
  await synchronizeSessions(connection, invoke)
  const sessions = connection.sessions.values().toArray()
  const usages = await invoke<readonly (Usage | null)[]>(
    'WorkerMemory.getHeapUsages',
    sessions.map((session) => session.sessionId),
  )
  const result = new Map<string, Usage>()
  const failed: string[] = []
  for (const [index, session] of sessions.entries()) {
    const usage = usages[index]
    if (usage && Number.isFinite(usage.usedSize)) {
      result.set(session.runtimeName, usage)
    } else {
      connection.sessions.delete(session.targetId)
      failed.push(session.sessionId)
    }
  }
  if (failed.length > 0) await invoke('WorkerMemory.detach', failed)
  return result
}

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
const runQuery = async (uid: number, connection: Connection): Promise<ReadonlyMap<string, Usage>> => {
  try {
    return await query(connection)
  } catch (error) {
    if (connections.get(uid) === connection) dispose(uid)
    throw error
  } finally {
    connection.pending = undefined
  }
}

export const getMemoryUsages = (uid: number): Promise<ReadonlyMap<string, Usage>> => {
  const connection = connections.get(uid) || create(uid)
  connection.pending ||= runQuery(uid, connection)
  return connection.pending
}
