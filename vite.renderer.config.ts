import path from 'node:path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig(async () => {
  const [{ default: react }] = await Promise.all([
    import('@vitejs/plugin-react'),
  ]);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Map '@/' alias to the 'src/renderer' directory.
        // This matches your tsconfig.json setup: "@/*": ["./src/renderer/*"]
        '@': path.resolve(__dirname, 'src/renderer'),
        '@shared': path.resolve(__dirname, 'src/shared'),
      },
    },
  };
});
