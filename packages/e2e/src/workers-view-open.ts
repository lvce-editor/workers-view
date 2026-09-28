import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-open'

export const test: Test = async ({ Command, expect, Locator, Main, WorkersView }) => {
  await WorkersView.open()

  const view = Locator('.WorkersView')
  const heading = view.locator('h1')
  const table = view.locator('[role="table"][aria-label="Workers"]')
  const refreshButton = view.locator('button')
  await expect(view).toBeVisible()
  await expect(heading).toHaveText('Workers')
  await expect(table).toBeVisible()
  await expect(refreshButton).toHaveText('Refresh')
  await WorkersView.refresh()
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Verify the view's real Refresh button is wired to its worker.
  await refreshButton.click()
  await Main.closeActiveEditor()
  await WorkersView.open()
  const reopenedView = Locator('.WorkersView')
  const reopenedHeading = reopenedView.locator('h1')
  const reopenedTable = reopenedView.locator('[role="table"][aria-label="Workers"]')
  await expect(reopenedView).toBeVisible()
  await expect(reopenedHeading).toHaveText('Workers')
  await Command.execute('Workers.setError', new Error('Workers view e2e error'))
  const alert = reopenedView.locator('[role="alert"]')
  await expect(alert).toHaveText('Workers view e2e error')
  await Command.execute('Workers.autoRefresh')
  await expect(alert).toHaveText('Workers view e2e error')
  await Command.execute('Workers.refresh')
  await expect(alert).toHaveCount(0)
  await expect(reopenedTable).toBeVisible()
}
