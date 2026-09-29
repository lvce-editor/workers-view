import { serverPath } from '@lvce-editor/server'
import { fileURLToPath, pathToFileURL } from 'node:url'

process.argv.push(
  '--link',
  fileURLToPath(new URL('../../../.tmp/dist', import.meta.url)),
  '--link',
  fileURLToPath(new URL('../../../node_modules/@lvce-editor/test-worker', import.meta.url)),
)

await import(pathToFileURL(serverPath).href)
