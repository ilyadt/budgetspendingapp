import { fileURLToPath } from 'node:url'
import { ConfigEnv } from 'vite'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

const confEnv: ConfigEnv = {
  mode: 'test',
  command: 'build'
}

export default mergeConfig(
  viteConfig(confEnv),
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
