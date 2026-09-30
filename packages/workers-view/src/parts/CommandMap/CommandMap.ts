import * as AutoRefreshWorkers from '../AutoRefreshWorkers/AutoRefreshWorkers.ts'
import * as Create from '../Create/Create.ts'
import * as Diff2 from '../Diff2/Diff2.ts'
import * as Dispose from '../Dispose/Dispose.ts'
import * as FocusWorkers from '../FocusWorkers/FocusWorkers.ts'
import * as GetComponentState from '../GetComponentState/GetComponentState.ts'
import * as GetMenuEntries from '../GetMenuEntries/GetMenuEntries.ts'
import * as GetMenuEntryIds from '../GetMenuEntryIds/GetMenuEntryIds.ts'
import * as HandleBlur from '../HandleBlur/HandleBlur.ts'
import * as HandleMessagePort from '../HandleMessagePort/HandleMessagePort.ts'
import * as HandleTableClick from '../HandleTableClick/HandleTableClick.ts'
import * as LoadContent from '../LoadContent/LoadContent.ts'
import * as NavigateWorkers from '../NavigateWorkers/NavigateWorkers.ts'
import * as RefreshWorkers from '../RefreshWorkers/RefreshWorkers.ts'
import * as Render2 from '../Render2/Render2.ts'
import * as RenderEventListeners from '../RenderEventListeners/RenderEventListeners.ts'
import * as Resize from '../Resize/Resize.ts'
import * as ScrollWorkers from '../ScrollWorkers/ScrollWorkers.ts'
import * as SelectWorker from '../SelectWorker/SelectWorker.ts'
import * as SetComponentState from '../SetComponentState/SetComponentState.ts'
import * as SetError from '../SetError/SetError.ts'
import * as ShowWorkerContextMenu from '../ShowWorkerContextMenu/ShowWorkerContextMenu.ts'
import * as SortByMemory from '../SortByMemory/SortByMemory.ts'
import * as SortByName from '../SortByName/SortByName.ts'
import * as SortHeaderByKeyboard from '../SortHeaderByKeyboard/SortHeaderByKeyboard.ts'
import * as TakeHeapSnapshot from '../TakeHeapSnapshot/TakeHeapSnapshot.ts'
import * as TerminateWorker from '../TerminateWorker/TerminateWorker.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

const handleDirectMessagePort = (port: MessagePort, setAsRendererProcess?: boolean): Promise<void> =>
  HandleMessagePort.handleMessagePort(port, commandMap, setAsRendererProcess)

export const commandMap = {
  'Workers.autoRefresh': WorkersStates.wrapCommand(AutoRefreshWorkers.autoRefresh),
  'Workers.create': Create.create,
  'Workers.diff2': Diff2.diff2,
  'Workers.dispose': Dispose.dispose,
  'Workers.focusWorkers': WorkersStates.wrapCommand(FocusWorkers.focusWorkers),
  'Workers.getCommandIds': WorkersStates.getCommandIds,
  'Workers.getComponentState': GetComponentState.getComponentState,
  'Workers.getMenuEntries': GetMenuEntries.getMenuEntriesForUid,
  'Workers.getMenuEntryIds': GetMenuEntryIds.getMenuEntryIds,
  'Workers.handleBlur': WorkersStates.wrapCommand(HandleBlur.handleBlur),
  'Workers.handleMessagePort': handleDirectMessagePort,
  'Workers.handleTableClick': WorkersStates.wrapCommand(HandleTableClick.handleTableClick),
  'Workers.loadContent': WorkersStates.wrapCommand(LoadContent.loadContent),
  'Workers.navigateWorkers': WorkersStates.wrapCommand(NavigateWorkers.navigateWorkers),
  'Workers.refresh': WorkersStates.wrapCommand(RefreshWorkers.refresh),
  'Workers.render2': Render2.render2,
  'Workers.renderEventListeners': RenderEventListeners.renderEventListeners,
  'Workers.resize': WorkersStates.wrapCommand(Resize.resize),
  'Workers.scrollWorkers': WorkersStates.wrapCommand(ScrollWorkers.scrollWorkers),
  'Workers.selectWorker': WorkersStates.wrapCommand(SelectWorker.selectWorker),
  'Workers.setComponentState': SetComponentState.setComponentState,
  'Workers.setError': WorkersStates.wrapCommand(SetError.setError),
  'Workers.showWorkerContextMenu': WorkersStates.wrapCommand(ShowWorkerContextMenu.showWorkerContextMenu),
  'Workers.sortByMemory': WorkersStates.wrapCommand(SortByMemory.sortByMemory),
  'Workers.sortByName': WorkersStates.wrapCommand(SortByName.sortByName),
  'Workers.sortHeaderByKeyboard': WorkersStates.wrapCommand(SortHeaderByKeyboard.sortHeaderByKeyboard),
  'Workers.takeHeapSnapshot': WorkersStates.wrapCommand(TakeHeapSnapshot.takeHeapSnapshot),
  'Workers.terminateWorker': WorkersStates.wrapCommand(TerminateWorker.terminateWorker),
}
