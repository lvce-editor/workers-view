import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-open'

export const test: Test = async ({ Command, expect, Locator, Main, WorkersView }) => {
  await WorkersView.open()

  const view = Locator('.WorkersView')
  const heading = view.locator('h1')
  const table = view.locator('[role="table"][aria-label="Workers"]')
  const refreshButton = view.locator('.WorkersViewRefreshButton')
  await expect(view).toBeVisible()
  await expect(heading).toHaveText('Workers')
  await expect(table).toBeVisible()
  await expect(refreshButton).toHaveCount(0)
  const nameHeader = view.locator('button').nth(0)
  const nameHeaderCell = view.locator('th').first()
  await expect(nameHeader).toHaveText('Name')
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Verify the real Name header control toggles sorting.
  await nameHeader.click()
  await expect(nameHeaderCell).toHaveAttribute('aria-sort', 'ascending')
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Verify a repeated real header click reverses the sort.
  await nameHeader.click()
  await expect(nameHeaderCell).toHaveAttribute('aria-sort', 'descending')
  await WorkersView.refresh()
  await expect(nameHeaderCell).toHaveAttribute('aria-sort', 'descending')

  const components = (await Command.execute('ComponentState.getComponents')) as readonly { readonly moduleId: string; readonly uid: number }[]
  const workersComponent = components.find((component) => component.moduleId === 'Workers')
  if (!workersComponent) {
    throw new Error('Expected Workers component to exist')
  }
  const workersState = await Command.execute('ComponentState.getState', workersComponent.uid)
  const workers = Array.from({ length: 40 }, (_, index) => ({
    id: String(index),
    memory: index,
    name: `Worker ${index}`,
    runtimeName: `Worker ${index}`,
  }))
  await Command.execute('ComponentState.setState', workersComponent.uid, { ...workersState, loaded: true, workers })
  await Command.execute('Workers.resize', 800, 120)
  const workerRows = view.locator('.WorkersViewWorkerRow')
  await expect(view).toHaveCSS('overflow', 'auto')
  await expect(view).toHaveCSS('height', '120px')
  await expect(workerRows).toHaveCount(40)
  await Command.execute('Workers.resize', 800, 800)
  await expect(view).toHaveCSS('height', '800px')

  await Main.closeActiveEditor()
  await WorkersView.open()
  const reopenedView = Locator('.WorkersView')
  const reopenedHeading = reopenedView.locator('h1')
  const reopenedTable = reopenedView.locator('[role="table"][aria-label="Workers"]')
  const reopenedRefreshButton = reopenedView.locator('.WorkersViewRefreshButton')
  await expect(reopenedView).toBeVisible()
  await expect(reopenedHeading).toHaveText('Workers')
  await expect(reopenedRefreshButton).toHaveCount(0)
  await Command.execute('Workers.setError', new Error('Workers view e2e error'))
  const alert = reopenedView.locator('[role="alert"]')
  await expect(alert).toHaveText('Workers view e2e error')
  await Command.execute('Workers.autoRefresh')
  await expect(alert).toHaveText('Workers view e2e error')
  await Command.execute('Workers.refresh')
  await expect(alert).toHaveCount(0)
  await expect(reopenedTable).toBeVisible()
}
