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
    { id: 'workers-tree-grid-renderer', name: 'Renderer Worker', runtimeName: 'Renderer Worker' },
    { id: 'workers-tree-grid-panel', name: 'Panel Worker', parentId: 'workers-tree-grid-renderer', runtimeName: 'Panel Worker' },
    {
      id: 'workers-tree-grid-extension-management',
      name: 'Extension Management Worker',
      parentId: 'workers-tree-grid-renderer',
      runtimeName: 'Extension Management Worker',
    },
    {
      id: 'workers-tree-grid-eslint',
      name: 'ESLint Worker',
      parentId: 'workers-tree-grid-extension-management',
      runtimeName: 'ESLint Worker',
    },
  ]
  await Command.execute('Workers.setComponentState', {
    ...state,
    collapsedWorkerIds: [],
    error: new Error('Freeze Workers tree-grid e2e state'),
    loaded: true,
    selectedWorkerId: 'workers-tree-grid-renderer',
    sortColumn: undefined,
    sortDirection: undefined,
    uid: component.uid,
    workers,
  })

  const row = (id: string): ReturnType<typeof table.locator> => table.locator(`.WorkersViewWorkerRow[data-worker-id="${id}"]`)
  await expect(row('workers-tree-grid-renderer')).toHaveAttribute('aria-level', '1')
  await expect(row('workers-tree-grid-panel')).toHaveAttribute('aria-level', '2')
  await expect(row('workers-tree-grid-eslint')).toHaveAttribute('aria-level', '3')

  await Command.execute('Viewlet.focusSelector', component.uid, '.WorkersViewTable')
  await expect(Locator(':focus')).toHaveAttribute('class', 'WorkersViewTable')
  await expect(row('workers-tree-grid-renderer')).toHaveAttribute('aria-selected', 'true')
  await KeyBoard.press('ArrowDown')
  await expect(row('workers-tree-grid-panel')).toHaveAttribute('aria-selected', 'true')
  await KeyBoard.press('ArrowDown')
  await expect(row('workers-tree-grid-extension-management')).toHaveAttribute('aria-selected', 'true')
  await KeyBoard.press('ArrowRight')
  await expect(row('workers-tree-grid-eslint')).toHaveAttribute('aria-selected', 'true')
  await KeyBoard.press('ArrowLeft')
  await expect(row('workers-tree-grid-extension-management')).toHaveAttribute('aria-selected', 'true')

  await KeyBoard.press('ArrowLeft')
  await expect(row('workers-tree-grid-eslint')).toBeHidden()
  await expect(row('workers-tree-grid-extension-management')).toHaveAttribute('aria-expanded', 'false')
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Exercise the real disclosure control.
  await row('workers-tree-grid-extension-management').locator('.WorkersViewDisclosure').click()
  await expect(row('workers-tree-grid-eslint')).toBeVisible()
  await expect(row('workers-tree-grid-extension-management')).toHaveAttribute('aria-expanded', 'true')
}
