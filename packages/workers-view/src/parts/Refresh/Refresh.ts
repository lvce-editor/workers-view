import { PlatformType } from '@lvce-editor/constants'
import type { DisplayedWorker, TrackedWorker, WorkersState } from '../WorkersState/WorkersState.ts'
import * as ToError from '../ToError/ToError.ts'

export interface RefreshServices {
  readonly getMemoryUsage: (runtimeName: string) => Promise<{ readonly usedSize: number } | null>
  readonly getWorkers: () => Promise<readonly TrackedWorker[]>
}

export const refresh = async (state: WorkersState, services: RefreshServices): Promise<WorkersState> => {
  const { platform } = state
  let workers: readonly TrackedWorker[]
  try {
    workers = await services.getWorkers()
  } catch (error) {
    return { ...state, error: ToError.toError(error), loaded: true }
  }
  let displayedWorkers: readonly DisplayedWorker[] = workers.map((worker) => ({ ...worker, memory: null }))
  if (platform === PlatformType.Electron) {
    const measuredWorkers: DisplayedWorker[] = []
    for (const worker of workers) {
      let memory: number | null = null
      try {
        const usage = await services.getMemoryUsage(worker.runtimeName)
        if (usage && Number.isFinite(usage.usedSize)) {
          memory = usage.usedSize
        }
      } catch {
        // Workers can stop while a refresh takes its measurement.
      }
      measuredWorkers.push({ ...worker, memory })
    }
    displayedWorkers = measuredWorkers
  }
  return { ...state, error: undefined, loaded: true, workers: displayedWorkers }
}
