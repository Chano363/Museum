<template>
  <div class="main-view">
    <div class="model-container">
      <model-viewer
        v-if="modelPath"
        :src="modelPath"
        alt="3D Model"
        auto-rotate
        camera-controls
        style="width: 100%; height: 100%;"
        @load="onModelLoaded"
        @error="onModelError"
      ></model-viewer>
      <div v-else class="placeholder-container">
        <div class="placeholder-text">请选择一个展品</div>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载模型中...</div>
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
      />
    </div>
    
    <div class="toolbar">
      <button class="tool-btn" @click="toggleCamera">
        {{ showCamera ? '📷' : '📵' }}
      </button>
      <button class="info-btn" @click="$emit('showInfo')">
        ℹ️
      </button>
    </div>
  </div>
</template>

<script>
import GestureControl from './GestureControl.vue'

export default {
  name: 'MainView',
  components: {
    GestureControl
  },
  props: {
    selectedArtifact: {
      type: Object,
      required: true
    }
  },
  emits: ['showInfo', 'nextModel', 'displayGestureHint'],
  data() {
    return {
      showCamera: false,
      videoWidth: 640,
      videoHeight: 480,
      isLoading: false
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
    }
  },
  methods: {
    onGestureAction(action) {
      console.log('检测到动作:', action)
      switch (action) {
        case 'swipe_left':
        case 'swipe_right':
          this.$emit('nextModel')
          this.$emit('displayGestureHint', '切换展品')
          break
        case 'tap':
          this.$emit('showInfo')
          this.$emit('displayGestureHint', '显示信息')
          break
        default:
          console.log('未处理的动作:', action)
      }
    },
    onGestureDetected(gesture) {
      console.log('检测到手势:', gesture)
    },
    toggleCamera() {
      this.showCamera = !this.showCamera
    },
    onModelLoaded() {
      console.log('模型加载成功:', this.modelPath)
      this.isLoading = false
    },
    onModelError(event) {
      console.error('模型加载失败:', event)
      this.isLoading = false
    }
  },
  watch: {
    selectedArtifact() {
      console.log('选中的展品已更新:', this.selectedArtifact)
      if (this.selectedArtifact && this.selectedArtifact.model === 'external' && this.selectedArtifact.modelPath) {
        this.isLoading = true
      }
    }
  }
}
</script>

<style scoped>
.main-view {
  position: absolute;
  top: 140px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(245, 241, 232, 0.95);
  overflow: hidden;
}

.model-container {
  width: 100%;
  height: calc(100% - 60px);
  position: relative;
  z-index: 1;
}

.placeholder-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.placeholder-text {
  font-size: 18px;
  color: #6b5645;
  font-weight: 500;
}

.camera-container {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 200px;
  height: 150px;
  z-index: 10;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  background-color: rgba(60, 42, 30, 0.1);
}

.toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: rgba(60, 42, 30, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  backdrop-filter: blur(5px);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.tool-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: rgba(245, 241, 232, 0.8);
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: #8b0000;
  color: white;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(139, 0, 0, 0.2);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.loading-content {
  background-color: rgba(245, 241, 232, 0.95);
  border-radius: 15px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(139, 0, 0, 0.2);
  border-top: 5px solid #8b0000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  font-weight: bold;
  color: #3c2a1e;
  margin-bottom: 20px;
}
</style>