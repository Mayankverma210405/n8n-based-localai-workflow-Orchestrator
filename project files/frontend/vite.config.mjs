import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: { '@': '/src' },
    },
    server: {
      port: 5173,
      strictPort: true,
      open: true,
      proxy: {
        // keep the same backend port behavior; set env var VITE_BACKEND_URL in production if different
        '/api': {
          target: process.env.VITE_BACKEND_URL || 'http://localhost:3100',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    }
  };
});
