import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as MenuEntryId from '../MenuEntryId/MenuEntryId.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const showWorkerContextMenu = async (state: WorkersState, workerId: string, x: number, y: number): Promise<WorkersState> => {
  const { uid, workers } = state
  if (workers.every((worker) => worker.id !== workerId)) return state
  const newState = {
    ...state,
    hasFocus: true,
    selectedWorkerId: workerId,
  }
  WorkersStates.set(uid, state, newState)
  await ContextMenu.show2(uid, MenuEntryId.Workers, x, y, { workerId })
  return newState
}
