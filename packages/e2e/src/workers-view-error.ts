import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-error'

export const test: Test = async ({ Command, expect, Locator, Main }) => {
  await Main.openUri('workers:///')
  const view = Locator('.workers-view')
  const alert = view.locator('[role="alert"]')
  const table = view.locator('[role="table"][aria-label="Workers"]')
  await expect(table).toBeVisible()
  await Command.execute('Workers.setError', new Error('Workers view e2e error'))
  await expect(alert).toHaveText('Workers view e2e error')
  await Command.execute('Workers.autoRefresh')
  await expect(alert).toHaveText('Workers view e2e error')
  await Command.execute('Workers.refresh')
  await expect(alert).toHaveCount(0)
  await expect(table).toBeVisible()
  await Main.closeActiveEditor()
}
