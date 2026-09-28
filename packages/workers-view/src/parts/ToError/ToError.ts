export const toError = (error: unknown): Error => {
  if (error instanceof Error) return error
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return new Error(error.message)
  }
  return new Error(String(error))
}
