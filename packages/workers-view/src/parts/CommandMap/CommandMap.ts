import * as Create from '../Create/Create.ts'
import * as Diff2 from '../Diff2/Diff2.ts'
import * as Dispose from '../Dispose/Dispose.ts'
import * as HandleMessagePort from '../HandleMessagePort/HandleMessagePort.ts'
import * as LoadContent from '../LoadContent/LoadContent.ts'
import * as RefreshWorkers from '../RefreshWorkers/RefreshWorkers.ts'
import * as Render2 from '../Render2/Render2.ts'
import * as RenderEventListeners from '../RenderEventListeners/RenderEventListeners.ts'
import * as Resize from '../Resize/Resize.ts'
import * as SetError from '../SetError/SetError.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

const handleDirectMessagePort = (port: MessagePort, setAsRendererProcess?: boolean): Promise<void> =>
  HandleMessagePort.handleMessagePort(port, commandMap, setAsRendererProcess)

export const commandMap = {
  'Workers.create': Create.create,
  'Workers.diff2': Diff2.diff2,
  'Workers.dispose': Dispose.dispose,
  'Workers.getCommandIds': WorkersStates.getCommandIds,
  'Workers.handleMessagePort': handleDirectMessagePort,
  'Workers.loadContent': WorkersStates.wrapCommand(LoadContent.loadContent),
  'Workers.refresh': WorkersStates.wrapCommand(RefreshWorkers.refresh),
  'Workers.render2': Render2.render2,
  'Workers.renderEventListeners': RenderEventListeners.renderEventListeners,
  'Workers.resize': WorkersStates.wrapCommand(Resize.resize),
  'Workers.setError': WorkersStates.wrapCommand(SetError.setError),
}
