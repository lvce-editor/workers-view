import { PlatformType } from '@lvce-editor/constants'
import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as SelectWorker from '../SelectWorker/SelectWorker.ts'
import * as SortByMemory from '../SortByMemory/SortByMemory.ts'
import * as SortByName from '../SortByName/SortByName.ts'

const ErrorHeight = 30
const HeaderHeight = 23
const RowHeight = 22

export const handleTableClick = (state: WorkersState, clientX: number, clientY: number, tableWidth: number): WorkersState => {
  const { error, platform, scrollTop, workers, x, y } = state
  const relativeX = clientX - x
  if (tableWidth <= 0 || relativeX < 0 || relativeX >= tableWidth) {
    return state
  }
  const relativeY = clientY - y
  const columnCount = platform === PlatformType.Electron ? 2 : 1
  const tableTop = error ? ErrorHeight : 0
  const headerTop = tableTop
  if (relativeY >= headerTop && relativeY < headerTop + HeaderHeight) {
    const columnIndex = Math.floor((relativeX / tableWidth) * columnCount)
    if (columnIndex === 0) {
      return SortByName.sortByName(state)
    }
    return SortByMemory.sortByMemory(state)
  }
  const rowIndex = Math.floor((relativeY + scrollTop - tableTop - HeaderHeight) / RowHeight)
  const worker = workers[rowIndex]
  if (!worker) {
    return state
  }
  return SelectWorker.selectWorker(state, worker.id)
}
