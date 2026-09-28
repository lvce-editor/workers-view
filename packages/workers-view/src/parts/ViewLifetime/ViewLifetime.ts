const controllers = new Map<number, AbortController>()

export const dispose = (uid: number): void => {
  controllers.get(uid)?.abort()
  controllers.delete(uid)
}

export const create = (uid: number): void => {
  dispose(uid)
  controllers.set(uid, new AbortController())
}

export const get = (uid: number): AbortSignal | undefined => controllers.get(uid)?.signal
