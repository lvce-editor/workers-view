import * as DiffType from '../DiffType/DiffType.ts'
import * as RenderCss from '../RenderCss/RenderCss.ts'
import * as RenderDom from '../RenderDom/RenderDom.ts'
import * as RenderIncremental from '../RenderIncremental/RenderIncremental.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const render2 = (uid: number, diffTypes: readonly number[]): readonly any[] => {
  const { newState, oldState } = WorkersStates.get(uid)
  const hasDomRender = diffTypes.includes(DiffType.RenderDom) || diffTypes.includes(DiffType.RenderIncremental)
  const renderedState = hasDomRender ? { ...newState, domRendered: true } : newState
  WorkersStates.set(uid, renderedState, renderedState)
  return diffTypes.map((diffType) => {
    if (diffType === DiffType.RenderCss) return RenderCss.renderCss(oldState, newState)
    if (diffType === DiffType.RenderIncremental) return RenderIncremental.renderIncremental(oldState, newState)
    return RenderDom.renderDom(oldState, newState)
  })
}
