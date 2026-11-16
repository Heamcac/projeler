import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  build: { outDir: 'dist', emptyOutDir: true },
  server: { host: '127.0.0.1', port: 3101, strictPort: true, proxy: { '/api': 'http://127.0.0.1:3100', '/health': 'http://127.0.0.1:3100' } },
});
