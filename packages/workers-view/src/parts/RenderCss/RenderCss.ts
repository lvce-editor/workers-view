import { ViewletCommand } from '@lvce-editor/constants'
import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as GetVisibleWorkers from '../GetVisibleWorkers/GetVisibleWorkers.ts'

export const renderCss = (_oldState: WorkersState, newState: WorkersState): readonly any[] => {
  const visibleWorkers = GetVisibleWorkers.getVisibleWorkers(newState.workers, newState.collapsedWorkerIds || [])
  const hasTreeRows = visibleWorkers.some((worker) => worker.depth > 1 || worker.hasChildren)
  const depths = [...new Set(visibleWorkers.map((worker) => worker.depth).filter((depth) => depth > 1))]
  const indentation = depths.map((depth) => `.WorkersViewIndent-${depth}{padding-left:${(depth - 1) * 16}px;}`).join('')
  const treeCss = hasTreeRows
    ? `.WorkersViewNameCell{display:flex;align-items:center;gap:4px;}.WorkersViewDisclosure{width:16px;min-width:16px;padding:0;border:0;background:transparent;cursor:pointer;}${indentation}`
    : ''
  return [ViewletCommand.SetCss, newState.uid, `width:${newState.width}px;height:${newState.height}px;overflow:hidden;${treeCss}`]
}
