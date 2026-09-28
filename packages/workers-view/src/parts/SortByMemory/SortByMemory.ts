import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as ToggleSort from '../SortWorkers/ToggleSort.ts'

export const sortByMemory = (state: WorkersState): WorkersState => ToggleSort.toggleSort(state, 'memory')
