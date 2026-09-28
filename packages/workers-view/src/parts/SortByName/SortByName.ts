import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as ToggleSort from '../SortWorkers/ToggleSort.ts'

export const sortByName = (state: WorkersState): WorkersState => ToggleSort.toggleSort(state, 'name')
