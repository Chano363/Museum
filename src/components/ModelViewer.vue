<template>
  <div class="model-viewer-container">
    <model-viewer
      ref="modelViewerRef"
      :src="modelPath"
      alt="3D Model"
      auto-rotate
      camera-controls
      poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f5f1e8'/%3E%3Ctext x='200' y='150' font-size='24' text-anchor='middle' fill='%233c2a1e'%3E加载模型中...%3C/text%3E%3C/svg%3E"
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
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(245, 241, 232, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(139, 0, 0, 0.2);
  border-top: 5px solid #8b0000;
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
  color: #3c2a1e;
}
</style>