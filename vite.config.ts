/**
 * vite.config.ts
 * Oracle Document sections consumed: 1, 2, 8, 12
 * Last item from Section 11 risks addressed here: OAuth CORS boundary mismatch
 */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const backendTarget = 'http://127.0.0.1:5000';

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/oauth': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
