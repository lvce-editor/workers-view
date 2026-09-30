import { PlatformType } from '@lvce-editor/constants'
import { LazyTransferMessagePortRpcParent } from '@lvce-editor/rpc'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const takeHeapSnapshot = async (state: WorkersState, workerId: string): Promise<WorkersState> => {
  const { platform, workers } = state
  const worker = workers.find((item) => item.id === workerId)
  if (!worker || platform !== PlatformType.Electron) return state
  const windowId = await RendererWorker.getWindowId()
  const rpc = await LazyTransferMessagePortRpcParent.create({
    commandMap: {},
    async send(port) {
      await RendererWorker.invokeAndTransfer(
        'SendMessagePortToMainProcess.sendMessagePortToMainProcess',
        port,
        'HandleElectronMessagePort.handleElectronMessagePort',
        0,
      )
    },
  })
  try {
    const uri = await rpc.invoke('ElectronDeveloper.takeWorkerHeapSnapshot', windowId, worker.name)
    await RendererWorker.invoke('Main.openUri', uri)
  } finally {
    await rpc.dispose()
  }
  return state
}
