import { LazyTransferMessagePortRpcParent } from '@lvce-editor/rpc'
import { MainProcess, RendererWorker } from '@lvce-editor/rpc-registry'

export const initializeMainProcess = async (): Promise<void> => {
  const rpc = await LazyTransferMessagePortRpcParent.create({
    commandMap: {},
    send: async (port: MessagePort) => {
      await RendererWorker.invokeAndTransfer(
        'SendMessagePortToMainProcess.sendMessagePortToMainProcess',
        port,
        'HandleElectronMessagePort.handleElectronMessagePort',
        0,
      )
    },
  })
  MainProcess.set(rpc)
}
