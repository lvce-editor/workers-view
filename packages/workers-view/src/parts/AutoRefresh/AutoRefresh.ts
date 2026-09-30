import { RendererWorker } from '@lvce-editor/rpc-registry'

const intervals: Record<number, ReturnType<typeof setInterval>> = Object.create(null) as Record<number, ReturnType<typeof setInterval>>
const pending: number[] = []

const update = async (uid: number): Promise<void> => {
  if (pending.includes(uid)) return
  pending.push(uid)
  try {
    await RendererWorker.invoke('Viewlet.executeViewletCommand', uid, 'autoRefresh')
  } catch (error) {
    console.error(error)
  } finally {
    const pendingIndex = pending.indexOf(uid)
    if (pendingIndex >= 0) pending.splice(pendingIndex, 1)
  }
}

export const start = (uid: number): void => {
  if (Object.hasOwn(intervals, uid)) return
  intervals[uid] = setInterval(() => void update(uid), 1000)
}

export const dispose = (uid: number): void => {
  const interval = intervals[uid]
  if (Object.hasOwn(intervals, uid)) clearInterval(interval)
  delete intervals[uid]
  const pendingIndex = pending.indexOf(uid)
  if (pendingIndex >= 0) pending.splice(pendingIndex, 1)
}
