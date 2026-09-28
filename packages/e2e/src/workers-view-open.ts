import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-open'

export const test: Test = async ({ Command, expect, Main, WorkersView }) => {
  await WorkersView.open()

  const view = WorkersView.root()
  const heading = WorkersView.heading()
  const table = WorkersView.table()
  const buttons = view.locator('button')
  await expect(view).toBeVisible()
  await expect(heading).toHaveText('Workers')
  await expect(table).toBeVisible()
  await expect(buttons).toHaveCount(0)
  await Command.execute('Workers.autoRefresh')
  await Main.closeActiveEditor()
  await WorkersView.open()
  const reopenedView = WorkersView.root()
  const reopenedButtons = reopenedView.locator('button')
  await expect(reopenedView).toBeVisible()
  await expect(WorkersView.heading()).toHaveText('Workers')
  await expect(reopenedButtons).toHaveCount(0)
  await Command.execute('Workers.setError', new Error('Workers view e2e error'))
  const alert = reopenedView.locator('[role="alert"]')
  await expect(alert).toHaveText('Workers view e2e error')
  await Command.execute('Workers.autoRefresh')
  await expect(alert).toHaveText('Workers view e2e error')
  await Command.execute('Workers.refresh')
  await expect(alert).toHaveCount(0)
  await expect(WorkersView.table()).toBeVisible()
}
