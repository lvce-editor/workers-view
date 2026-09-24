import * as DiffType from '../DiffType/DiffType.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const diff2 = (uid: number): readonly number[] => {
  const { oldState } = WorkersStates.get(uid)
  return oldState.loaded ? [DiffType.RenderDom] : [DiffType.RenderDom, DiffType.RenderCss]
}
