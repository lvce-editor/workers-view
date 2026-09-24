import { defineConfig, globalIgnores } from 'eslint/config'
import * as config from '@lvce-editor/eslint-config'

export default defineConfig([
  ...config.default,
  ...config.recommendedActions,
  ...config.recommendedRegex,
  ...config.recommendedTsconfig,
  ...config.recommendedVirtualDom,
  globalIgnores(['**/*.js', '**/*.cjs', '**/*.mjs']),
])
