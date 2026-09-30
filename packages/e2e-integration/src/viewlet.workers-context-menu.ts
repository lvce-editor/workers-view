import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'viewlet.workers-context-menu'

export const test: Test = async ({ Command, ContextMenu, expect, KeyBoard, Locator, QuickPick }) => {
  await QuickPick.open()
  await QuickPick.setValue('>workers')
  await QuickPick.selectItem('Developer: Open Workers View')
  const workersView = Locator('.WorkersView')
  await expect(workersView).toBeVisible()
  const components = (await Command.execute('ComponentState.getComponents')) as readonly { readonly moduleId: string; readonly uid: number }[]
  const component = components.find((item) => item.moduleId === 'Workers')
  if (!component) throw new Error('Expected Workers view component to be available')
  const state = (await Command.execute('ComponentState.getState', component.uid)) as { readonly workers: readonly unknown[] }
  const { workers } = state
  const testWorker = {
    id: 'context-menu-test-worker',
    memory: 0,
    name: 'Context Menu Test Worker',
    runtimeName: 'Context Menu Test Worker [context-menu-test-worker]',
  }
  await Command.execute('ComponentState.setState', component.uid, {
    ...state,
    // Pause automatic refresh while the context-menu action is asserted.
    error: new Error('Pause worker refresh during context-menu test'),
    workers: [...workers, testWorker],
  })
  const row = Locator('.WorkersViewWorkerRow[data-worker-id="context-menu-test-worker"]')
  await expect(row).toBeVisible()
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Select the actual row before opening its menu.
  await row.click()
  await expect(row).toHaveAttribute('aria-selected', 'true')
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Open the row's real context menu.
  await row.click({ button: 'right' })
  const terminate = Locator('.MenuItem', { hasText: 'Terminate Worker' })
  await expect(terminate).toBeVisible()
  await expect(row).toHaveAttribute('aria-selected', 'true')
  const takeSnapshot = Locator('.MenuItem', { hasText: 'Take Heap Snapshot' })
  await expect(takeSnapshot).toBeHidden()
  await KeyBoard.press('Escape')
  await expect(terminate).toBeHidden()
  // The test worker has no matching runtime target. Terminating this stale ID must
  // leave real workers untouched and refresh the view back to runtime-owned rows.
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Reopen the row's real context menu.
  await row.click({ button: 'right' })
  await expect(terminate).toBeVisible()
  await ContextMenu.selectItem('Terminate Worker')
  await expect(row).toBeHidden()
  await expect(Locator('.WorkersView')).toBeVisible()
}
