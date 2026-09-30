import type { Test } from '@lvce-editor/test-with-playwright'

interface ComponentInfo {
  readonly moduleId: string
  readonly uid: number
}

export const name = 'viewlet.workers-keyboard-navigation'

export const test: Test = async ({ Command, expect, KeyBoard, Locator, QuickPick }) => {
  await QuickPick.open()
  await QuickPick.setValue('>workers')
  await QuickPick.selectItem('Developer: Open Workers View')

  const workersView = Locator('.WorkersView')
  const table = workersView.locator('.WorkersViewTable')
  await expect(table).toBeVisible()
  const components = (await Command.execute('ComponentState.getComponents')) as readonly ComponentInfo[]
  const component = components.find((item) => item.moduleId === 'Workers')
  if (!component) {
    throw new Error('Expected Workers component to exist')
  }
  const state = (await Command.execute('Workers.getComponentState', component.uid)) as Record<string, unknown>

  await Command.execute('Workers.setComponentState', {
    ...state,
    error: new Error('Freeze Workers keyboard e2e state'),
    loaded: true,
    uid: component.uid,
    workers: [],
  })
  await Command.execute('Viewlet.focusSelector', component.uid, '.WorkersViewTable')
  await KeyBoard.press('ArrowDown')
  await KeyBoard.press('ArrowUp')
  await KeyBoard.press('Home')
  await KeyBoard.press('End')
  await expect(table.locator('.WorkersViewWorkerRow')).toHaveCount(0)

  const workers = [
    { id: 'worker-a', memory: 1, name: 'Zulu Worker', runtimeName: 'Zulu Worker' },
    { id: 'worker-b', memory: 2, name: 'Alpha Worker', runtimeName: 'Alpha Worker' },
    { id: 'worker-c', memory: 3, name: 'Mike Worker', runtimeName: 'Mike Worker' },
  ]
  await Command.execute('Workers.setComponentState', {
    ...state,
    error: new Error('Freeze Workers keyboard e2e state'),
    loaded: true,
    uid: component.uid,
    workers,
  })

  const rowA = table.locator('[data-worker-id="worker-a"]')
  const rowB = table.locator('[data-worker-id="worker-b"]')
  const rowC = table.locator('[data-worker-id="worker-c"]')
  await Command.execute('Viewlet.focusSelector', component.uid, '.WorkersViewTable')
  await KeyBoard.press('ArrowDown')
  await expect(rowA).toHaveAttribute('aria-selected', 'true')
  await KeyBoard.press('ArrowDown')
  await expect(rowB).toHaveAttribute('aria-selected', 'true')
  await expect(rowA).toHaveAttribute('aria-selected', 'false')
  await KeyBoard.press('Home')
  await KeyBoard.press('ArrowUp')
  await expect(rowA).toHaveAttribute('aria-selected', 'true')
  await KeyBoard.press('End')
  await KeyBoard.press('ArrowDown')
  await expect(rowC).toHaveAttribute('aria-selected', 'true')
  await KeyBoard.press('ArrowUp')
  await expect(rowB).toHaveAttribute('aria-selected', 'true')

  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Exercise actual row selection after keyboard focus.
  await rowA.click()
  await expect(rowA).toHaveAttribute('aria-selected', 'true')
  const nameHeaderButton = table.locator('.WorkersViewTableHeaderButton').first()
  await expect(nameHeaderButton).toHaveText('Name')
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Sorting must preserve selection by worker id.
  await nameHeaderButton.click()
  await expect(rowA).toHaveAttribute('aria-selected', 'true')

  await Command.execute('Viewlet.focusSelector', component.uid, '.WorkersViewTableHeaderButton')
  await KeyBoard.press('ArrowUp')
  await expect(rowA).toHaveAttribute('aria-selected', 'true')
}
