import { defineConfig } from '@lvce-editor/test-with-playwright'

export default defineConfig({
  link: ['../../.tmp/dist', '../../node_modules/@lvce-editor/test-worker'],
})
