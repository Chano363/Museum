import { createApp } from 'vue'
import App from './App.vue'

// 全局控制台日志捕获功能
if (import.meta.env.DEV) {
  // 存储控制台日志
  window.consoleLogs = []
  
  // 重写 console.log 方法
  const originalLog = console.log
  console.log = function(...args) {
    originalLog.apply(console, args)
    try {
      const logMessage = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg)
          } catch (e) {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')
      window.consoleLogs.push({
        timestamp: new Date().toISOString(),
        message: logMessage
      })
    } catch (e) {
      console.error('捕获日志时出错:', e)
    }
  }
  
  // 重写 console.error 方法
  const originalError = console.error
  console.error = function(...args) {
    originalError.apply(console, args)
    try {
      const errorMessage = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg)
          } catch (e) {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')
      window.consoleLogs.push({
        timestamp: new Date().toISOString(),
        message: '[ERROR] ' + errorMessage
      })
    } catch (e) {
      console.error('捕获错误日志时出错:', e)
    }
  }
  
  // 重写 console.warn 方法
  const originalWarn = console.warn
  console.warn = function(...args) {
    originalWarn.apply(console, args)
    try {
      const warnMessage = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg)
          } catch (e) {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')
      window.consoleLogs.push({
        timestamp: new Date().toISOString(),
        message: '[WARN] ' + warnMessage
      })
    } catch (e) {
      console.error('捕获警告日志时出错:', e)
    }
  }
}

const app = createApp(App)

// 配置model-viewer为自定义元素
app.config.compilerOptions.isCustomElement = (tag) => tag === 'model-viewer'

app.mount('#app')
