import { PlatformType } from '@lvce-editor/constants'
import type { TrackedWorker, WorkersState } from '../WorkersState/WorkersState.ts'
import * as SortWorkers from '../SortWorkers/SortWorkers.ts'
import * as ToError from '../ToError/ToError.ts'

export interface RefreshServices {
  readonly getMemoryUsages: () => Promise<ReadonlyMap<string, { readonly usedSize: number }>>
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
  let usages: ReadonlyMap<string, { readonly usedSize: number }> = new Map()
  if (platform === PlatformType.Electron) {
    try {
      usages = await services.getMemoryUsages()
    } catch {
      // A closed debugger connection can be retried on the next refresh.
    }
  }
  const displayedWorkers = workers.map((worker) => {
    const usage = usages.get(worker.runtimeName)
    const memory = usage && Number.isFinite(usage.usedSize) ? usage.usedSize : null
    return { ...worker, memory }
  })
  return { ...state, error: undefined, loaded: true, workers: SortWorkers.sortWorkers(displayedWorkers, sortColumn, sortDirection) }
}
