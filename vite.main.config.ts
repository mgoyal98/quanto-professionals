import path from 'node:path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@db': path.resolve(__dirname, 'src/db'),
    },
  },
  build: {
    target: 'node20',
    sourcemap: true,
    rollupOptions: {
      external: ['better-sqlite3'],
    },
  },
});
