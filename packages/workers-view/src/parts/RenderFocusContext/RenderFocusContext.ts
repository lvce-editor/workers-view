import { ViewletCommand } from '@lvce-editor/constants'
import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as WhenExpression from '../WhenExpression/WhenExpression.ts'

export const renderFocusContext = (oldState: WorkersState, newState: WorkersState): readonly unknown[] => {
  if (oldState.hasFocus === newState.hasFocus) return []
  if (!newState.hasFocus) return ['Viewlet.unsetAdditionalFocus', newState.uid, WhenExpression.FocusWorkers]
  return [ViewletCommand.SetFocusContext, newState.uid, WhenExpression.FocusWorkers]
}
