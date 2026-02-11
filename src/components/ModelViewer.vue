<template>
  <div class="model-viewer-container">
    <model-viewer
      ref="modelViewerRef"
      :src="modelPath"
      alt="3D Model"
      auto-rotate
      camera-controls
      poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f2f2f2'/%3E%3Ctext x='200' y='150' font-size='24' text-anchor='middle' fill='%23C49210'%3E加载模型中...%3C/text%3E%3C/svg%3E"
      style="width: 100%; height: 100%;"
      @load="onModelLoad"
      @error="onModelError"
    >
      <div slot="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载模型中...</div>
      </div>
    </model-viewer>
  </div>
</template>

<script>
export default {
  name: 'ModelViewer',
  props: {
    modelPath: {
      type: String,
      required: true
    }
  },
  emits: ['model-loaded', 'model-error'],
  methods: {
    onModelLoad() {
      console.log('模型加载成功:', this.modelPath)
      this.$emit('model-loaded')
    },
    onModelError(event) {
      console.error('模型加载失败:', event)
      this.$emit('model-error', event)
    },
    // 重置相机位置
    resetCamera() {
      if (this.$refs.modelViewerRef) {
        this.$refs.modelViewerRef.resetCamera()
      }
    },
    // 旋转模型
    rotate(delta) {
      if (this.$refs.modelViewerRef) {
        const currentRotation = this.$refs.modelViewerRef.cameraOrbit || '0deg 75deg 100%'
        const [yaw, pitch, radius] = currentRotation.split(' ')
        const newYaw = parseFloat(yaw) + delta
        this.$refs.modelViewerRef.cameraOrbit = `${newYaw}deg ${pitch} ${radius}`
      }
    },
    // 缩放模型
    zoom(delta) {
      if (this.$refs.modelViewerRef) {
        const currentRadius = this.$refs.modelViewerRef.cameraOrbit ? 
          parseFloat(this.$refs.modelViewerRef.cameraOrbit.split(' ')[2]) : 100
        const newRadius = Math.max(10, Math.min(200, currentRadius - delta * 100))
        const currentRotation = this.$refs.modelViewerRef.cameraOrbit || '0deg 75deg 100%'
        const [yaw, pitch] = currentRotation.split(' ')
        this.$refs.modelViewerRef.cameraOrbit = `${yaw} ${pitch} ${newRadius}%`
      }
    },
    // 平移模型
    pan(deltaX, deltaY) {
      if (this.$refs.modelViewerRef) {
        const currentTarget = this.$refs.modelViewerRef.cameraTarget || '0m 0m 0m'
        const [x, y, z] = currentTarget.split(' ').map(val => parseFloat(val))
        const newX = x + deltaX
        const newY = y + deltaY
        this.$refs.modelViewerRef.cameraTarget = `${newX}m ${newY}m ${z}m`
      }
    },
    // 播放动作
    playAction(action) {
      console.log('播放动作:', action)
      // 这里可以添加动作的具体实现
      // 例如，播放动画、切换视角等
    }
  },
  mounted() {
    // 确保模型查看器正确初始化
    console.log('ModelViewer mounted')
  }
}
</script>

<style scoped>
.model-viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
  font-family: var(--font-family);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(242, 242, 242, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(196, 146, 16, 0.2);
  border-top: 5px solid var(--text-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
}
</style>