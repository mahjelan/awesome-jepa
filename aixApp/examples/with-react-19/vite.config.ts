import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Copy index.html to 404.html so Firebase Hosting serves SPA for unknown routes
    {
      name: 'copy-404',
      closeBundle() {
        const out = resolve(__dirname, 'dist')
        const index = resolve(out, 'index.html')
        const notFound = resolve(out, '404.html')
        if (existsSync(index)) {
          copyFileSync(index, notFound)
        }
      },
    },
  ],
})
