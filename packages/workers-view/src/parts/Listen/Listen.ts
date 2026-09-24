import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as InitializeRendererWorker from '../InitializeRendererWorker/InitializeRendererWorker.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const listen = async (): Promise<void> => {
  WorkersStates.registerCommands(CommandMap.commandMap)
  await InitializeRendererWorker.initializeRendererWorker()
}
