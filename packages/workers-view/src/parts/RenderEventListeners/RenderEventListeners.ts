import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'

export const renderEventListeners = (): readonly any[] => [
  {
    name: DomEventListenerFunctions.BlurWorkers,
    params: ['handleBlur'],
    preventDefault: false,
  },
  {
    name: DomEventListenerFunctions.FocusWorkers,
    params: ['focusWorkers'],
    preventDefault: true,
  },
  {
    name: DomEventListenerFunctions.ShowWorkerContextMenu,
    params: ['showWorkerContextMenu', 'event.target.dataset.contextMenuWorkerId', 'event.clientX', 'event.clientY'],
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
  {
    name: DomEventListenerFunctions.SortHeaderByKeyboard,
    params: ['sortHeaderByKeyboard', 'event.key', 'event.currentTarget.dataset.sortColumn'],
    preventDefault: true,
    stopPropagation: true,
  },
  {
    name: DomEventListenerFunctions.SelectWorker,
    params: ['selectWorker', 'event.currentTarget.dataset.workerId'],
    preventDefault: true,
    stopPropagation: true,
  },
  {
    name: DomEventListenerFunctions.ToggleWorker,
    params: ['toggleWorker', 'event.currentTarget.dataset.workerId'],
    preventDefault: true,
    stopPropagation: true,
  },
]
