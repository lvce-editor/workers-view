import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const navigateWorkers = (state: WorkersState, key: string): WorkersState => {
  const { selectedWorkerId, workers } = state
  if (workers.length === 0) return state
  const currentIndex = workers.findIndex((worker) => worker.id === selectedWorkerId)
  let nextIndex: number
  switch (key) {
    case 'ArrowDown':
      nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, workers.length - 1)
      break
    case 'ArrowUp':
      nextIndex = currentIndex === -1 ? workers.length - 1 : Math.max(currentIndex - 1, 0)
      break
    case 'End':
      nextIndex = workers.length - 1
      break
    case 'Home':
      nextIndex = 0
      break
    default:
      return state
  }
  return { ...state, contextMenuWorkerId: undefined, hasFocus: true, selectedWorkerId: workers[nextIndex].id }
}
