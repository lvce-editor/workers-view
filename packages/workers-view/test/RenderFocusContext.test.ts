import { expect, test } from '@jest/globals'
import { ViewletCommand } from '@lvce-editor/constants'
import { renderFocusContext } from '../src/parts/RenderFocusContext/RenderFocusContext.ts'
import * as WhenExpression from '../src/parts/WhenExpression/WhenExpression.ts'

const state = {
  domRendered: false,
  error: undefined,
  hasFocus: false,
  height: 0,
  loaded: false,
  platform: 0,
  scrollTop: 0,
  selectedWorkerId: undefined,
  sortColumn: undefined,
  sortDirection: undefined,
  uid: 1,
  width: 0,
  workers: [],
  x: 0,
  y: 0,
}

test('sets the Workers context when the table receives focus', () => {
  expect(renderFocusContext(state, { ...state, hasFocus: true })).toEqual([ViewletCommand.SetFocusContext, 1, WhenExpression.FocusWorkers])
})

test('removes the Workers context when the table loses focus', () => {
  expect(renderFocusContext({ ...state, hasFocus: true }, state)).toEqual(['Viewlet.unsetAdditionalFocus', 1, WhenExpression.FocusWorkers])
})

test('does not change the context when focus state is unchanged', () => {
  expect(renderFocusContext(state, state)).toEqual([])
})
