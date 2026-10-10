import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 轮询监听，避免部分环境下文件改动无法触发热更新
    watch: { usePolling: true, interval: 300 },
  },
})
