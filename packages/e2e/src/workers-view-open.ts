import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'workers-view-open'

export const test: Test = async ({ Command, expect, KeyBoard, Main, WorkersView }) => {
  await WorkersView.open()

  const view = WorkersView.root()
  const heading = WorkersView.heading()
  const nameHeader = WorkersView.nameHeader()
  await expect(view).toBeVisible()
  await expect(heading).toHaveCount(0)
  await expect(WorkersView.table()).toBeVisible()
  const components = (await Command.execute('ComponentState.getComponents')) as readonly { readonly moduleId: string; readonly uid: number }[]
  const workersComponent = components.find((component) => component.moduleId === 'Workers')
  if (!workersComponent) {
    throw new Error('Expected Workers component to exist')
  }
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
  await Command.execute('Viewlet.focusSelector', workersComponent.uid, '.WorkersViewTableHeaderButton')
  await KeyBoard.press('Enter')
  await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
  await KeyBoard.press('Space')
  await expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
  await WorkersView.refresh()
  await expect(nameHeader).toHaveAttribute('aria-sort', 'descending')

  const workers = Array.from({ length: 40 }, (_, index) => ({
    cpu: [72.5, 0][index] ?? null,
    id: String(index),
    memory: index,
    ...(index === 0 && { memoryTrend: { bytesPerSecond: 2100, direction: 'growing' as const } }),
    name: `Worker ${index}`,
    runtimeName: `Worker ${index}`,
  }))
  const geometry = (await Command.execute('ComponentState.getState', workersComponent.uid)) as { readonly x: number; readonly y: number }
  const workersState = {
    error: undefined,
    hasFocus: false,
    height: 120,
    loaded: true,
    platform: 2,
    scrollTop: 0,
    sortColumn: undefined,
    sortDirection: undefined,
    uid: workersComponent.uid,
    width: 800,
    workers,
    x: geometry.x,
    y: geometry.y,
  }
  await Command.execute('Workers.setComponentState', workersState)
  const workerRows = WorkersView.table().locator('.WorkersViewWorkerRow')
  const firstWorkerTrend = workerRows.first().locator('.WorkersViewMemoryTrendGrowing')
  await expect(workerRows).toHaveCount(40)
  await expect(firstWorkerTrend).toHaveText('↑ 2.1 kB/s')
  const cpuHeader = WorkersView.table().locator('.WorkersViewTableHeaderCell:nth-child(3)')
  const cpuButton = cpuHeader.locator('.WorkersViewTableHeaderButton')
  await expect(cpuButton).toHaveText('CPU (%)')
  const busyCpuCell = WorkersView.table().locator('[data-worker-id="0"] .WorkersViewWorkerCell:nth-child(3)')
  const idleCpuCell = WorkersView.table().locator('[data-worker-id="1"] .WorkersViewWorkerCell:nth-child(3)')
  const unavailableCpuCell = WorkersView.table().locator('[data-worker-id="2"] .WorkersViewWorkerCell:nth-child(3)')
  await expect(busyCpuCell).toHaveText('72.5')
  await expect(idleCpuCell).toHaveText('0.0')
  await expect(unavailableCpuCell).toHaveText('Unavailable')
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Verify actual CPU header hit testing and sort state.
  await cpuButton.click()
  await expect(cpuHeader).toHaveAttribute('aria-sort', 'descending')
  await Command.execute('Viewlet.focusSelector', workersComponent.uid, '[data-sort-column="cpu"]')
  await KeyBoard.press('Enter')
  await expect(cpuHeader).toHaveAttribute('aria-sort', 'ascending')
  await WorkersView.resize(800, 120)

  await Command.execute('Workers.setComponentState', workersState)
  await expect(heading).toHaveCount(0)
  await expect(WorkersView.table()).toBeVisible()
  const [firstChangedWorker, ...otherChangedWorkers] = workers
  const changedWorkers = firstChangedWorker ? [{ ...firstChangedWorker, name: 'Updated Worker' }, ...otherChangedWorkers] : []
  await Command.execute('Workers.setComponentState', { ...workersState, workers: changedWorkers })
  await expect(workerRows.first()).toContainText('Updated Worker')
  await expect(heading).toHaveCount(0)
  await expect(WorkersView.table()).toBeVisible()
  await WorkersView.resize(800, 800)

  await Main.closeActiveEditor()
  await WorkersView.open()
  await expect(WorkersView.root()).toBeVisible()
  await expect(heading).toHaveCount(0)
  await expect(WorkersView.table()).toBeVisible()
  await WorkersView.setError(new Error('Workers view e2e error'))
  const alert = WorkersView.error()
  await expect(alert).toHaveText('Workers view e2e error')
  await WorkersView.autoRefresh()
  await expect(alert).toHaveText('Workers view e2e error')
  await WorkersView.refresh()
  await expect(alert).toHaveCount(0)
  await expect(WorkersView.table()).toBeVisible()
}
