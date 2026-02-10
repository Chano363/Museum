<template>
  <div class="main-view">
    <div class="model-container">
      <model-viewer
        ref="modelViewerRef"
        v-if="modelPath"
        :src="modelPath"
        alt="3D Model"
        auto-rotate
        camera-controls
        camera-orbit="0deg 75deg 0.1m"
        min-camera-orbit-distance="0.1m"
        max-camera-orbit-distance="1m"
        style="width: 100%; height: 100%;"
        @load="onModelLoaded"
        @error="onModelError"
        @camera-change="onCameraChange"
      ></model-viewer>
      <!-- 3D模型上的粒子效果 -->
      <ThreeParticleEffect 
        v-if="modelPath"
        :particleCount="1000"
        :particleSize="0.02"
        :particleColor="'#C49210'"
        :particleOpacity="0.8"
        :modelRotation="modelRotation"
        :rotationSpeed="rotationSpeed"
        :isRotating="isRotating"
        :enableTrailMode="enableTrailMode"
      />
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
        @finger-move="onFingerMove"
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
import ThreeParticleEffect from './ThreeParticleEffect.vue'

export default {
  name: 'MainView',
  components: {
    GestureControl,
    ThreeParticleEffect
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
      isLoading: false,
      modelRotation: 0,
      prevModelRotation: 0,
      rotationSpeed: 0,
      isRotating: false,
      rotationStartTime: 0,
      rotationStopTime: 0,
      enableTrailMode: false,
      lastRotationTime: performance.now(),
      lastCameraChangeTime: performance.now()
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
    // 重置模型视图
    resetModelView() {
      const modelViewer = this.$refs.modelViewerRef
      if (!modelViewer) return
      
      console.log('重置模型视图')
      // 重置相机参数
      try {
        modelViewer.resetCamera()
      } catch (error) {
        console.error('重置相机失败:', error)
        // 手动设置默认值
        modelViewer.cameraOrbit = '0deg 75deg 0.1m'
      }
    },
    
    // 放大模型
    zoomIn() {
      const modelViewer = this.$refs.modelViewerRef
      if (!modelViewer) return
      
      console.log('放大模型')
      // 通过减小相机轨道距离来放大
      try {
        if (modelViewer.cameraOrbit) {
          const currentOrbit = modelViewer.cameraOrbit.split(' ')
          if (currentOrbit.length >= 3) {
            const currentDistance = parseFloat(currentOrbit[2])
            const newDistance = Math.max(0.1, currentDistance - 0.1)
            modelViewer.cameraOrbit = `${currentOrbit[0]} ${currentOrbit[1]} ${newDistance.toFixed(2)}m`
          }
        }
      } catch (error) {
        console.error('放大模型失败:', error)
      }
    },
    
    // 缩小模型
    zoomOut() {
      const modelViewer = this.$refs.modelViewerRef
      if (!modelViewer) return
      
      console.log('缩小模型')
      // 通过增大相机轨道距离来缩小
      try {
        if (modelViewer.cameraOrbit) {
          const currentOrbit = modelViewer.cameraOrbit.split(' ')
          if (currentOrbit.length >= 3) {
            const currentDistance = parseFloat(currentOrbit[2])
            const newDistance = Math.min(1, currentDistance + 0.1)
            modelViewer.cameraOrbit = `${currentOrbit[0]} ${currentOrbit[1]} ${newDistance.toFixed(2)}m`
          }
        }
      } catch (error) {
        console.error('缩小模型失败:', error)
      }
    },
    
    onGestureAction(action) {
      console.log('检测到动作:', action)
      switch (action) {
        case 'drop': // 张开手 - 重置视图
          this.resetModelView()
          this.$emit('displayGestureHint', '重置视图')
          break
        case 'zoom_in': // 点赞 - 放大模型
          this.zoomIn()
          this.$emit('displayGestureHint', '放大模型')
          break
        case 'zoom_out': // 拇指向下 - 缩小模型
          this.zoomOut()
          this.$emit('displayGestureHint', '缩小模型')
          break
        case 'drag': // 拳头 - 切换展品
          this.$emit('nextModel')
          this.$emit('displayGestureHint', '切换展品')
          break
        case 'tap': // OK手势 - 显示信息
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
    
    // 处理手指移动事件
    onFingerMove(data) {
      const modelViewer = this.$refs.modelViewerRef
      if (!modelViewer) return
      
      console.log('手指移动:', data)
      
      // 计算移动速度和方向
      const { deltaX, deltaY } = data
      
      // 控制模型旋转
      // 注意：这里需要根据model-viewer的实际API进行调整
      try {
        // 方法1：使用turntableRotation属性（如果支持）
        if (modelViewer.turntableRotation !== undefined) {
          const currentTime = performance.now()
          
          // 记录之前的旋转状态
          this.prevModelRotation = this.modelRotation
          
          // 水平移动控制水平旋转
          modelViewer.turntableRotation += deltaX * 0.001
          // 更新模型旋转状态，用于粒子效果
          this.modelRotation = modelViewer.turntableRotation
          
          // 计算旋转速度
          const rotationChange = Math.abs(this.modelRotation - this.prevModelRotation)
          this.rotationSpeed = rotationChange / (currentTime - (this.lastRotationTime || currentTime)) * 1000
          this.lastRotationTime = currentTime
          
          // 检测旋转状态变化
          if (!this.isRotating) {
            // 开始旋转
            this.isRotating = true
            this.rotationStartTime = currentTime
            this.rotationStopTime = 0
            console.log('开始旋转，速度:', this.rotationSpeed)
          } else {
            // 重置停止时间
            this.rotationStopTime = 0
            console.log('旋转中，速度:', this.rotationSpeed)
          }
          
          // 调试日志
          console.log('旋转状态:', {
            isRotating: this.isRotating,
            modelRotation: this.modelRotation,
            rotationSpeed: this.rotationSpeed,
            deltaX: deltaX
          })
        } else {
          // 方法2：使用相机控制（备选方案）
          console.log('turntableRotation属性不可用，使用备选方案')
        }
        
        // 可以添加垂直移动控制，例如上下倾斜
        // if (modelViewer.cameraTarget) {
        //   modelViewer.cameraTarget.y += deltaY * 0.01
        // }
      } catch (error) {
        console.error('控制模型失败:', error)
      }
    },
    
    // 检测旋转停止
    checkRotationStop() {
      if (this.isRotating && this.rotationStopTime === 0) {
        this.rotationStopTime = performance.now()
      }
      
      // 如果旋转停止超过300ms，标记为停止
      if (this.isRotating && this.rotationStopTime > 0 && performance.now() - this.rotationStopTime > 300) {
        this.isRotating = false
        this.rotationSpeed = 0
      }
    },
    
    toggleCamera() {
      console.log('=== 切换摄像头事件触发 ===')
      this.showCamera = !this.showCamera
      console.log('摄像头显示状态:', this.showCamera)
    },
    onModelLoaded() {
      console.log('模型加载成功:', this.modelPath)
      this.isLoading = false
    },
    onModelError(event) {
      console.error('模型加载失败:', event)
      this.isLoading = false
    },
    
    // 监听相机变化事件
    onCameraChange() {
      const modelViewer = this.$refs.modelViewerRef
      if (!modelViewer) return
      
      try {
        if (modelViewer.turntableRotation !== undefined) {
          const currentTime = performance.now()
          
          // 记录之前的旋转状态
          const prevRotation = this.modelRotation
          
          // 更新模型旋转状态
          this.modelRotation = modelViewer.turntableRotation
          
          // 计算旋转速度
          const rotationChange = Math.abs(this.modelRotation - prevRotation)
          const speed = rotationChange / (currentTime - this.lastCameraChangeTime || 1) * 1000
          
          // 更新最后相机变化时间
          this.lastCameraChangeTime = currentTime
          
          // 检测旋转状态变化
          if (rotationChange > 0.001) { // 检测到旋转
            if (!this.isRotating) {
              // 开始旋转
              this.isRotating = true
              this.rotationStartTime = currentTime
              this.rotationStopTime = 0
              console.log('相机旋转开始，速度:', speed)
            } else {
              // 重置停止时间
              this.rotationStopTime = 0
            }
            
            // 更新旋转速度
            this.rotationSpeed = speed
            console.log('相机旋转中，速度:', speed, '旋转角度:', this.modelRotation)
          }
        }
      } catch (error) {
        console.error('相机变化事件处理失败:', error)
      }
    }
  },
  mounted() {
    // 启动旋转状态检查定时器
    this.rotationCheckInterval = setInterval(this.checkRotationStop, 100)
  },
  
  beforeUnmount() {
    // 清理定时器
    if (this.rotationCheckInterval) {
      clearInterval(this.rotationCheckInterval)
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
  background-color: var(--background-color);
  overflow: hidden;
  font-family: var(--font-family);
}

.model-container {
  width: 100%;
  height: calc(100% - 60px);
  position: relative;
  z-index: 2;
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
  color: #ccc;
  font-weight: 500;
}

.camera-container {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 200px;
  height: 150px;
  z-index: 50;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  background-color: rgba(196, 146, 16, 0.05);
}

.toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: rgba(196, 146, 16, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  backdrop-filter: blur(5px);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
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
  background-color: var(--text-color);
  color: white;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(196, 146, 16, 0.2);
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
  background-color: rgba(40, 40, 40, 0.95);
  border-radius: 15px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  max-width: 400px;
  width: 90%;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(196, 146, 16, 0.2);
  border-top: 5px solid var(--text-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-text {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

</style>