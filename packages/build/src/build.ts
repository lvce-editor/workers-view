import { execa } from 'execa'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { bundleJs } from './bundleJs.ts'
import { root } from './root.ts'

const dist = join(root, '.tmp', 'dist')

const readJson = async (path: string): Promise<Record<string, unknown>> => {
  const content = await readFile(path, 'utf8')
  return JSON.parse(content)
}

const writeJson = async (path: string, json: Record<string, unknown>): Promise<void> => {
  await writeFile(path, JSON.stringify(json, null, 2) + '\n')
}

const getGitTagFromGit = async (): Promise<string> => {
  const { stdout, stderr, exitCode } = await execa('git', ['describe', '--exact-match', '--tags'], {
    reject: false,
  })
  if (exitCode) {
    if (exitCode === 128 && stderr.startsWith('fatal: no tag exactly matches')) {
      return '0.0.0-dev'
    }
    return '0.0.0-dev'
  }
  if (stdout.startsWith('v')) {
    return stdout.slice(1)
  }
  return stdout
}

const getVersion = async (): Promise<string> => {
  const { env } = process
  const { RG_VERSION, GIT_TAG } = env
  if (RG_VERSION) {
    if (RG_VERSION.startsWith('v')) {
      return RG_VERSION.slice(1)
    }
    return RG_VERSION
  }
  if (GIT_TAG) {
    if (GIT_TAG.startsWith('v')) {
      return GIT_TAG.slice(1)
    }
    return GIT_TAG
  }
  return getGitTagFromGit()
}

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })

await bundleJs()

const version = await getVersion()

const packageJson = await readJson(join(root, 'packages', 'workers-view', 'package.json'))

delete packageJson.scripts
delete packageJson.devDependencies
delete packageJson.prettier
delete packageJson.jest
delete packageJson.xo
delete packageJson.directories
packageJson.version = version
packageJson.main = 'dist/workersViewMain.js'

await writeJson(join(dist, 'package.json'), packageJson)

await cp(join(root, 'README.md'), join(dist, 'README.md'))
await cp(join(root, 'LICENSE'), join(dist, 'LICENSE'))
