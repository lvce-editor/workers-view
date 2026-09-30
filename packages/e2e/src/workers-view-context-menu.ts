import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-context-menu'

export const test: Test = async ({ Command, ContextMenu, expect, WorkersView }) => {
  await WorkersView.open()
  await expect(WorkersView.root()).toBeVisible()
  await expect(WorkersView.table()).toBeVisible()
  const components = (await Command.execute('ComponentState.getComponents')) as readonly { readonly moduleId: string; readonly uid: number }[]
  const workersComponent = components.find((component) => component.moduleId === 'Workers')
  if (!workersComponent) {
    throw new Error('Expected Workers component to exist')
  }
  const component = (await Command.execute('Workers.getComponentState', workersComponent.uid)) as Record<string, unknown>
  const workers = [
    { id: 'worker-one', memory: 1, name: 'One Worker', runtimeName: 'One Worker' },
    { id: 'worker-two', memory: 2, name: 'Two Worker', runtimeName: 'Two Worker' },
  ]
  const freezeRefreshError = new Error('Freeze Workers e2e state')
  await Command.execute('Workers.setComponentState', {
    ...component,
    error: freezeRefreshError,
    loaded: true,
    uid: workersComponent.uid,
    workers,
  })
  const table = WorkersView.table()
  const row = table.locator('[data-worker-id="worker-two"]')
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Open the row's real context menu.
  await row.click({ button: 'right' })
  const terminate = WorkersView.root().locator('.MenuItem', { hasText: 'Terminate Worker' })
  await expect(terminate).toBeVisible()
  await expect(row).toHaveAttribute('aria-selected', 'true')
  await ContextMenu.selectItem('Terminate Worker')
}
