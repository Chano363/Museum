import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// 配置model-viewer为自定义元素
app.config.compilerOptions.isCustomElement = (tag) => tag === 'model-viewer'

app.mount('#app')
