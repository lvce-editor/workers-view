import type { Test } from '@lvce-editor/test-with-playwright'

interface ComponentInfo {
  readonly moduleId: string
  readonly uid: number
}

export const name = 'viewlet.workers-tree-grid'

export const test: Test = async ({ Command, expect, KeyBoard, Locator, QuickPick }) => {
  await QuickPick.open()
  await QuickPick.setValue('>workers')
  await QuickPick.selectItem('Developer: Open Workers View')

  const workersView = Locator('.WorkersView')
  const table = workersView.locator('.WorkersViewTable')
  await expect(table).toBeVisible()
  const components = (await Command.execute('ComponentState.getComponents')) as readonly ComponentInfo[]
  const component = components.find((item) => item.moduleId === 'Workers')
  if (!component) throw new Error('Expected Workers component to exist')
  const state = (await Command.execute('Workers.getComponentState', component.uid)) as Record<string, unknown>
  const workers = [
    { id: 'renderer', name: 'Renderer Worker', runtimeName: 'Renderer Worker' },
    { id: 'panel', name: 'Panel Worker', parentId: 'renderer', runtimeName: 'Panel Worker' },
    { id: 'extension-management', name: 'Extension Management Worker', parentId: 'renderer', runtimeName: 'Extension Management Worker' },
    { id: 'eslint', name: 'ESLint Worker', parentId: 'extension-management', runtimeName: 'ESLint Worker' },
  ]
  await Command.execute('Workers.setComponentState', {
    ...state,
    collapsedWorkerIds: [],
    error: new Error('Freeze Workers tree-grid e2e state'),
    loaded: true,
    selectedWorkerId: 'renderer',
    uid: component.uid,
    workers,
  })

  const row = (id: string): ReturnType<typeof table.locator> => table.locator(`[data-worker-id="${id}"]`)
  await expect(row('renderer')).toHaveAttribute('aria-level', '1')
  await expect(row('panel')).toHaveAttribute('aria-level', '2')
  await expect(row('eslint')).toHaveAttribute('aria-level', '3')

  await Command.execute('Viewlet.focusSelector', component.uid, '.WorkersViewTable')
  await KeyBoard.press('ArrowDown')
  await KeyBoard.press('ArrowDown')
  await expect(row('extension-management')).toHaveAttribute('aria-selected', 'true')
  await KeyBoard.press('ArrowRight')
  await expect(row('eslint')).toHaveAttribute('aria-selected', 'true')
  await KeyBoard.press('ArrowLeft')
  await expect(row('extension-management')).toHaveAttribute('aria-selected', 'true')

  await KeyBoard.press('ArrowLeft')
  await expect(row('eslint')).toBeHidden()
  await expect(row('extension-management')).toHaveAttribute('aria-expanded', 'false')
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Exercise the real disclosure control.
  await row('extension-management').locator('.WorkersViewDisclosure').click()
  await expect(row('eslint')).toBeVisible()
  await expect(row('extension-management')).toHaveAttribute('aria-expanded', 'true')
}
