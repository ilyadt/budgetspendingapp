import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const nodeVersion = Number(process.versions.node.split('.')[0])

const execArgv = []

if (nodeVersion >= 25) {
  // In Node v25 `localstorage` appears as Proxy object and calling method `localstorage.get`
  // causes the following error:
  // `Uncaught TypeError: localStorage.get is not a function`
  //
  // Workaround is disabling `localstorage` with option `NODE_OPTIONS=--no-webstorage`
  //
  // Link: https://zenn.dev/mima_ita/articles/775119d66803bf?locale=en
  execArgv.push('--no-webstorage')
}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    execArgv: execArgv,
  },
})
