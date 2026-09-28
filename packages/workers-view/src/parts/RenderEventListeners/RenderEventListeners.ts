import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'

export const renderEventListeners = (): readonly any[] => [
  {
    name: DomEventListenerFunctions.Refresh,
    params: ['refresh'],
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
