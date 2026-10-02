import type { SortColumn, SortDirection, WorkersState } from '../WorkersState/WorkersState.ts'
import * as SortWorkers from './SortWorkers.ts'

const getInitialDirection = (sortColumn: SortColumn): SortDirection => (sortColumn === 'name' ? 'ascending' : 'descending')

export const toggleSort = (state: WorkersState, sortColumn: SortColumn): WorkersState => {
  const { sortColumn: previousSortColumn, sortDirection: previousSortDirection, workers } = state
  let sortDirection = getInitialDirection(sortColumn)
  if (previousSortColumn === sortColumn && previousSortDirection) {
    sortDirection = previousSortDirection === 'ascending' ? 'descending' : 'ascending'
  }
  return {
    ...state,
    sortColumn,
    sortDirection,
    workers: SortWorkers.sortWorkers(workers, sortColumn, sortDirection),
  }
}
