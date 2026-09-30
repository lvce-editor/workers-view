import { PlatformType } from '@lvce-editor/constants'
import type { TrackedWorker, WorkersState } from '../WorkersState/WorkersState.ts'
import * as SortWorkers from '../SortWorkers/SortWorkers.ts'
import * as ToError from '../ToError/ToError.ts'

export interface RefreshServices {
  readonly getMemoryUsages: () => Promise<Readonly<Record<string, { readonly usedSize: number }>>>
  readonly getWorkers: () => Promise<readonly TrackedWorker[]>
}

export const refresh = async (state: WorkersState, services: RefreshServices): Promise<WorkersState> => {
  const { platform, sortColumn, sortDirection } = state
  let workers: readonly TrackedWorker[]
  try {
    workers = await services.getWorkers()
  } catch (error) {
    return { ...state, error: ToError.toError(error), loaded: true }
  }
  let usages: Readonly<Record<string, { readonly usedSize: number }>> = Object.create(null) as Record<string, { readonly usedSize: number }>
  if (platform === PlatformType.Electron) {
    try {
      usages = await services.getMemoryUsages()
    } catch {
      // A closed debugger connection can be retried on the next refresh.
    }
  }
  const displayedWorkers = workers.map((worker) => {
    const usage = Object.hasOwn(usages, worker.runtimeName) ? usages[worker.runtimeName] : undefined
    const memory = usage && Number.isFinite(usage.usedSize) ? usage.usedSize : null
    return { ...worker, memory }
  })
  return { ...state, error: undefined, loaded: true, workers: SortWorkers.sortWorkers(displayedWorkers, sortColumn, sortDirection) }
}
