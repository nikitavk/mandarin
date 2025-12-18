import { defineConfig } from 'vite'

export default defineConfig({
  base: '/mandarin/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
})
