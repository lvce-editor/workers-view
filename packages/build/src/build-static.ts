import { cp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { root } from './root.ts'

const sharedProcessPath = join(root, 'node_modules', '@lvce-editor', 'shared-process', 'index.js')
const sharedProcessUrl = pathToFileURL(sharedProcessPath).toString()
const sharedProcess = await import(sharedProcessUrl)

process.env.PATH_PREFIX = '/workers-view'
const { commitHash } = await sharedProcess.exportStatic({
  extensionPath: '',
  root,
  testPath: 'packages/e2e',
})

const rendererWorkerPath = join(root, 'dist', commitHash, 'packages', 'renderer-worker', 'dist', 'rendererWorkerMain.js')

const getRemoteUrl = (path: string): string => {
  const url = pathToFileURL(path).toString().slice(8)
  return `/remote/${url}`
}

const content = await readFile(rendererWorkerPath, 'utf8')
const workerPath = join(root, '.tmp', 'dist', 'dist', 'workersViewMain.js')
const remoteUrl = getRemoteUrl(workerPath)
const occurrence = `// const workersViewWorkerUrl = \`\${assetDir}/packages/workers-view/dist/workersViewMain.js\`
const workersViewWorkerUrl = \`${remoteUrl}\``
const replacement = `const workersViewWorkerUrl = \`\${assetDir}/packages/workers-view/dist/workersViewMain.js\``

if (content.includes(occurrence)) {
  await writeFile(rendererWorkerPath, content.replace(occurrence, replacement))
}
await cp(join(root, 'dist'), join(root, '.tmp', 'static'), { recursive: true })
