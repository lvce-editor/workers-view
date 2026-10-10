import { KeyCode } from '@lvce-editor/virtual-dom-worker'
import type { KeyBinding } from '../KeyBinding/KeyBinding.ts'
import * as WhenExpression from '../WhenExpression/WhenExpression.ts'

export const getKeyBindings = (): readonly KeyBinding[] => [
  { command: 'Workers.focusNext', key: KeyCode.DownArrow, when: WhenExpression.FocusWorkers },
  { command: 'Workers.focusPrevious', key: KeyCode.UpArrow, when: WhenExpression.FocusWorkers },
  { command: 'Workers.focusParentOrCollapse', key: KeyCode.LeftArrow, when: WhenExpression.FocusWorkers },
  { command: 'Workers.focusChildOrExpand', key: KeyCode.RightArrow, when: WhenExpression.FocusWorkers },
  { command: 'Workers.focusFirst', key: KeyCode.Home, when: WhenExpression.FocusWorkers },
  { command: 'Workers.focusLast', key: KeyCode.End, when: WhenExpression.FocusWorkers },
]
