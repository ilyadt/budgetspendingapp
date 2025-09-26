/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_SENTRY_AUTH_TOKEN: string
  readonly VITE_BUILD_COMMIT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
