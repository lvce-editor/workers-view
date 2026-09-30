import type { MemorySample } from '../WorkersState/WorkersState.ts'

export const windowMs = 60_000

export const getMemoryTrend = (
  samples: readonly MemorySample[],
): { readonly direction: 'growing' | 'shrinking'; readonly bytesPerSecond: number } | undefined => {
  if (samples.length < 2) return undefined
  const first = samples[0]
  const last = samples.at(-1)
  if (!first || !last) return undefined
  const elapsed = last.timestamp - first.timestamp
  const difference = last.memory - first.memory
  if (elapsed <= 0 || difference === 0) return undefined
  return {
    bytesPerSecond: Math.abs(difference) / (elapsed / 1000),
    direction: difference > 0 ? 'growing' : 'shrinking',
  }
}
