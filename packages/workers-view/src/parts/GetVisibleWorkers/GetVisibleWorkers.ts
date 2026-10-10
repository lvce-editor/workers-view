import type { DisplayedWorker, VisibleWorker } from '../WorkersState/WorkersState.ts'

export const getVisibleWorkers = (workers: readonly DisplayedWorker[], collapsedWorkerIds: readonly string[]): readonly VisibleWorker[] => {
  const byId = new Map(workers.map((worker) => [worker.id, worker]))
  const childrenByParent = new Map<string | undefined, DisplayedWorker[]>()
  for (const worker of workers) {
    const parentId = worker.parentId && byId.has(worker.parentId) ? worker.parentId : undefined
    const children = childrenByParent.get(parentId) || []
    children.push(worker)
    childrenByParent.set(parentId, children)
  }
  const collapsed = new Set(collapsedWorkerIds)
  const visible: VisibleWorker[] = []
  const visited = new Set<string>()
  const isHiddenByCollapsedAncestor = (worker: Readonly<DisplayedWorker>): boolean => {
    let ancestorId = worker.parentId
    const ancestors = new Set<string>()
    while (ancestorId && byId.has(ancestorId) && !ancestors.has(ancestorId)) {
      if (visited.has(ancestorId)) return collapsed.has(ancestorId)
      ancestors.add(ancestorId)
      const ancestor = byId.get(ancestorId)
      if (!ancestor) return false
      ancestorId = ancestor.parentId
    }
    return false
  }
  const append = (worker: DisplayedWorker, depth: number): void => {
    if (visited.has(worker.id)) return
    visited.add(worker.id)
    const hasChildren = (childrenByParent.get(worker.id)?.length || 0) > 0
    const expanded = hasChildren && !collapsed.has(worker.id)
    visible.push({ ...worker, depth, expanded, hasChildren })
    if (expanded) {
      const children = childrenByParent.get(worker.id)!
      for (const child of children) append(child, depth + 1)
    }
  }
  const roots = childrenByParent.get(undefined) || []
  for (const root of roots) append(root, 1)
  for (const worker of workers) {
    if (visited.has(worker.id)) continue
    if (!isHiddenByCollapsedAncestor(worker)) append(worker, 1)
  }
  return visible
}
