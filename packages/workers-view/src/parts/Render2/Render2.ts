import * as DiffType from '../DiffType/DiffType.ts'
import * as RenderCss from '../RenderCss/RenderCss.ts'
import * as RenderDom from '../RenderDom/RenderDom.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const render2 = (uid: number, diffTypes: readonly number[]): readonly any[] => {
  const { newState, oldState } = WorkersStates.get(uid)
  WorkersStates.set(uid, newState, newState)
  return diffTypes.map((diffType) => {
    if (diffType === DiffType.RenderCss) return RenderCss.renderCss(oldState, newState)
    return RenderDom.renderDom(oldState, newState)
  })
}
