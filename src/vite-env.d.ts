/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_DIRECTUS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
