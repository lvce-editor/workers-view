import { RendererWorker } from '@lvce-editor/rpc-registry'

const intervals = new Map<number, ReturnType<typeof setInterval>>()
const pending = new Set<number>()

const update = async (uid: number): Promise<void> => {
  if (pending.has(uid)) return
  pending.add(uid)
  try {
    await RendererWorker.invoke('WorkersView.update', uid)
  } catch (error) {
    console.error(error)
  } finally {
    pending.delete(uid)
  }
}

export const start = (uid: number): void => {
  if (intervals.has(uid)) return
  intervals.set(
    uid,
    setInterval(() => void update(uid), 1000),
  )
}

export const dispose = (uid: number): void => {
  const interval = intervals.get(uid)
  if (interval) clearInterval(interval)
  intervals.delete(uid)
  pending.delete(uid)
}
