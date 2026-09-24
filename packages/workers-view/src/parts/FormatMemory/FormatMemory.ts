export const formatMemory = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unavailable'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}
