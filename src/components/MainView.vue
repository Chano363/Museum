<template>
  <div class="main-view">
    <div class="model-container">
      <model-viewer
        ref="modelViewerRef"
        v-if="modelPath"
        :src="modelPath"
        alt="3D Model"
        auto-rotate="false"
        camera-orbit="0deg 75deg 0.5m"
        min-camera-orbit-distance="0.1m"
        max-camera-orbit-distance="1m"
        style="width: 100%; height: 100%; pointer-events: auto;"
        @load="onModelLoaded"
        @error="onModelError"
        interaction-policy="always-allow"
        enable-pan
        enable-zoom
        enable-rotate
        camera-controls
        touch-action="none"
      ></model-viewer>
      <div v-else class="placeholder-container">
        <div class="placeholder-text">请选择一个展品</div>
      </div>
      
      <!-- 3D模型上的小白点 -->
      <div v-if="isFingerTracking && modelFingerPosition"
           class="model-finger-dot"
           :style="{ left: modelFingerPosition.x + '%', top: modelFingerPosition.y + '%' }">
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
      <button v-if="isDev" class="tool-btn" @click="exportLogs">
        📋
      </button>
    </div>
  </div>
</template>

<script>
import GestureControl from './GestureControl.vue'
import { MODEL_CONTROL_CONFIG } from '../constants/gestureConstants'

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
      isLoading: false,
      isFingerTracking: false,
      modelFingerPosition: null
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
        modelViewer.cameraOrbit = '0deg 75deg 0.1m'
      } catch (error) {
        console.error('重置相机失败:', error)
      }
    },
    
    // 放大模型
    zoomIn() {
      const modelViewer = this.$refs.modelViewerRef
      if (!modelViewer) {
        console.log('放大模型失败: modelViewerRef 未找到')
        return
      }
      
      console.log('放大模型')
      // 通过减小相机轨道距离来放大
      try {
        // 获取当前相机轨道
        const currentOrbitStr = modelViewer.getAttribute('camera-orbit') || MODEL_CONTROL_CONFIG.DEFAULT_CAMERA_ORBIT
        console.log('当前轨道:', currentOrbitStr)
        const currentOrbit = currentOrbitStr.split(' ')
        
        if (currentOrbit.length >= 3) {
          const currentDistance = parseFloat(currentOrbit[2])
          console.log('当前距离:', currentDistance)
          const newDistance = Math.max(MODEL_CONTROL_CONFIG.MIN_CAMERA_DISTANCE, currentDistance - MODEL_CONTROL_CONFIG.ZOOM_STEP)
          console.log('新距离:', newDistance)
          // 使用 setAttribute 方法来修改相机轨道
          modelViewer.setAttribute('camera-orbit', `${currentOrbit[0]} ${currentOrbit[1]} ${newDistance.toFixed(2)}m`)
          console.log('已更新相机轨道')
        }
      } catch (error) {
        console.error('放大模型失败:', error)
      }
    },
    
    // 缩小模型
    zoomOut() {
      const modelViewer = this.$refs.modelViewerRef
      if (!modelViewer) {
        console.log('缩小模型失败: modelViewerRef 未找到')
        return
      }
      
      console.log('缩小模型')
      // 通过增大相机轨道距离来缩小
      try {
        // 获取当前相机轨道
        const currentOrbitStr = modelViewer.getAttribute('camera-orbit') || MODEL_CONTROL_CONFIG.DEFAULT_CAMERA_ORBIT
        console.log('当前轨道:', currentOrbitStr)
        const currentOrbit = currentOrbitStr.split(' ')
        
        if (currentOrbit.length >= 3) {
          const currentDistance = parseFloat(currentOrbit[2])
          console.log('当前距离:', currentDistance)
          // 增大相机轨道距离来缩小
          const newDistance = Math.min(MODEL_CONTROL_CONFIG.MAX_CAMERA_DISTANCE, currentDistance + MODEL_CONTROL_CONFIG.ZOOM_STEP)
          console.log('新距离:', newDistance)
          // 使用 setAttribute 方法来修改相机轨道
          modelViewer.setAttribute('camera-orbit', `${currentOrbit[0]} ${currentOrbit[1]} ${newDistance.toFixed(2)}m`)
          console.log('已更新相机轨道')
        }
      } catch (error) {
        console.error('缩小模型失败:', error)
      }
    },
    
    onGestureAction(action) {
      if (!action) {
        console.log('未检测到动作')
        return
      }
      
      console.log('=== 检测到动作 ===', action)
      console.log('modelViewerRef:', this.$refs.modelViewerRef)
      console.log('action 类型:', typeof action, 'action 值:', action)
      
      switch (action) {
        case 'reset': // 手掌/释放 - 重置视图
          console.log('执行重置视图')
          this.resetModelView()
          this.$emit('displayGestureHint', '重置视图')
          break
        case 'zoom_in': // 点赞 - 放大模型
          console.log('执行放大模型')
          this.zoomIn()
          this.$emit('displayGestureHint', '放大模型')
          break
        case 'zoom_out': // 点踩 - 缩小模型
          console.log('执行缩小模型')
          this.zoomOut()
          this.$emit('displayGestureHint', '缩小模型')
          break
        case 'switch': // 拳头 - 切换展品
          console.log('执行切换展品')
          this.$emit('nextModel')
          this.$emit('displayGestureHint', '切换展品')
          break
        case 'show_info': // OK手势 - 显示信息
          console.log('执行显示信息')
          this.$emit('showInfo')
          this.$emit('displayGestureHint', '显示信息')
          break
        case 'rotate': // 手指/一指 - 移动模型
          console.log('手指移动 - 移动模型')
          this.isFingerTracking = true
          break
        default:
          break
      }
    },onGestureDetected(gesture) {
      console.log('检测到手势:', gesture)
    },
    
    // 处理手指移动事件
    onFingerMove(data) {
      console.log('MainView.onFingerMove: 接收到手指移动事件:', data)
      if (!data) {
        console.log('MainView.onFingerMove: 无效的手指移动事件数据')
        this.isFingerTracking = false
        this.modelFingerPosition = null
        return
      }
      
      const { deltaX, deltaY, position } = data
      console.log('MainView.onFingerMove: 手指移动距离:', { deltaX, deltaY })
      console.log('MainView.onFingerMove: 手指位置:', position)
      
      const modelViewer = this.$refs.modelViewerRef
      console.log('MainView.onFingerMove: modelViewerRef:', modelViewer)
      
      if (!modelViewer) {
        console.log('MainView.onFingerMove: modelViewerRef 未获取到')
        return
      }
      
      try {
        // 计算并更新3D模型上的小白点位置
        if (position) {
          // 将摄像头坐标映射到3D模型容器的百分比位置
          // 假设摄像头坐标范围是 0-640 (x), 0-480 (y)
          const modelX = (position.x / 640) * 100
          const modelY = (position.y / 480) * 100
          
          // 确保坐标在合理范围内
          const clampedX = Math.max(0, Math.min(100, modelX))
          const clampedY = Math.max(0, Math.min(100, modelY))
          
          this.modelFingerPosition = {
            x: clampedX,
            y: clampedY
          }
          console.log('MainView.onFingerMove: 更新3D模型上的小白点位置:', this.modelFingerPosition)
          
          // 获取model-viewer元素的位置和尺寸
          const rect = modelViewer.getBoundingClientRect()
          console.log('MainView.onFingerMove: model-viewer元素位置和尺寸:', rect)
          
          // 将百分比位置转换为像素位置
          const clientX = rect.left + (clampedX / 100) * rect.width
          const clientY = rect.top + (clampedY / 100) * rect.height
          console.log('MainView.onFingerMove: 转换后的鼠标位置:', { clientX, clientY })
          
          // 模拟鼠标事件
          this.simulateMouseDrag(modelViewer, clientX, clientY, deltaX, deltaY)
        } else if (deltaX !== undefined && deltaY !== undefined) {
          // 如果没有position数据，使用deltaX和deltaY估算位置
          // 基于当前位置或中心位置进行估算
          const currentX = this.modelFingerPosition?.x || 50
          const currentY = this.modelFingerPosition?.y || 50
          
          // 基于delta值调整位置
          const sensitivity = 2 // 调整白点移动灵敏度
          const newX = Math.max(0, Math.min(100, currentX + deltaX * sensitivity))
          const newY = Math.max(0, Math.min(100, currentY + deltaY * sensitivity))
          
          this.modelFingerPosition = {
            x: newX,
            y: newY
          }
          console.log('MainView.onFingerMove: 使用delta估算小白点位置:', this.modelFingerPosition)
          
          // 获取model-viewer元素的位置和尺寸
          const rect = modelViewer.getBoundingClientRect()
          
          // 将百分比位置转换为像素位置
          const clientX = rect.left + (newX / 100) * rect.width
          const clientY = rect.top + (newY / 100) * rect.height
          
          // 模拟鼠标事件
          this.simulateMouseDrag(modelViewer, clientX, clientY, deltaX, deltaY)
        }
      } catch (error) {
        console.error('控制模型失败:', error)
      }
    },
    
    // 模拟鼠标拖拽事件
    simulateMouseDrag(element, clientX, clientY, deltaX, deltaY) {
      console.log('MainView.simulateMouseDrag: 模拟鼠标拖拽事件')
      
      // 计算移动后的位置
      const moveX = clientX + deltaX * 2 // 增加灵敏度
      const moveY = clientY + deltaY * 2
      
      console.log('MainView.simulateMouseDrag: 鼠标按下位置:', { clientX, clientY })
      console.log('MainView.simulateMouseDrag: 鼠标移动位置:', { moveX, moveY })
      
      // 模拟鼠标按下事件
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: clientX,
        clientY: clientY,
        buttons: 1, // 左键
        button: 0 // 左键
      })
      element.dispatchEvent(mousedownEvent)
      console.log('MainView.simulateMouseDrag: 已发送 mousedown 事件')
      
      // 模拟鼠标移动事件
      const mousemoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: moveX,
        clientY: moveY,
        buttons: 1, // 左键
        button: 0 // 左键
      })
      element.dispatchEvent(mousemoveEvent)
      console.log('MainView.simulateMouseDrag: 已发送 mousemove 事件')
      
      // 模拟鼠标释放事件
      const mouseupEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: moveX,
        clientY: moveY,
        buttons: 0,
        button: 0
      })
      element.dispatchEvent(mouseupEvent)
      console.log('MainView.simulateMouseDrag: 已发送 mouseup 事件')
    },
    
    toggleCamera() {
      console.log('=== 切换摄像头事件触发 ===')
      this.showCamera = !this.showCamera
      console.log('摄像头显示状态:', this.showCamera)
    },
    
    // 导出控制台日志
    exportLogs() {
      console.log('开始导出控制台日志')
      
      // 检查是否存在 consoleLogs 数组
      if (window.consoleLogs && window.consoleLogs.length > 0) {
        // 使用存储的日志
        const logContent = window.consoleLogs.map(log => {
          return `${log.timestamp}: ${log.message}`;
        }).join('\n');
        
        console.log('使用存储的日志，共', window.consoleLogs.length, '条');
        this.downloadLogs(logContent);
      } else {
        // 尝试从控制台捕获日志
        console.log('尝试从控制台捕获日志');
        
        // 生成测试日志
        const testLogs = [
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
        ];
        
        const logContent = testLogs.map(log => {
          return `${log.timestamp}: ${log.message}`;
        }).join('\n');
        
        this.downloadLogs(logContent);
      }
    },
    
    // 下载日志文件
    downloadLogs(logContent) {
      console.log('日志内容长度:', logContent.length);
      
      // 创建下载链接
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `console-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
      console.log('下载链接创建成功:', a.download);
      
      a.click();
      
      // 清理
      URL.revokeObjectURL(url);
      
      console.log('控制台日志导出完成');
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
  mounted() {
    console.log('MainView mounted, selectedArtifact:', this.selectedArtifact)
    console.log('modelPath:', this.modelPath)
  },
  
  beforeUnmount() {
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

</style>