import type { Test } from '@lvce-editor/test-with-playwright'

interface ComponentInfo {
  readonly moduleId: string
  readonly uid: number
}

interface WorkerState {
  readonly id: string
  readonly memory: number | null
}

interface WorkersState {
  readonly memorySamples: readonly unknown[]
  readonly [key: string]: unknown
  readonly uid: number
  readonly workers: readonly WorkerState[]
}

export const name = 'viewlet.workers-memory-trend'
const growingTrendLabel = /Memory growing at/

export const test: Test = async ({ Command, expect, Locator, QuickPick }) => {
  const preference = 'workers.memoryUsageTrend.enabled'
  await Command.execute('Preferences.update', { [preference]: false })
  await QuickPick.open()
  await QuickPick.setValue('>workers')
  await QuickPick.selectItem('Developer: Open Workers View')

  const workersView = Locator('.WorkersView')
  await expect(workersView).toBeVisible()
  const components = (await Command.execute('ComponentState.getComponents')) as readonly ComponentInfo[]
  const component = components.find((item) => item.moduleId === 'Workers')
  if (!component) throw new Error('Expected the Workers component to be open')

  await Command.execute('Preferences.update', { [preference]: true })
  await Command.execute('Workers.refresh', component.uid)
  const state = (await Command.execute('Workers.getComponentState', component.uid)) as WorkersState
  const { workers } = state
  const worker = workers.find((item) => typeof item.memory === 'number' && item.memory > 1000)
  if (!worker || worker.memory === null) throw new Error('Expected an Electron worker with a readable heap measurement')

  await Command.execute('Workers.setComponentState', {
    ...state,
    memorySamples: [{ id: worker.id, memory: worker.memory - 1000, timestamp: Date.now() - 10_000 }],
  })
  await Command.execute('Workers.refresh', component.uid)
  const growingTrend = Locator('.WorkersViewMemoryTrendGrowing')
  await expect(growingTrend).toBeVisible()
  await expect(growingTrend).toHaveAttribute('aria-label', growingTrendLabel)

  await Command.execute('Preferences.update', { [preference]: false })
  await Command.execute('Workers.refresh', component.uid)
  await expect(Locator('.WorkersViewMemoryTrend')).toHaveCount(0)
  const disabledState = (await Command.execute('Workers.getComponentState', component.uid)) as WorkersState
  expect(disabledState.memorySamples).toEqual([])
}
