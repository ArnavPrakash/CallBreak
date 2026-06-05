import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cache-control-static-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/cards/') || req.url.startsWith('/reactions/'))) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@callbreak/shared': path.resolve(__dirname, '../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
});
