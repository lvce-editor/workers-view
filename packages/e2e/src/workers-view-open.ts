import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-open'

// The consumer LVCE package must release its URI route before this test can run.
export const skip = 1

export const test: Test = async ({ Command, expect, Locator }) => {
  await Command.execute('Developer.openWorkersView')

  const view = Locator('.workers-view')
  const heading = view.locator('h1')
  const table = view.locator('[role="table"][aria-label="Workers"]')
  const refreshButton = view.locator('button')
  await expect(view).toBeVisible()
  await expect(heading).toHaveText('Workers')
  await expect(table).toBeVisible()
  await expect(refreshButton).toHaveText('Refresh')
  await Command.execute('Developer.refreshWorkersView')
}
