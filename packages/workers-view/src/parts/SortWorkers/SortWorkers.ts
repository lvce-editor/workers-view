import type { DisplayedWorker, SortColumn, SortDirection } from '../WorkersState/WorkersState.ts'

const compareName = (a: DisplayedWorker, b: DisplayedWorker): number => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)

const compare = (a: DisplayedWorker, b: DisplayedWorker, sortColumn: SortColumn | undefined, sortDirection: SortDirection | undefined): number => {
  if (!sortColumn || !sortDirection) return 0
  const direction = sortDirection === 'ascending' ? 1 : -1
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
}

export const sortWorkers = (
  workers: readonly DisplayedWorker[],
  sortColumn: SortColumn | undefined,
  sortDirection: SortDirection | undefined,
): readonly DisplayedWorker[] => {
  if (workers.every((worker) => !worker.parentId)) {
    if (!sortColumn && !sortDirection) {
      const rendererIndex = workers.findIndex((worker) => worker.name === 'Renderer Worker')
      return rendererIndex > 0 ? [workers[rendererIndex], ...workers.slice(0, rendererIndex), ...workers.slice(rendererIndex + 1)] : workers
    }
    return workers.toSorted((a, b) => {
      const aIsRenderer = a.name === 'Renderer Worker'
      const bIsRenderer = b.name === 'Renderer Worker'
      if (aIsRenderer !== bIsRenderer) return aIsRenderer ? -1 : 1
      return compare(a, b, sortColumn, sortDirection)
    })
  }
  const byParent = new Map<string | undefined, DisplayedWorker[]>()
  const byId = new Map(workers.map((worker) => [worker.id, worker]))
  for (const worker of workers) {
    const parentId = worker.parentId && byId.has(worker.parentId) ? worker.parentId : undefined
    const siblings = byParent.get(parentId) || []
    siblings.push(worker)
    byParent.set(parentId, siblings)
  }
  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => {
      if (!a.parentId && !b.parentId) {
        const aIsRenderer = a.name === 'Renderer Worker'
        const bIsRenderer = b.name === 'Renderer Worker'
        if (aIsRenderer !== bIsRenderer) return aIsRenderer ? -1 : 1
      }
      return compare(a, b, sortColumn, sortDirection)
    })
  }
  const ordered: DisplayedWorker[] = []
  const visited = new Set<string>()
  const append = (worker: DisplayedWorker): void => {
    if (visited.has(worker.id)) return
    visited.add(worker.id)
    ordered.push(worker)
    const children = byParent.get(worker.id) || []
    for (const child of children) append(child)
  }
  const roots = byParent.get(undefined) || []
  for (const root of roots) append(root)
  // A malformed cyclic parent reference should not make a live worker disappear.
  for (const worker of workers) append(worker)
  return ordered
}
