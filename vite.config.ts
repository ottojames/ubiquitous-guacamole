import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/getaddress': {
        target: 'https://api.getaddress.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/getaddress/, ''),
      },
      '/api': { target: 'http://localhost:5174', changeOrigin: true, secure: false },
    },
  },
});
