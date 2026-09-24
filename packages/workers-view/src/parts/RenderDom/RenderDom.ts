import { ViewletCommand } from '@lvce-editor/constants'
import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as GetWorkersVirtualDom from '../GetWorkersVirtualDom/GetWorkersVirtualDom.ts'

export const renderDom = (_oldState: WorkersState, newState: WorkersState): readonly any[] => [
  ViewletCommand.SetDom2,
  newState.uid,
  GetWorkersVirtualDom.getWorkersVirtualDom(newState.workers, newState.loaded, newState.platform, newState.error),
]
