import { expect, test } from '@jest/globals'
import { KeyCode } from '@lvce-editor/virtual-dom-worker'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'
import { getKeyBindings } from '../src/parts/GetKeyBindings/GetKeyBindings.ts'
import * as WhenExpression from '../src/parts/WhenExpression/WhenExpression.ts'

test('registers navigation keys for the Workers focus context', () => {
  expect(getKeyBindings()).toEqual([
    { command: 'Workers.focusNext', key: KeyCode.DownArrow, when: WhenExpression.FocusWorkers },
    { command: 'Workers.focusPrevious', key: KeyCode.UpArrow, when: WhenExpression.FocusWorkers },
    { command: 'Workers.focusParentOrCollapse', key: KeyCode.LeftArrow, when: WhenExpression.FocusWorkers },
    { command: 'Workers.focusChildOrExpand', key: KeyCode.RightArrow, when: WhenExpression.FocusWorkers },
    { command: 'Workers.focusFirst', key: KeyCode.Home, when: WhenExpression.FocusWorkers },
    { command: 'Workers.focusLast', key: KeyCode.End, when: WhenExpression.FocusWorkers },
  ])
  expect(commandMap['Workers.getKeyBindings']).toBe(getKeyBindings)
})
