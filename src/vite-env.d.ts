/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_OAUTH_BASE_URL?: string;
  readonly VITE_SOCKET_IO_URL?: string;
  readonly VITE_OAUTH_CLIENT_ID?: string;
  readonly VITE_OAUTH_REDIRECT_URI?: string;
  readonly VITE_PAYMENT_PUBLISHABLE_KEY?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
