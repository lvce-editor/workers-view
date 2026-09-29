import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'

export const renderEventListeners = (): readonly any[] => [
  {
    name: DomEventListenerFunctions.SelectWorker,
    params: ['selectWorker', 'event.currentTarget.dataset.workerId'],
    preventDefault: true,
  },
  {
    name: DomEventListenerFunctions.NavigateWorkers,
    params: ['navigateWorkers', 'event.key'],
    preventDefault: false,
  },
  {
    name: DomEventListenerFunctions.FocusWorkers,
    params: ['focusWorkers'],
    preventDefault: true,
  },
  {
    name: DomEventListenerFunctions.ShowWorkerContextMenu,
    params: ['showWorkerContextMenu', 'event.currentTarget.dataset.workerId'],
    preventDefault: true,
  },
  {
    name: DomEventListenerFunctions.TerminateWorker,
    params: ['terminateWorker', 'event.currentTarget.dataset.workerId'],
    preventDefault: true,
  },
  {
    name: DomEventListenerFunctions.SortByName,
    params: ['sortByName'],
    preventDefault: true,
  },
  {
    name: DomEventListenerFunctions.SortByMemory,
    params: ['sortByMemory'],
    preventDefault: true,
  },
]
