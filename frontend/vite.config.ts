import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'


export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force single React copy to avoid invalid hook call when monorepo/root has different React
      react: path.resolve(__dirname, 'node_modules', 'react'),
      'react-dom': path.resolve(__dirname, 'node_modules', 'react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules', 'react', 'jsx-runtime')
    },
  },
  server: {
    port: 3000,
    host: true,
    // Always proxy /api to local backend during development to avoid CORS issues.
    // If you need to disable proxy for some reason, set VITE_DISABLE_PROXY=true in env.
    ...(process.env.VITE_DISABLE_PROXY === 'true' ? {} : {
      proxy: {
        '/api': {
          target: 'http://localhost:12001',
          changeOrigin: true,
        },
      }
    }),
  },
})