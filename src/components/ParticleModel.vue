<template>
  <div class="particle-model" ref="containerRef">
    <div v-if="isLoading" class="particle-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>
    <div v-if="error" class="particle-error">
      <span>模型加载失败</span>
    </div>
  </div>
</template>

<script>
import { ParticleRenderer } from '../services/particleRenderer'

export default {
  name: 'ParticleModel',
  props: {
    modelPath: {
      type: String,
      required: true
    },
    particleSize: {
      type: Number,
      default: 0.006
    },
    maxParticles: {
      type: Number,
      default: 100000
    },
    animationSpeed: {
      type: Number,
      default: 1.0
    }
  },
  emits: ['loaded', 'error'],
  data() {
    return {
      isLoading: true,
      loadingText: '初始化渲染器...',
      error: null,
      renderer: null
    }
  },
  watch: {
    modelPath(newPath) {
      if (newPath) {
        this.loadModel(newPath)
      }
    }
  },
  mounted() {
    this.initRenderer()
    if (this.modelPath) {
      this.loadModel(this.modelPath)
    }
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.renderer) {
      this.renderer.dispose()
    }
  },
  methods: {
    initRenderer() {
      if (!this.$refs.containerRef) return
      
      this.renderer = new ParticleRenderer(this.$refs.containerRef, {
        particleSize: this.particleSize,
        maxParticles: this.maxParticles,
        animationSpeed: this.animationSpeed
      })
    },
    
    async loadModel(path) {
      if (!this.renderer) {
        this.initRenderer()
      }
      
      if (!this.renderer) {
        this.error = '渲染器初始化失败'
        this.$emit('error', this.error)
        return
      }
      
      this.isLoading = true
      this.loadingText = '加载粒子模型...'
      this.error = null
      
      try {
        await this.renderer.loadModel(path)
        this.renderer.start()
        this.isLoading = false
        this.$emit('loaded')
      } catch (err) {
        console.error('模型加载失败:', err)
        this.error = err.message || '模型加载失败'
        this.isLoading = false
        this.$emit('error', err)
      }
    },
    
    handleResize() {
      if (this.renderer) {
        this.renderer.resize()
      }
    },
    
    zoomIn() {
      if (this.renderer) {
        this.renderer.zoomIn()
      }
    },
    
    zoomOut() {
      if (this.renderer) {
        this.renderer.zoomOut()
      }
    },
    
    rotate(deltaX, deltaY) {
      if (this.renderer) {
        this.renderer.rotate(deltaX, deltaY)
      }
    },
    
    reset() {
      if (this.renderer) {
        this.renderer.reset()
      }
    }
  }
}
</script>

<style scoped>
.particle-model {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: transparent;
  border-radius: 8px;
  overflow: hidden;
}

.particle-model canvas {
  display: block;
}

.particle-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 10;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(196, 146, 16, 0.3);
  border-top: 4px solid #C49210;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  color: #C49210;
  font-size: 16px;
  font-family: var(--font-family);
}

.particle-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.9);
  color: #ff6b6b;
  font-size: 18px;
  z-index: 10;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
