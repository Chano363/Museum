<template>
  <div class="main-view">
    <!-- 博物馆logo -->
    <div class="museum-logo">
      博物馆logo
    </div>
    
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧展品名称区域 -->
      <div class="artifact-name-section">
        <div class="artifact-name">
          {{ selectedArtifact?.name || '请选择文物' }}
        </div>
      </div>
      
      <!-- 中间副信息区域 -->
       <div class="side-info-section">
         <div class="side-info-item">年代: {{ selectedArtifact?.era || '未知' }}</div>
         <div class="side-info-item author-item">作者: {{ selectedArtifact?.author || '未知' }}</div>
       </div>
      
      <!-- 右侧详情介绍区域 -->
      <div class="detail-section">
        <div class="detail-content">
          {{ selectedArtifact?.description || '暂无介绍' }}
        </div>
      </div>
      
      <!-- 最右侧3D模型区域 -->
      <div class="model-section">
        <div class="model-container">
          <ParticleModel
            v-if="modelPath && !isUserModel"
            ref="particleModelRef"
            :model-path="modelPath"
            :particle-size="0.005"
            :max-particles="100000"
            @loaded="onModelLoaded"
            @error="onModelError"
          />
          <model-viewer
            v-else-if="modelPath && isUserModel"
            ref="modelViewerRef"
            :src="modelPath"
            :style="userModelStyle"
            camera-controls
            auto-rotate
            shadow-intensity="0"
            exposure="1.2"
            @load="onModelLoaded"
          />
          <div v-else class="placeholder-container">
            <div class="placeholder-text">文物3D模型</div>
          </div>
          
          <!-- 3D模型上的小白点 -->
          <div v-if="isFingerTracking && modelFingerPosition"
               class="model-finger-dot"
               :style="{ left: modelFingerPosition.x + '%', top: modelFingerPosition.y + '%' }">
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载中遮罩 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载模型中...</div>
      </div>
    </div>
    
    <!-- 摄像头容器 -->
    <div class="camera-container" v-if="showCamera">
      <GestureControl
        :width="videoWidth"
        :height="videoHeight"
        :show-overlay="isDev"
        :show-guide="false"
        @action="onGestureAction"
        @gesture="onGestureDetected"
        @finger-move="onFingerMove"
      />
    </div>
    
    <!-- 底部工具栏 -->
    <div class="toolbar">
      <button class="tool-btn back-home-btn" @click="$emit('back')" title="返回首页">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </button>
      <button class="tool-btn" @click="toggleCamera">
      <img :src="showCamera ? '/icons/camera.png' : '/icons/camera.png'" 
           :class="{'camera-off': !showCamera}" 
           alt="camera" />
    </button>
    <button class="tool-btn" @click="$emit('toggleThumbBar', false)">
      <img src="/icons/switch.png" alt="switch" />
    </button>
    <button class="tool-btn" @click="toggleSettings">
      <img src="/icons/settings.png" alt="settings" />
    </button>
      <button v-if="isDev" class="tool-btn" @click="exportLogs">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      </button>
    </div>
    
    <SettingView 
      v-if="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>

<script>
import GestureControl from './GestureControl.vue'
import ParticleModel from './ParticleModel.vue'
import SettingView from './SettingView.vue'

export default {
  name: 'MainView',
  components: {
    GestureControl,
    ParticleModel,
    SettingView
  },
  props: {
    selectedArtifact: {
      type: Object,
      required: true
    }
  },
  emits: ['nextModel', 'prevModel', 'displayGestureHint', 'toggleThumbBar'],
  data() {
    return {
      showCamera: false,
      videoWidth: 640,
      videoHeight: 480,
      isLoading: false,
      isFingerTracking: false,
      modelFingerPosition: null,
      lastFingerMoveTime: 0,
      FINGER_MOVE_INTERVAL: 16,
      showSettings: false,
      targetFingerPosition: null,
      currentFingerPosition: { x: 50, y: 50 },
      animationFrameId: null,
      SMOOTH_SPEED: 2.0,
      MIN_DISTANCE: 0.5
    }
  },
  computed: {
    isDev() {
      return import.meta.env.DEV
    },
    modelPath() {
      if (this.selectedArtifact && this.selectedArtifact.model === 'external') {
        return this.selectedArtifact.modelPath || '/3Dmodels/dragon_with_pearl/scene.gltf'
      }
      return null
    },
    isUserModel() {
      return this.selectedArtifact?.isGenerated === true
    },
    userModelStyle() {
      return {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent'
      }
    }
  },
  methods: {
    resetModelView() {
      const particleModel = this.$refs.particleModelRef
      if (particleModel) {
        particleModel.reset()
      }
    },
    zoomIn() {
      const particleModel = this.$refs.particleModelRef
      if (particleModel) {
        particleModel.zoomIn()
      }
    },
    zoomOut() {
      const particleModel = this.$refs.particleModelRef
      if (particleModel) {
        particleModel.zoomOut()
      }
    },
    onGestureAction(action) {
      if (!action) return
      
      switch (action) {
        case 'reset':
          this.resetModelView()
          this.$emit('displayGestureHint', '重置视图')
          break
        case 'zoom_in':
          this.zoomIn()
          this.$emit('displayGestureHint', '放大模型')
          break
        case 'zoom_out':
          this.zoomOut()
          this.$emit('displayGestureHint', '缩小模型')
          break
        case 'switch':
        case 'switch_next':
          this.$emit('nextModel')
          this.$emit('displayGestureHint', '切换展品')
          break
        case 'switch_prev':
          this.$emit('prevModel')
          this.$emit('displayGestureHint', '切换展品')
          break
        case 'rotate':
          this.isFingerTracking = true
          if (!this.animationFrameId) {
            this.startContinuousAnimation()
          }
          break
        case 'toggle_thumbbar':
          this.$emit('toggleThumbBar', true)
          this.$emit('displayGestureHint', '唤出切换面板')
          break
        default:
          break
      }
    },
    onGestureDetected(gesture) {
    },
    onFingerMove(data) {
      if (!data) {
        this.isFingerTracking = false
        this.targetFingerPosition = null
        return
      }
      
      const now = performance.now()
      if (now - this.lastFingerMoveTime < this.FINGER_MOVE_INTERVAL) {
        return
      }
      this.lastFingerMoveTime = now
      
      const deltaX = data.deltaX
      const deltaY = data.deltaY
      const position = data.position
      const sensitivity = 1.5
      
      const particleModel = this.$refs.particleModelRef
      if (!particleModel) return
      
      try {
        particleModel.rotate(-deltaX * sensitivity, deltaY * sensitivity)
        
        if (position) {
          const modelX = (position.x / 320) * 100
          const modelY = (position.y / 240) * 100
          
          this.targetFingerPosition = {
            x: Math.max(0, Math.min(100, modelX)),
            y: Math.max(0, Math.min(100, modelY))
          }
        } else if (deltaX !== undefined && deltaY !== undefined) {
          const dotSensitivity = 0.5
          this.targetFingerPosition = {
            x: Math.max(0, Math.min(100, this.targetFingerPosition?.x || 50 + deltaX * dotSensitivity)),
            y: Math.max(0, Math.min(100, this.targetFingerPosition?.y || 50 + deltaY * dotSensitivity))
          }
        }
      } catch (error) {
        console.error('控制模型失败:', error)
      }
    },
    startContinuousAnimation() {
      const animate = () => {
        if (!this.isFingerTracking && !this.targetFingerPosition) {
          this.modelFingerPosition = null
          this.animationFrameId = null
          return
        }
        
        if (this.targetFingerPosition) {
          const dx = this.targetFingerPosition.x - this.currentFingerPosition.x
          const dy = this.targetFingerPosition.y - this.currentFingerPosition.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > this.MIN_DISTANCE) {
            const moveDistance = Math.min(distance, this.SMOOTH_SPEED)
            const ratio = moveDistance / distance
            
            this.currentFingerPosition.x += dx * ratio
            this.currentFingerPosition.y += dy * ratio
          } else {
            this.currentFingerPosition.x = this.targetFingerPosition.x
            this.currentFingerPosition.y = this.targetFingerPosition.y
          }
        }
        
        this.modelFingerPosition = {
          x: this.currentFingerPosition.x,
          y: this.currentFingerPosition.y
        }
        
        this.animationFrameId = requestAnimationFrame(animate)
      }
      
      this.animationFrameId = requestAnimationFrame(animate)
    },
    toggleCamera() {
      this.showCamera = !this.showCamera
    },
    toggleSettings() {
      this.showSettings = !this.showSettings
    },
    exportLogs() {
      let logsToExport = []
      
      if (window.consoleLogs && window.consoleLogs.length > 0) {
        logsToExport = window.consoleLogs
      } else {
        logsToExport = [
          {
            timestamp: new Date().toISOString(),
            message: '导出日志功能测试'
          },
          {
            timestamp: new Date().toISOString(),
            message: '当前时间: ' + new Date().toLocaleString()
          },
          {
            timestamp: new Date().toISOString(),
            message: '摄像头状态: ' + this.showCamera
          }
        ]
      }
      
      const logContent = logsToExport.map(log => {
        return `${log.timestamp}: ${log.message}`
      }).join('\n')
      
      const blob = new Blob([logContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `console-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
      a.click()
      URL.revokeObjectURL(url)
    },
    onModelLoaded() {
      this.isLoading = false
      // 模型加载完成后重新打开摄像头
      this.toggleCamera()
    },
    onModelError(event) {
      console.error('粒子模型加载失败:', event)
      this.isLoading = false
      // 模型加载失败后也重新打开摄像头
      this.toggleCamera()
    }
  },
  mounted() {
    console.log('MainView mounted, selectedArtifact:', this.selectedArtifact)
    if (this.selectedArtifact && this.selectedArtifact.model === 'external' && this.selectedArtifact.modelPath) {
      this.isLoading = true
    }
  },
  beforeUnmount() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  },
  watch: {
    selectedArtifact() {
      if (this.selectedArtifact && this.selectedArtifact.model === 'external' && this.selectedArtifact.modelPath) {
        // 开始加载模型时关闭摄像头，减少性能消耗
        if (this.showCamera) {
          this.showCamera = false
        }
        this.isLoading = true
      }
    }
  }
}
</script>

<style scoped>
/* 全局样式 */
.main-view {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--background-color);
  overflow: hidden;
  font-family: var(--font-family);
}

@font-face {
  font-family: '寒蝉书体';
  src: url('/public/fonts/寒蝉书体 春秋 秋鸿.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

/* 博物馆logo */
.museum-logo {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 120px;
  height: 40px;
  color: #f0d695;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 50;
}

/* 主内容区域 */
.main-content {
  position: absolute;
  top: 60px;
  left: 120px;
  right: 120px;
  bottom: 60px;
  display: flex;
  gap: 60px;
  z-index: 10;
}

/* 左侧展品名称区域 */
.artifact-name-section {
  flex: 0 0 200px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 80px;
  padding-left: 0;
  z-index: 11;
}

/* 中间副信息区域 */
.side-info-section {
  flex: 0 0 150px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 30px;
  padding-top: 80px;
  z-index: 11;
}

.side-info-item {
  color: #f0d695;
  font-size: 28px;
  font-family: 'ChillHuokai', sans-serif;
  writing-mode: vertical-rl;
}

.author-item {
  transform: translateY(0);
}

/* 右侧详情介绍区域 */
.detail-section {
  flex: 0 0 350px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding-bottom: 40px;
  z-index: 11;
}

.detail-content {
  color: #f0d695;
  font-size: 24px;
  font-family: 'Chill Hwo Kai', sans-serif;
  line-height: 2.2;
  letter-spacing: 2px;
}

/* 文物名 */
.artifact-name {
  color: #f0d695;
  font-size: 96px;
  font-weight: bold;
  font-family: '寒蝉书体', cursive;
  text-align: left;
  white-space: nowrap;
  writing-mode: vertical-rl;
  overflow: visible;
}

/* 朝代信息 */
.artifact-dynasty {
  width: 100%;
  color: #f0d695;
  font-size: 24px;
  text-align: left;
  margin-bottom: 45px;
}

/* 分隔线 */
.divider {
  width: 100%;
  height: 2px;
  background-color: #f0d695;
  margin: 45px 0;
}

/* 详细信息 */
.detail-info {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 20px;
}

.detail-item {
  width: 100%;
  color: #f0d695;
  font-size: 20px;
  margin-bottom: 25px;
  font-family: 'Chill Hwo Kai', sans-serif;
}

/* 最右侧3D模型区域 */
.model-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: transparent;
  z-index: 11;
}

.model-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.placeholder-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0d695;
  font-size: 24px;
}

/* 摄像头容器 - 全屏背景 */
.camera-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
}

.camera-container :deep(.video-display) {
  opacity: 0.5;
  filter: brightness(0.5);
}

/* 底部工具栏 */
.toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  z-index: 100;
}

.tool-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(196, 146, 16, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.tool-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tool-btn img.camera-off {
  opacity: 0.4;
  filter: grayscale(100%);
}

.tool-btn:hover {
  background-color: rgba(255, 255, 255, 1);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(196, 146, 16, 0.4);
}

/* 加载遮罩 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.loading-content {
  background-color: rgba(0, 0, 0, 0.95);
  border-radius: 15px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(196, 146, 16, 0.4);
  max-width: 400px;
  width: 90%;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(240, 214, 149, 0.3);
  border-top: 5px solid #f0d695;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-text {
  font-size: 18px;
  font-weight: bold;
  color: #f0d695;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 模型手指点 */
.model-finger-dot {
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 100;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .info-section {
    max-width: 100%;
    order: 2;
  }
  
  .model-section {
    flex: 1;
    min-width: 100%;
    order: 1;
  }
  
  .artifact-name,
  .artifact-dynasty,
  .detail-item {
    font-size: 14px;
    padding: 10px;
  }
}

@media (max-width: 768px) {
  .museum-logo {
    width: 100px;
    height: 32px;
    font-size: 12px;
  }
  
  .main-content {
    top: 70px;
    bottom: 70px;
  }
  
  .toolbar {
    height: 50px;
  }
  
  .tool-btn {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
}

</style>
