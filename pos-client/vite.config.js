import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Touch file to trigger Vite restart after npm install

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-bootstrap']
  },
  define: {
    // Expose REACT_APP_* env vars so process.env works (Vite uses import.meta.env by default)
    'process.env.REACT_APP_DEFAULT_PATH': JSON.stringify(process.env.REACT_APP_DEFAULT_PATH || 'http://127.0.0.1:8000'),
  },
})
