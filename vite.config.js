export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          charts: ['plotly.js', 'recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})