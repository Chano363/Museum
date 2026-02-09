<template>
  <div class="setting-view-overlay" @click="$emit('close')">
    <div class="setting-view" @click.stop>
      <button class="close-btn" @click="$emit('close')">
        ×
      </button>
      <h2 class="setting-title">设置</h2>
      

      <div class="setting-section">
        <h3 class="section-title">系统</h3>
        <div class="setting-item">
          <span>音量</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            v-model.number="volume"
            class="slider"
          >
          <span>{{ volume }}%</span>
        </div>
        <div class="setting-item">
          <span>亮度</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            v-model.number="brightness"
            class="slider"
          >
          <span>{{ brightness }}%</span>
        </div>
        <div class="setting-item">
          <span>自动休眠</span>
          <label class="toggle-switch">
            <input type="checkbox" v-model="autoSleep">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div class="setting-section">
        <h3 class="section-title">关于 & 帮助</h3>
        <button class="info-btn" @click="showAbout = true">关于</button>
        <button class="info-btn" @click="showHelp = true">帮助</button>
      </div>
    </div>
    
    <!-- 关于页面弹窗 -->
    <AboutView v-if="showAbout" @close="showAbout = false" />
    
    <!-- 帮助页面弹窗 -->
    <HelpView v-if="showHelp" @close="showHelp = false" />
  </div>
</template>

<script>
import AboutView from './AboutView.vue'
import HelpView from './HelpView.vue'

export default {
  name: 'SettingView',
  components: {
    AboutView,
    HelpView
  },
  emits: ['close'],
  data() {
    return {
      volume: 70,
      brightness: 80,
      autoSleep: true,
      showAbout: false,
      showHelp: false
    }
  },
  mounted() {
    // 从localStorage读取保存的设置
    this.loadSettings()
    // 初始化时设置当前值
    this.updateVolume()
    this.updateBrightness()
  },
  watch: {
    volume(newValue) {
      this.updateVolume()
      this.saveSettings()
    },
    brightness(newValue) {
      this.updateBrightness()
      this.saveSettings()
    },
    autoSleep(newValue) {
      this.saveSettings()
    }
  },
  methods: {
    loadSettings() {
      // 从localStorage加载设置
      try {
        const savedSettings = localStorage.getItem('museumSettings')
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          this.volume = settings.volume || 70
          this.brightness = settings.brightness || 80
          this.autoSleep = settings.autoSleep !== false
        }
      } catch (error) {
        console.error('加载设置失败:', error)
      }
    },
    saveSettings() {
      // 保存设置到localStorage
      try {
        const settings = {
          volume: this.volume,
          brightness: this.brightness,
          autoSleep: this.autoSleep
        }
        localStorage.setItem('museumSettings', JSON.stringify(settings))
      } catch (error) {
        console.error('保存设置失败:', error)
      }
    },
    updateVolume() {
      // 更新系统音量（如果支持）
      console.log('音量设置为:', this.volume + '%')
      // 这里可以添加实际的音量控制逻辑
      // 例如：通过audio元素或Web Audio API控制音量
    },
    updateBrightness() {
      // 调整亮度范围：0%对应30%，100%对应100%
      const actualBrightness = 0.3 + (this.brightness / 100) * 0.7
      // 通过CSS变量修改全局亮度
      document.documentElement.style.setProperty('--brightness', actualBrightness)
      console.log('亮度设置为:', this.brightness + '%', '实际亮度:', (actualBrightness * 100).toFixed(0) + '%')
    }
  }
}</script>

<style scoped>
.setting-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.setting-view {
  width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  background-color: #f5f1e8; /* 宣纸米白 */
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  width: 30px;
  height: 30px;
  border: none;
  background-color: transparent;
  font-size: 24px;
  cursor: pointer;
  color: #3c2a1e;
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: scale(1.2);
  color: #8b0000; /* 朱砂红 */
}

.setting-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #3c2a1e;
  margin-bottom: 20px;
  text-align: center;
}

.setting-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(60, 42, 30, 0.2);
}

.setting-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #6b5645;
  margin-bottom: 15px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.status-indicator {
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.9rem;
}

.status-indicator.active {
  background-color: rgba(39, 174, 96, 0.2);
  color: #27ae60;
}

.status-indicator {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.slider {
  flex: 1;
  margin: 0 15px;
  height: 6px;
  border-radius: 3px;
  background: rgba(60, 42, 30, 0.2);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #8b0000; /* 朱砂红 */
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #8b0000; /* 朱砂红 */
  cursor: pointer;
  border: none;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(60, 42, 30, 0.2);
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #8b0000; /* 朱砂红 */
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.toggle-btn {
  width: 100%;
  padding: 10px;
  background-color: #8b0000; /* 朱砂红 */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 0, 0, 0.3);
}

.info-btn {
  width: 100%;
  padding: 10px;
  background-color: rgba(60, 42, 30, 0.1);
  color: #3c2a1e;
  border: 1px solid rgba(60, 42, 30, 0.3);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 10px;
}

.info-btn:hover {
  background-color: rgba(60, 42, 30, 0.2);
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 滚动条样式 */
.setting-view::-webkit-scrollbar {
  width: 6px;
}

.setting-view::-webkit-scrollbar-track {
  background: rgba(60, 42, 30, 0.1);
  border-radius: 3px;
}

.setting-view::-webkit-scrollbar-thumb {
  background: rgba(60, 42, 30, 0.3);
  border-radius: 3px;
}

.setting-view::-webkit-scrollbar-thumb:hover {
  background: rgba(60, 42, 30, 0.5);
}
</style>
