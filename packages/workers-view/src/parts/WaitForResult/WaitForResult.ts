// Event subscription and promise observation require their mutable platform types.
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export const waitForResult = async <T>(signal: AbortSignal, promise: Promise<T>): Promise<T> => {
  const result = Promise.withResolvers<T>()
  const abort = (): void => result.reject(new Error('Worker memory connection is closed'))
  signal.addEventListener('abort', abort, { once: true })
  // Remove the listener after every request so an open view cannot accumulate
  // cancellation callbacks with each refresh.
  // Both outcomes must be observed even if cancellation wins.

  void promise.then(result.resolve, result.reject)
  if (signal.aborted) abort()
  try {
    return await result.promise
  } finally {
    signal.removeEventListener('abort', abort)
  }
}
