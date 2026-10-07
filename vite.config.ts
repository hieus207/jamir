import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: true,
    // the API (server/) runs on :3001 — `npm run dev:api`
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
  preview: { proxy: { '/api': 'http://127.0.0.1:3001' } },
  build: {
    rolldownOptions: {
      output: {
        // Stable vendor chunks: app deploys don't invalidate cached libraries.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/, priority: 30 },
            { name: 'motion', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/, priority: 20 },
            { name: 'base-ui', test: /node_modules[\\/](@base-ui|@floating-ui|tabbable|use-sync-external-store)[\\/]/, priority: 20 },
            { name: 'data', test: /node_modules[\\/](@tanstack|zustand)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
