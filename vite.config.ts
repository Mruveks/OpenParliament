import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/ep': {
        target: 'https://data.europarl.europa.eu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ep/, '/api/v2'),
      },
    },
  },
})
