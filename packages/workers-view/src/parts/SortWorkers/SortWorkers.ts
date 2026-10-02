import type { DisplayedWorker, SortColumn, SortDirection } from '../WorkersState/WorkersState.ts'

const compareName = (a: DisplayedWorker, b: DisplayedWorker): number => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)

export const sortWorkers = (
  workers: readonly DisplayedWorker[],
  sortColumn: SortColumn | undefined,
  sortDirection: SortDirection | undefined,
): readonly DisplayedWorker[] => {
  if (!sortColumn || !sortDirection) return workers
  const direction = sortDirection === 'ascending' ? 1 : -1
  return workers.toSorted((a, b) => {
    if (sortColumn === 'memory' || sortColumn === 'cpu') {
      const aValue = a[sortColumn] ?? null
      const bValue = b[sortColumn] ?? null
      if (aValue === null) return bValue === null ? compareName(a, b) : 1
      if (bValue === null) return -1
      const difference = (aValue - bValue) * direction
      if (difference) return difference
    } else {
      const nameDifference = compareName(a, b) * direction
      if (nameDifference) return nameDifference
    }
    return compareName(a, b)
  })
}
