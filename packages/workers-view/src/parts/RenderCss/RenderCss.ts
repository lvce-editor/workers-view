import { ViewletCommand } from '@lvce-editor/constants'
import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const renderCss = (_oldState: WorkersState, newState: WorkersState): readonly any[] => [
  ViewletCommand.SetCss,
  newState.uid,
  `width:${newState.width}px;height:${newState.height}px;overflow:auto;`,
]
