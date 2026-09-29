import { ViewletCommand } from '@lvce-editor/constants'
import { diffTree } from '@lvce-editor/virtual-dom-worker'
import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as GetWorkersVirtualDom from '../GetWorkersVirtualDom/GetWorkersVirtualDom.ts'

export const renderIncremental = (oldState: WorkersState, newState: WorkersState): readonly any[] => {
  const oldDom = GetWorkersVirtualDom.getWorkersVirtualDom(
    oldState.workers,
    oldState.loaded,
    oldState.platform,
    oldState.error,
    undefined,
    oldState.sortColumn,
    oldState.sortDirection,
  )
  const newDom = GetWorkersVirtualDom.getWorkersVirtualDom(
    newState.workers,
    newState.loaded,
    newState.platform,
    newState.error,
    undefined,
    newState.sortColumn,
    newState.sortDirection,
  )
  return [ViewletCommand.SetPatches, newState.uid, diffTree(oldDom, newDom)]
}
