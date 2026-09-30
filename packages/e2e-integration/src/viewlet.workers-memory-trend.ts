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

export const test: Test = async ({ Command, expect, Locator, QuickPick }) => {
  const preference = 'workers.memoryUsageTrend.enabled'
  await Command.execute('Preferences.update', { [preference]: true })
  await QuickPick.open()
  await QuickPick.setValue('>workers')
  await QuickPick.selectItem('Developer: Open Workers View')

  const workersView = Locator('.WorkersView')
  await expect(workersView).toBeVisible()
  const components = (await Command.execute('ComponentState.getComponents')) as readonly ComponentInfo[]
  const component = components.find((item) => item.moduleId === 'Workers')
  if (!component) throw new Error('Expected the Workers component to be open')

  await Command.execute('Workers.refresh', component.uid)
  const state = (await Command.execute('ComponentState.getState', component.uid)) as WorkersState
  const { workers } = state
  expect(workers.every((item) => item.memory === null)).toBe(true)
  await Command.execute('ComponentState.setState', component.uid, {
    ...state,
    memorySamples: [{ id: 'stale-worker', memory: 1000, timestamp: Date.now() - 10_000 }],
  })
  await Command.execute('Workers.refresh', component.uid)
  await expect(Locator('.WorkersViewMemoryTrend')).toHaveCount(0)
  const unavailableState = (await Command.execute('ComponentState.getState', component.uid)) as WorkersState
  expect(unavailableState.memorySamples).toEqual([])

  await Command.execute('Preferences.update', { [preference]: false })
  await Command.execute('Workers.refresh', component.uid)
  await expect(Locator('.WorkersViewMemoryTrend')).toHaveCount(0)
  const disabledState = (await Command.execute('ComponentState.getState', component.uid)) as WorkersState
  expect(disabledState.memorySamples).toEqual([])
}
