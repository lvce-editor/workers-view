import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-open'

// The consumer LVCE package must release its URI route before this test can run.
export const skip = 1

export const test: Test = async ({ Command, expect, Locator }) => {
  await Command.execute('Developer.openWorkersView')

  const view = Locator('.workers-view')
  await expect(view).toBeVisible()
  await expect(view.locator('h1')).toHaveText('Workers')
  await expect(view.locator('[role="table"][aria-label="Workers"]')).toBeVisible()
  await expect(view.locator('button')).toHaveText('Refresh')
  await Command.execute('Developer.refreshWorkersView')
}
