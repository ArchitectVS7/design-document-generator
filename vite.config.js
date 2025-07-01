import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/design-document-generator/',
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}) 