import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isDemo = mode === 'demo' || mode === 'demo-v2'
  const isDemoV2 = mode === 'demo-v2'

  return {
    plugins: [react()],
    base: isDemoV2 ? '/TableOrders-v2/' : isDemo ? '/TableOrders/demo/' : '/TableOrders/',
    build: {
      outDir: isDemoV2 ? 'dist-demo-v2' : isDemo ? 'dist-demo' : 'dist'
    },
    server: {
      port: 3000,
      open: true
    }
  }
})
