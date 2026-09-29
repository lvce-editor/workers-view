import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-context-menu'

export const test: Test = async ({ Command, expect, WorkersView }) => {
  await WorkersView.open()
  const component = (await Command.execute('Workers.getComponentState')) as Record<string, unknown>
  const workers = [
    { id: 'worker-one', memory: 1, name: 'One Worker', runtimeName: 'One Worker' },
    { id: 'worker-two', memory: 2, name: 'Two Worker', runtimeName: 'Two Worker' },
  ]
  await Command.execute('Workers.setComponentState', { ...component, loaded: true, workers })
  const table = WorkersView.table()
  const row = table.locator('[data-worker-id="worker-two"]')
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Open the row's real context menu.
  await row.click({ button: 'right' })
  const terminate = WorkersView.root().locator('.WorkersViewContextMenuItem')
  await expect(terminate).toBeVisible()
  await expect(row).toHaveAttribute('aria-selected', 'true')

  // Remove the target while its menu is open. The stale action must be ignored.
  const latest = (await Command.execute('Workers.getComponentState')) as Record<string, unknown>
  const remainingWorkers = workers.filter((worker: Readonly<(typeof workers)[number]>) => worker.id !== 'worker-two')
  await Command.execute('Workers.setComponentState', {
    ...latest,
    workers: remainingWorkers,
  })
  await expect(terminate).toBeVisible()
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Exercise the displayed context-menu action.
  await terminate.click()
  await expect(terminate).toHaveCount(0)
  const removedRow = table.locator('[data-worker-id="worker-two"]')
  await expect(removedRow).toHaveCount(0)
}
