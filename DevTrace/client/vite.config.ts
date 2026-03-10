import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@powersync/web/dist/*.wasm',
          dest: '',
        },
        {
          src: 'node_modules/@powersync/web/dist/*.js',
          dest: 'powersync',
        },
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ['@powersync/web'],
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
});