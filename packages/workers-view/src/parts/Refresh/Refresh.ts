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
  const memorySamples: MemorySample[] = showTrend
    ? previousSamples.filter(
        (sample) => workerIds.has(sample.id) && sample.timestamp <= timestamp && timestamp - sample.timestamp <= GetMemoryTrend.windowMs,
      )
    : []
  const displayedWorkers = workers.map((worker) => {
    const usage = Object.hasOwn(usages, worker.runtimeName) ? usages[worker.runtimeName] : undefined
    const memory = usage && Number.isFinite(usage.usedSize) ? usage.usedSize : null
    if (memory === null || !showTrend) {
      return { ...worker, memory }
    }
    let existingSampleIndex = -1
    for (const [index, sample] of memorySamples.entries()) {
      if (sample.id === worker.id && sample.timestamp === timestamp) {
        existingSampleIndex = index
        break
      }
    }
    if (existingSampleIndex === -1) {
      memorySamples.push({ id: worker.id, memory, timestamp })
    } else {
      memorySamples[existingSampleIndex] = { id: worker.id, memory, timestamp }
    }
    const samples = memorySamples.filter((sample) => sample.id === worker.id)
    const memoryTrend = GetMemoryTrend.getMemoryTrend(samples)
    return { ...worker, memory, ...(memoryTrend && { memoryTrend }) }
  })
  const currentSampleIds = new Set<string>()
  for (const worker of displayedWorkers) {
    if (worker.memory !== null) {
      currentSampleIds.add(worker.id)
    }
  }
  const retainedSamples = memorySamples.filter((sample) => currentSampleIds.has(sample.id)).slice(-workers.length * 61)
  return {
    ...state,
    error: undefined,
    loaded: true,
    memorySamples: retainedSamples,
    workers: SortWorkers.sortWorkers(displayedWorkers, sortColumn, sortDirection),
  }
}
