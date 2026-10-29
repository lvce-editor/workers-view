import { RendererWorker } from '@lvce-editor/rpc-registry'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const listen = async (): Promise<void> => {
  WorkersStates.registerCommands(CommandMap.commandMap)
  await RendererWorker.initializeRendererWorkerForWorker(CommandMap.commandMap)
}
