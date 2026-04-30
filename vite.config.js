import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react'
          }
          if (id.includes('node_modules/plotly.js') || id.includes('node_modules/recharts')) {
            return 'charts'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
