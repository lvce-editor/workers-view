import { expect, test } from '@jest/globals'
import { PlatformType } from '@lvce-editor/constants'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'
import * as DiffType from '../src/parts/DiffType/DiffType.ts'

test('includes a focus context diff when table focus changes', async () => {
  const uid = 17
  commandMap['Workers.create'](uid, '', 0, 0, 100, 100, PlatformType.Web, '')
  try {
    await commandMap['Workers.focusWorkers'](uid)
    expect(commandMap['Workers.diff2'](uid)).toContain(DiffType.RenderFocusContext)
  } finally {
    commandMap['Workers.dispose'](uid)
  }
})
