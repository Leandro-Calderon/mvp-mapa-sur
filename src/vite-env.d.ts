/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
/// <reference types="vitest" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly BASE_URL: string
  // Add other env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
