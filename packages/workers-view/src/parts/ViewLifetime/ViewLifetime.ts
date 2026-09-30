const controllers: Record<number, AbortController> = Object.create(null) as Record<number, AbortController>

export const dispose = (uid: number): void => {
  controllers[uid]?.abort()
  delete controllers[uid]
}

export const create = (uid: number): void => {
  dispose(uid)
  controllers[uid] = new AbortController()
}

export const get = (uid: number): AbortSignal | undefined => controllers[uid]?.signal
