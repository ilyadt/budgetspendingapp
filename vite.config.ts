import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
// import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    define: {
      __API_BASE_URL__: JSON.stringify(env.VITE_SERVER_URL),
    },
    plugins: [
      vue(),
      vueJsx(),
      // vueDevTools(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        },
        manifest: {
          theme_color: '#ffffff',
          icons: [
            { src: 'icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/apple-touch-icon.png', type: 'image/png' },
          ],
        },
      }),
      // sentryVitePlugin({
      //   org: 'dim-2a',
      //   project: 'go',
      //   authToken: env.VITE_SENTRY_AUTH_TOKEN,
      // }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'esnext', // modern browsers
    },
  }
})
