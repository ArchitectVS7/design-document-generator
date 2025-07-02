import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    
    // Define environment variables to be exposed to the client
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(
        env.VITE_API_URL || (mode === 'production' ? '' : 'http://localhost:3001')
      ),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify('0.7.1'),
      'import.meta.env.VITE_APP_NAME': JSON.stringify('Design Document Generator'),
    },
    
    // Server configuration for development
    server: {
      port: 5173,
      host: true, // Listen on all addresses
      strictPort: true,
      proxy: mode === 'development' ? {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        }
      } : undefined
    },
    
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      minify: mode === 'production' ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
          }
        }
      }
    },
    
    // Optimization
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  }
}) 