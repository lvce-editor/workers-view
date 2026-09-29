import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', '..', '..')

const getRemoteUrl = (path) => {
  const url = pathToFileURL(path).toString().slice(8)
  return `/remote/${url}`
}

const nodeModulesPath = join(root, 'node_modules')
const require = createRequire(import.meta.url)
const workerPath = join(root, '.tmp', 'dist', 'dist', 'workersViewMain.js')
const serverStaticPath = join(nodeModulesPath, '@lvce-editor', 'static-server', 'static')
const isCommitHash = (dirent) => dirent.length === 7 && /^[a-z\d]+$/.test(dirent)
const dirents = await readdir(serverStaticPath)
const commitHash = dirents.find(isCommitHash) || ''
const rendererWorkerMainPath = join(serverStaticPath, commitHash, 'packages', 'renderer-worker', 'dist', 'rendererWorkerMain.js')
const content = await readFile(rendererWorkerMainPath, 'utf8')

if (!content.includes('// const workersViewWorkerUrl = ')) {
  const occurrence = `const workersViewWorkerUrl = \`\${assetDir}/packages/workers-view/dist/workersViewMain.js\``
  const remoteUrl = getRemoteUrl(workerPath)
  const replacement = `// const workersViewWorkerUrl = \`\${assetDir}/packages/workers-view/dist/workersViewMain.js\`
const workersViewWorkerUrl = \`${remoteUrl}\``
  const newContent = content.replace(occurrence, replacement)

  if (newContent !== content) {
    await writeFile(rendererWorkerMainPath, newContent)
  }
}

const testWorkerPath = require.resolve('@lvce-editor/test-worker/dist/testWorkerMain.js')
const staticTestWorkerPath = join(serverStaticPath, commitHash, 'packages', 'test-worker', 'dist', 'testWorkerMain.js')
await copyFile(testWorkerPath, staticTestWorkerPath)
