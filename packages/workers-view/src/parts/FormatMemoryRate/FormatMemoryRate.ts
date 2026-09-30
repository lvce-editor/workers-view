const units = ['B/s', 'kB/s', 'MB/s', 'GB/s']

export const formatMemoryRate = (bytesPerSecond: number): string => {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond < 0) return 'Unavailable'
  let value = bytesPerSecond
  let unitIndex = 0
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000
    unitIndex++
  }
  const formatted = unitIndex === 0 ? String(Math.round(value)) : value.toFixed(1)
  return `${formatted} ${units[unitIndex]}`
}
