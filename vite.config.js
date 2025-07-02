import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  base: '/design-document-generator/',
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Optionally rewrite the path if needed
        // rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          vendor: ['react', 'react-dom'],
          
          // Large components
          conversation: [
            './src/components/ConversationFlow.tsx',
            './src/hooks/useConversation.ts',
            './src/utils/promptBuilder.ts'
          ],
          
          // Configuration related
          config: [
            './src/components/ConfigurationManager.tsx',
            './src/hooks/useConfigurationFile.ts',
            './src/utils/migration.ts',
            './src/utils/validation.ts'
          ],
          
          // Agent management
          agents: [
            './src/components/AgentList.tsx',
            './src/components/AgentEditor.tsx',
            './src/hooks/useAgentConfiguration.ts'
          ],
          
          // Database and services
          services: [
            './src/hooks/useDatabase.ts',
            './src/services/apiClient.ts',
            './src/services/configurationService.ts',
            './src/services/llmProvider.ts'
          ]
        },
        
        // Optimize chunk names
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          return `assets/${name}-[hash].js`;
        },
        
        // Optimize asset names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    
    // Performance optimizations
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Enable experimental features for better performance
  esbuild: {
    target: 'esnext',
    format: 'esm'
  }
}) 