import { PlatformType } from '@lvce-editor/constants'
import { MainProcess, RendererWorker } from '@lvce-editor/rpc-registry'
import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const takeHeapSnapshot = async (state: WorkersState, workerId: string): Promise<WorkersState> => {
  const { platform, workers } = state
  const worker = workers.find((item) => item.id === workerId)
  if (!worker || platform !== PlatformType.Electron) return state
  const windowId = await RendererWorker.getWindowId()
  const uri = await MainProcess.invoke('ElectronDeveloper.takeWorkerHeapSnapshot', windowId, worker.runtimeName)
  await RendererWorker.invoke('Main.openUri', uri)
  return state
}
