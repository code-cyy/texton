import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = parseInt(env.VITE_PORT || '10086')
  
  // 确保端口 > 10000
  if (port <= 10000) {
    console.warn('警告: 端口必须大于 10000，使用默认端口 10086')
  }
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: port > 10000 ? port : 10086,
      proxy: {
        '/api': {
          target: env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
