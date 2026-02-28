<template>
  <div class="user-gallery-view">
    <div class="gallery-logo">
      我的作品
    </div>
    
    <div class="main-content">
      <div class="artifact-name-section">
        <div class="artifact-name">
          {{ currentArtwork?.name || '暂无作品' }}
        </div>
      </div>
      
      <div class="side-info-section">
        <div class="side-info-item">风格: {{ currentArtwork?.style || '未知' }}</div>
        <div class="side-info-item author-item">模型: {{ getModelName(currentArtwork?.base_model) }}</div>
      </div>
      
      <div class="detail-section">
        <div class="detail-content">
          {{ currentArtwork?.prompt || '暂无描述' }}
        </div>
      </div>
      
      <div class="model-section">
        <div class="model-container">
          <model-viewer
            v-if="modelPath"
            ref="modelViewerRef"
            :src="modelPath"
            :style="modelStyle"
            camera-controls
            auto-rotate
            shadow-intensity="0"
            exposure="1.2"
            @load="onModelLoaded"
          />
          <div v-else class="placeholder-container">
            <div class="placeholder-text">暂无作品</div>
          </div>
          
          <div v-if="isFingerTracking && modelFingerPosition"
               class="model-finger-dot"
               :style="{ left: modelFingerPosition.x + '%', top: modelFingerPosition.y + '%' }">
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>
    </div>
    
    <div v-if="isEmpty" class="empty-overlay">
      <div class="empty-content">
        <svg viewBox="0 0 24 24" width="64" height="64">
          <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
        <div class="empty-text">暂无作品</div>
        <div class="empty-hint">去创作您的第一个作品吧</div>
      </div>
    </div>
    
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
    </div>
    
    <SettingView 
      v-if="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>

<script>
import GestureControl from './GestureControl.vue'
import SettingView from './SettingView.vue'
import { BASE_MODELS } from '../constants/vaseConstants'

export default {
  name: 'UserGalleryView',
  components: {
    GestureControl,
    SettingView
  },
  props: {
    selectedIndex: {
      type: Number,
      default: 0
    }
  },
  emits: ['nextModel', 'prevModel', 'displayGestureHint', 'toggleThumbBar', 'loaded'],
  data() {
    return {
      artworks: [],
      showCamera: false,
      videoWidth: 640,
      videoHeight: 480,
      isLoading: true,
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
    isEmpty() {
      return this.artworks.length === 0 && !this.isLoading
    },
    currentArtwork() {
      if (this.artworks.length === 0) return null
      const index = Math.min(this.selectedIndex, this.artworks.length - 1)
      return this.artworks[index]
    },
    modelPath() {
      if (!this.currentArtwork) return null
      const baseModel = BASE_MODELS.find(m => m.id === this.currentArtwork.base_model)
      return baseModel?.modelPath || '/3Dmodels/瓷器花瓶/scene.gltf'
    },
    modelStyle() {
      return {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent'
      }
    }
  },
  methods: {
    getModelName(modelId) {
      const model = BASE_MODELS.find(m => m.id === modelId)
      return model?.name || '未知'
    },
    async loadArtworks() {
      this.isLoading = true
      try {
        const response = await fetch('/api/gallery/list')
        const data = await response.json()
        if (data.success) {
          this.artworks = data.artworks.map(artwork => ({
            ...artwork,
            textureUrl: artwork.texture_url || artwork.image_url
          }))
        }
      } catch (e) {
        console.error('Failed to load artworks:', e)
      } finally {
        this.isLoading = false
        this.$emit('loaded', this.artworks)
      }
    },
    async applyTexture() {
      if (!this.$refs.modelViewerRef || !this.currentArtwork?.textureUrl) return
      
      const modelViewer = this.$refs.modelViewerRef
      await modelViewer.updateComplete
      
      const material = modelViewer.model?.materials?.[0]
      if (material) {
        const texture = await modelViewer.createTexture(this.currentArtwork.textureUrl)
        material.pbrMetallicRoughness.baseColorTexture.setTexture(texture)
      }
    },
    onGestureAction(action) {
      if (!action) return
      
      switch (action) {
        case 'zoom_in':
          this.$emit('displayGestureHint', '放大模型')
          break
        case 'zoom_out':
          this.$emit('displayGestureHint', '缩小模型')
          break
        case 'switch':
        case 'switch_next':
          this.$emit('nextModel')
          this.$emit('displayGestureHint', '切换作品')
          break
        case 'switch_prev':
          this.$emit('prevModel')
          this.$emit('displayGestureHint', '切换作品')
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
      
      const modelViewer = this.$refs.modelViewerRef
      if (modelViewer) {
        const orbit = modelViewer.getCameraOrbit()
        const newTheta = orbit.theta - (deltaX * sensitivity * Math.PI / 180)
        const newPhi = orbit.phi - (deltaY * sensitivity * Math.PI / 180)
        modelViewer.cameraOrbit = `${newTheta}rad ${newPhi}rad ${orbit.radius}m`
      }
      
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
    onModelLoaded() {
      this.isLoading = false
      this.applyTexture()
      if (!this.showCamera) {
        this.toggleCamera()
      }
    }
  },
  mounted() {
    this.loadArtworks()
  },
  beforeUnmount() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  },
  watch: {
    selectedIndex() {
      this.$nextTick(() => {
        this.applyTexture()
      })
    }
  }
}
</script>

<style scoped>
.user-gallery-view {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--background-color);
  overflow: hidden;
  font-family: var(--font-family);
}

.gallery-logo {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 120px;
  height: 40px;
  color: #f0d695;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-family: '寒蝉书体', cursive;
  z-index: 50;
}

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

.artifact-name-section {
  flex: 0 0 200px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 80px;
  padding-left: 0;
  z-index: 11;
}

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
}

.empty-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 500;
}

.empty-content {
  text-align: center;
  color: #f0d695;
}

.empty-content svg {
  opacity: 0.5;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 24px;
  margin-bottom: 10px;
}

.empty-hint {
  font-size: 16px;
  opacity: 0.7;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

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

@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .artifact-name,
  .side-info-item,
  .detail-content {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .gallery-logo {
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
  }
}
</style>
