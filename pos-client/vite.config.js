import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Touch file to trigger Vite restart after npm install

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['react-bootstrap']
  },
  define: {
    // API path for local dev; production domain/path come from window.location (appEnv.js)
    'process.env.REACT_APP_DEFAULT_PATH': JSON.stringify(process.env.REACT_APP_DEFAULT_PATH || 'http://127.0.0.1:8000'),
  },
})
