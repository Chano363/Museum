import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const port = parseInt(env.VITE_PORT || '3002', 10)
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000'

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'model-viewer'
          }
        }
      })
    ],
    server: {
      port,
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
          target: backendUrl,
          changeOrigin: true
        },
        '/static': {
          target: backendUrl,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets'
    }
  }
})
