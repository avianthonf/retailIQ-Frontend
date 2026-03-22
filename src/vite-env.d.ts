/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SOCKET_IO_URL?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
