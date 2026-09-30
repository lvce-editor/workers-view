import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-keyboard-navigation'

export const test: Test = async ({ Command, expect, KeyBoard, WorkersView }) => {
  await WorkersView.open()
  await expect(WorkersView.root()).toBeVisible()
  await expect(WorkersView.table()).toBeVisible()
  const components = (await Command.execute('ComponentState.getComponents')) as readonly { readonly moduleId: string; readonly uid: number }[]
  const workersComponent = components.find((component) => component.moduleId === 'Workers')
  if (!workersComponent) {
    throw new Error('Expected Workers component to exist')
  }
  const component = (await Command.execute('Workers.getComponentState', workersComponent.uid)) as Record<string, unknown>
  const workers = [
    { id: 'worker-a', memory: 1, name: 'Zulu Worker', runtimeName: 'Zulu Worker' },
    { id: 'worker-b', memory: 2, name: 'Alpha Worker', runtimeName: 'Alpha Worker' },
    { id: 'worker-c', memory: 3, name: 'Mike Worker', runtimeName: 'Mike Worker' },
  ]
  await Command.execute('Workers.setComponentState', {
    ...component,
    error: new Error('Freeze Workers e2e state'),
    loaded: true,
    uid: workersComponent.uid,
    workers,
  })
  const table = WorkersView.table()
  const rowA = table.locator('[data-worker-id="worker-a"]')
  const rowB = table.locator('[data-worker-id="worker-b"]')
  const rowC = table.locator('[data-worker-id="worker-c"]')

  await Command.execute('Viewlet.focusSelector', workersComponent.uid, '.WorkersViewTable')
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

  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Exercise the actual row selection event.
  await rowA.click()
  await expect(rowA).toHaveAttribute('aria-selected', 'true')
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Clicking a table cell must select its containing row through the table listener.
  await rowB.locator('.WorkersViewWorkerCell').first().click()
  await expect(rowB).toHaveAttribute('aria-selected', 'true')
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Sorting should preserve selection by worker id.
  await WorkersView.nameHeaderButton().click()
  const sortedRowB = table.locator('[data-worker-id="worker-b"]')
  await expect(sortedRowB).toHaveAttribute('aria-selected', 'true')

  await Command.execute('Viewlet.focusSelector', workersComponent.uid, '.WorkersViewTableHeaderButton')
  await KeyBoard.press('ArrowUp')
  await expect(sortedRowB).toHaveAttribute('aria-selected', 'true')
}
