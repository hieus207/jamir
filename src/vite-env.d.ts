/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** REST backend base URL. Leave empty to use the bundled JSON mock. */
  readonly VITE_API_BASE_URL?: string
  /** Artificial latency (ms) for the JSON mock. */
  readonly VITE_MOCK_LATENCY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
