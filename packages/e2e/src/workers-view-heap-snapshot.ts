import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-heap-snapshot'
export const skip = !navigator.userAgent.includes('Electron')

export const test: Test = async ({ ContextMenu, expect, Locator, WorkersView }) => {
  await WorkersView.open()
  await expect(WorkersView.table()).toBeVisible()
  const row = WorkersView.table().locator('.WorkersViewWorkerRow:has-text("Workers View Worker")')
  await expect(row).toBeVisible()
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Open the worker's real context menu.
  await row.click({ button: 'right' })
  const takeSnapshot = Locator('.MenuItem:has-text("Take Heap Snapshot")')
  await expect(takeSnapshot).toBeVisible()
  await ContextMenu.selectItem('Take Heap Snapshot')
  const heapSnapshotTab = Locator('.MainTabSelected[title$=".heapsnapshot"]')
  await expect(heapSnapshotTab).toBeVisible()
}
