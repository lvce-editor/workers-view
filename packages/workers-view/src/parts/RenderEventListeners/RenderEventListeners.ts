import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'

export const renderEventListeners = (): readonly any[] => [
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
