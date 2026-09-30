import * as DiffType from '../DiffType/DiffType.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const diff2 = (uid: number): readonly number[] => {
  const { newState, oldState } = WorkersStates.get(uid)
  const diffTypes = [oldState.domRendered ? DiffType.RenderIncremental : DiffType.RenderDom]
  if (oldState.hasFocus !== newState.hasFocus) diffTypes.push(DiffType.RenderFocusContext)
  if (!oldState.loaded || oldState.width !== newState.width || oldState.height !== newState.height) {
    diffTypes.push(DiffType.RenderCss)
  }
  return diffTypes
}
