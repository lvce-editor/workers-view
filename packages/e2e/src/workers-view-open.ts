import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-open'

export const test: Test = async ({ Command, expect, Main, WorkersView }) => {
  await WorkersView.open()

  const view = WorkersView.root()
  const nameHeader = WorkersView.nameHeader()
  await expect(view).toBeVisible()
  await expect(WorkersView.heading()).toHaveText('Workers')
  await expect(WorkersView.table()).toBeVisible()
  const tableInContainer = view.locator('.WorkersViewTableContainer > .WorkersViewTable')
  await expect(tableInContainer).toHaveCount(1)
  await expect(nameHeader).toHaveAttribute('aria-sort', 'none')
  await expect(WorkersView.nameHeaderButton()).toHaveText('Name')
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Verify the real Name header control toggles sorting.
  await WorkersView.nameHeaderButton().click()
  await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Verify a repeated real header click reverses the sort.
  await WorkersView.nameHeaderButton().click()
  await expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
  await WorkersView.refresh()
  await expect(nameHeader).toHaveAttribute('aria-sort', 'descending')

  const components = (await Command.execute('ComponentState.getComponents')) as readonly { readonly moduleId: string; readonly uid: number }[]
  const workersComponent = components.find((component) => component.moduleId === 'Workers')
  if (!workersComponent) {
    throw new Error('Expected Workers component to exist')
  }
  const workersState = await Command.execute('Workers.getComponentState')
  const workers = Array.from({ length: 40 }, (_, index) => ({
    id: String(index),
    memory: index,
    name: `Worker ${index}`,
    runtimeName: `Worker ${index}`,
  }))
  await Command.execute('Workers.setComponentState', { ...workersState, loaded: true, uid: workersComponent.uid, workers })
  await Command.execute('Workers.resize', 800, 120)
  const workerRows = WorkersView.table().locator('.WorkersViewWorkerRow')
  await expect(workerRows).toHaveCount(40)
  await Command.execute('Workers.setComponentState', { ...workersState, loaded: true, uid: workersComponent.uid, workers })
  await expect(WorkersView.heading()).toHaveText('Workers')
  await expect(WorkersView.table()).toBeVisible()
  const changedWorkers = workers.map((worker: Readonly<(typeof workers)[number]>, index) =>
    index === 0 ? { ...worker, name: 'Updated Worker' } : worker,
  )
  await Command.execute('Workers.setComponentState', { ...workersState, loaded: true, uid: workersComponent.uid, workers: changedWorkers })
  await expect(workerRows.first()).toContainText('Updated Worker')
  await expect(WorkersView.heading()).toHaveText('Workers')
  await expect(WorkersView.table()).toBeVisible()
  await Command.execute('Workers.resize', 800, 800)

  await Main.closeActiveEditor()
  await WorkersView.open()
  await expect(WorkersView.root()).toBeVisible()
  await expect(WorkersView.heading()).toHaveText('Workers')
  await expect(WorkersView.table()).toBeVisible()
  await Command.execute('Workers.setError', new Error('Workers view e2e error'))
  const alert = WorkersView.error()
  await expect(alert).toHaveText('Workers view e2e error')
  await Command.execute('Workers.autoRefresh')
  await expect(alert).toHaveText('Workers view e2e error')
  await Command.execute('Workers.refresh')
  await expect(alert).toHaveCount(0)
  await expect(WorkersView.table()).toBeVisible()
}
