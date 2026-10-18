import type { DisplayedWorker } from '../WorkersState/WorkersState.ts'

const metaWorkerIds = new Set(['fileSystemWorker', 'cacheWorker', 'textMeasurementWorker', 'sourceControl'])
// Viewlet worker IDs from the renderer-worker catalogue, excluding extension-specific views.
const viewWorkerIds = new Set([
  'componentState',
  'notificationCenterView',
  'cookieImportView',
  'accountsView',
  'aboutWorker',
  'activityBar',
  'textSearchView',
  'chatDebug',
  'chatView',
  'dialogWorker',
  'diffView',
  'explorer',
  'iframeInspector',
  'keyBindings',
  'languageModels',
  'mainArea',
  'output',
  'panel',
  'preview',
  'portsView',
  'problemsViewWorker',
  'fileWatcherView',
  'processExplorer',
  'quickPickWorker',
  'workersView',
  'secretsView',
  'settingsView',
  'statusBar',
  'titleBar',
])

const makeGroup = (id: string, name: string): DisplayedWorker => ({
  id,
  memory: 0,
  name,
  runtimeName: '',
  synthetic: true,
})

export const groupWorkers = (workers: readonly DisplayedWorker[]): readonly DisplayedWorker[] => {
  const metaWorkers = workers.filter((worker) => metaWorkerIds.has(worker.id) && !worker.parentId)
  const viewWorkers = workers.filter((worker) => viewWorkerIds.has(worker.id) && !worker.parentId)
  const groupedIds = new Set([...metaWorkers, ...viewWorkers].map(({ id }) => id))
  const otherWorkers = workers.filter((worker) => !groupedIds.has(worker.id))
  const groups: DisplayedWorker[] = []
  if (metaWorkers.length > 0) {
    groups.push(makeGroup('zygote-meta', 'Meta Workers'))
    groups.push(...metaWorkers.map((worker) => ({ ...worker, parentId: 'zygote-meta' })))
  }
  if (viewWorkers.length > 0) {
    groups.push(makeGroup('zygote-views', 'View Workers'))
    groups.push(...viewWorkers.map((worker) => ({ ...worker, parentId: 'zygote-views' })))
  }
  return [...otherWorkers, ...groups]
}
