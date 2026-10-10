import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as GetVisibleWorkers from '../GetVisibleWorkers/GetVisibleWorkers.ts'
import * as ToggleWorker from '../ToggleWorker/ToggleWorker.ts'

const navigateTree = (
  state: WorkersState,
  key: string,
  visibleWorkers: ReturnType<typeof GetVisibleWorkers.getVisibleWorkers>,
  currentIndex: number,
  selectedWorker: (typeof visibleWorkers)[number] | undefined,
): WorkersState | undefined => {
  const { workers } = state
  if (key === 'ArrowRight' && selectedWorker?.hasChildren) {
    return selectedWorker.expanded
      ? { ...state, hasFocus: true, selectedWorkerId: visibleWorkers[currentIndex + 1].id }
      : ToggleWorker.toggleWorker(state, selectedWorker.id)
  }
  if (key === 'ArrowLeft' && selectedWorker) {
    if (selectedWorker.expanded) return ToggleWorker.toggleWorker(state, selectedWorker.id)
    const parent = workers.find((worker) => worker.id === selectedWorker.parentId)
    return parent ? { ...state, hasFocus: true, selectedWorkerId: parent.id } : state
  }
  return undefined
}

export const navigateWorkers = (state: WorkersState, key: string): WorkersState => {
  const { collapsedWorkerIds, selectedWorkerId, workers } = state
  const visibleWorkers = GetVisibleWorkers.getVisibleWorkers(workers, collapsedWorkerIds || [])
  if (visibleWorkers.length === 0) return state
  const currentIndex = visibleWorkers.findIndex((worker) => worker.id === selectedWorkerId)
  const selectedWorker = visibleWorkers[currentIndex]
  const treeState = navigateTree(state, key, visibleWorkers, currentIndex, selectedWorker)
  if (treeState) return treeState
  let nextIndex: number
  switch (key) {
    case 'ArrowDown':
      nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, visibleWorkers.length - 1)
      break
    case 'ArrowUp':
      nextIndex = currentIndex === -1 ? visibleWorkers.length - 1 : Math.max(currentIndex - 1, 0)
      break
    case 'End':
      nextIndex = visibleWorkers.length - 1
      break
    case 'Home':
      nextIndex = 0
      break
    default:
      return state
  }
  return { ...state, hasFocus: true, selectedWorkerId: visibleWorkers[nextIndex].id }
}

export const focusNext = (state: WorkersState): WorkersState => navigateWorkers(state, 'ArrowDown')
export const focusPrevious = (state: WorkersState): WorkersState => navigateWorkers(state, 'ArrowUp')
export const focusParentOrCollapse = (state: WorkersState): WorkersState => navigateWorkers(state, 'ArrowLeft')
export const focusChildOrExpand = (state: WorkersState): WorkersState => navigateWorkers(state, 'ArrowRight')
export const focusFirst = (state: WorkersState): WorkersState => navigateWorkers(state, 'Home')
export const focusLast = (state: WorkersState): WorkersState => navigateWorkers(state, 'End')
