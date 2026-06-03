import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The frontend speaks to the backend through the `/api/*` prefix.
  // In production this is rewritten by `nginx.conf` to the backend
  // service. In `vite dev`, we proxy the same prefix to a local
  // zig build run on :3000.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
