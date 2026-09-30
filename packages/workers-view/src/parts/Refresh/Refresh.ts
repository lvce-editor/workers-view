import { PlatformType } from '@lvce-editor/constants'
import type { MemorySample, TrackedWorker, WorkersState } from '../WorkersState/WorkersState.ts'
import * as GetMemoryTrend from '../GetMemoryTrend/GetMemoryTrend.ts'
import * as SortWorkers from '../SortWorkers/SortWorkers.ts'
import * as ToError from '../ToError/ToError.ts'

export interface RefreshServices {
  readonly getMemoryUsages: () => Promise<Readonly<Record<string, { readonly usedSize: number }>>>
  readonly getShowMemoryUsageTrend: () => Promise<boolean>
  readonly getWorkers: () => Promise<readonly TrackedWorker[]>
  readonly now: () => number
}

export const refresh = async (state: WorkersState, services: RefreshServices): Promise<WorkersState> => {
  const { memorySamples: previousSamples = [], platform, sortColumn, sortDirection } = state
  let workers: readonly TrackedWorker[]
  try {
    workers = await services.getWorkers()
  } catch (error) {
    return { ...state, error: ToError.toError(error), loaded: true }
  }
  let usages: Readonly<Record<string, { readonly usedSize: number }>> = Object.create(null) as Record<string, { readonly usedSize: number }>
  let showTrend = false
  if (platform === PlatformType.Electron) {
    try {
      usages = await services.getMemoryUsages()
    } catch {
      // A closed debugger connection can be retried on the next refresh.
    }
    try {
      showTrend = await services.getShowMemoryUsageTrend()
    } catch {
      // Missing preference support in an older host keeps trends hidden.
    }
  }
  const timestamp = services.now()
  const workerIds = new Set(workers.map(({ id }) => id))
  const samplesByWorker = new Map<string, MemorySample[]>()
  if (showTrend) {
    for (const sample of previousSamples) {
      if (!workerIds.has(sample.id) || sample.timestamp > timestamp || timestamp - sample.timestamp > GetMemoryTrend.windowMs) continue
      const samples = samplesByWorker.get(sample.id) || []
      samples.push(sample)
      samplesByWorker.set(sample.id, samples)
    }
  }
  const displayedWorkers = workers.map((worker) => {
    const usage = Object.hasOwn(usages, worker.runtimeName) ? usages[worker.runtimeName] : undefined
    const memory = usage && Number.isFinite(usage.usedSize) ? usage.usedSize : null
    if (memory === null) {
      samplesByWorker.delete(worker.id)
      return { ...worker, memory }
    }
    if (!showTrend) {
      return { ...worker, memory }
    }
    const samples = samplesByWorker.get(worker.id) || []
    const latestSample = samples.at(-1)
    if (latestSample?.timestamp === timestamp) {
      samples[samples.length - 1] = { id: worker.id, memory, timestamp }
    } else {
      samples.push({ id: worker.id, memory, timestamp })
    }
    if (samples.length > 61) samples.shift()
    samplesByWorker.set(worker.id, samples)
    const memoryTrend = GetMemoryTrend.getMemoryTrend(samples)
    return { ...worker, memory, ...(memoryTrend && { memoryTrend }) }
  })
  const memorySamples: MemorySample[] = []
  for (const samples of samplesByWorker.values()) {
    memorySamples.push(...samples)
  }
  return {
    ...state,
    error: undefined,
    loaded: true,
    memorySamples,
    workers: SortWorkers.sortWorkers(displayedWorkers, sortColumn, sortDirection),
  }
}
