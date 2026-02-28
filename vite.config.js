import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 将model-viewer标记为自定义元素
          isCustomElement: (tag) => tag === 'model-viewer'
        }
      }
    })
  ],
  server: {
    port: 3002,
    open: true,
    host: '0.0.0.0',
    clearScreen: false,
    allowedHosts: [
      'localhost',
      'kristi-rustproof-dessie.ngrok-free.dev',
      '.trycloudflare.com'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/static': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
