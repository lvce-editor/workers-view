import { MainProcess, RendererWorker } from '@lvce-editor/rpc-registry'
import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as InitializeMainProcess from '../InitializeMainProcess/InitializeMainProcess.ts'
import * as Refresh from '../Refresh/Refresh.ts'
import * as RendererProcess from '../RendererProcess/RendererProcess.ts'

const mainProcessState = { initialized: false }

const getMemoryUsage = async (runtimeName: string): Promise<{ readonly usedSize: number } | null> => {
  if (!mainProcessState.initialized) {
    await InitializeMainProcess.initializeMainProcess()
    mainProcessState.initialized = true
  }
  const windowId = await RendererWorker.getWindowId()
  return MainProcess.invoke('ElectronDeveloper.getWorkerMemoryUsage', windowId, runtimeName)
}

export const refresh = (state: WorkersState): Promise<WorkersState> =>
  Refresh.refresh(state, {
    getMemoryUsage,
    getWorkers: () => RendererProcess.invoke('Workers.getWorkers'),
  })
