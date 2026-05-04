import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isDemo = mode === 'demo'

  return {
    plugins: [react()],
    base: isDemo ? '/TableOrders/demo/' : '/TableOrders/',
    build: {
      outDir: isDemo ? 'dist-demo' : 'dist'
    },
    server: {
      port: 3000,
      open: true
    }
  }
})
