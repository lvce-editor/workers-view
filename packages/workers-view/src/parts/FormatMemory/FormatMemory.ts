import prettyBytes from 'pretty-bytes'

export const formatMemory = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unavailable'
  if (bytes < 1024) return prettyBytes(Math.round(bytes), { binary: true, maximumFractionDigits: 0 })
  return prettyBytes(bytes, { binary: true, minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
