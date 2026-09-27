import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-open'

export const test: Test = async ({ expect, Main, WorkersView }) => {
  await WorkersView.open()

  const view = WorkersView.root()
  const heading = WorkersView.heading()
  const table = WorkersView.table()
  const refreshButton = WorkersView.refreshButton()
  await expect(view).toBeVisible()
  await expect(heading).toHaveText('Workers')
  await expect(table).toBeVisible()
  await expect(refreshButton).toHaveText('Refresh')
  await WorkersView.refresh()
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Verify the view's real Refresh button is wired to its worker.
  await refreshButton.click()
  await Main.closeActiveEditor()
  await WorkersView.open()
  await expect(WorkersView.root()).toBeVisible()
  await expect(WorkersView.heading()).toHaveText('Workers')
}
