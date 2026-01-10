import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const OFFLINE = process.env.VITE_OFFLINE === 'true'

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
    ...(OFFLINE ? {} : {
      proxy: {
        '/api': {
          target: 'http://localhost:12001',
          changeOrigin: true,
        },
      }
    }),
  },
})