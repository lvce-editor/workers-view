import { PlatformType } from '@lvce-editor/constants'
import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as SortByMemory from '../SortByMemory/SortByMemory.ts'
import * as SortByName from '../SortByName/SortByName.ts'
import * as ToggleSort from '../SortWorkers/ToggleSort.ts'

export const sortHeaderByKeyboard = (state: WorkersState, key: string, sortColumn: string): WorkersState => {
  if (key !== 'Enter' && key !== ' ') {
    return state
  }
  if (sortColumn === 'name') {
    return SortByName.sortByName(state)
  }
  const { platform } = state
  if (sortColumn === 'cpu' && platform === PlatformType.Electron) return ToggleSort.toggleSort(state, 'cpu')
  if (sortColumn === 'memory' && platform === PlatformType.Electron) {
    return SortByMemory.sortByMemory(state)
  }
  return state
}
