import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const newPublishFlow = env.NEW_PUBLISH_FLOW ?? env.VITE_NEW_PUBLISH_FLOW ?? 'false';

  return {
    plugins: [
      react(),
      nodePolyfills({
        include: ['buffer', 'process'],
        globals: { Buffer: true, process: true },
      }),
    ],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    define: {
      'import.meta.env.VITE_NEW_PUBLISH_FLOW': JSON.stringify(newPublishFlow),
      'import.meta.env.NEW_PUBLISH_FLOW': JSON.stringify(newPublishFlow),
      'process.env': {},
    },
    optimizeDeps: {
      include: ['buffer', 'process'],
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api/getaddress': {
          target: 'https://api.getaddress.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/getaddress/, ''),
        },
        // Use a regex pattern to match API routes but exclude /api-docs (SPA route)
        '^/api(?!/docs)': { target: 'http://localhost:5174', changeOrigin: true, secure: false },
      },
    },
  };
});
