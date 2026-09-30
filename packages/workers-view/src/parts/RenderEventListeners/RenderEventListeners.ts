import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'

export const renderEventListeners = (): readonly any[] => [
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
    name: DomEventListenerFunctions.TableClick,
    params: ['handleTableClick', 'event.clientX', 'event.clientY', 'event.currentTarget.clientWidth'],
    preventDefault: true,
  },
  {
    name: DomEventListenerFunctions.ScrollWorkers,
    params: ['scrollWorkers', 'event.currentTarget.scrollTop'],
    preventDefault: false,
  },
]
