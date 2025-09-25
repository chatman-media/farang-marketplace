/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOG_LEVEL?: string
  readonly NODE_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
