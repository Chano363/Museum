<template>
  <div class="gesture-control">
    <CameraView
      ref="cameraViewRef"
      :width="width"
      :height="height"
      :show-overlay="showOverlay"
      @frame="onFrame"
      @detections="onDetections"
    />
    
    <div v-if="isInitializing" class="init-overlay">
      <div class="init-content">
        <div class="init-spinner"></div>
        <div class="init-text">初始化手势识别服务...</div>
        <div class="init-progress-bar">
          <div class="init-progress" :style="{ width: initProgress + '%' }"></div>
        </div>
        <div class="init-status">{{ initStatus }}</div>
      </div>
    </div>
    
    <div v-if="currentAction" class="action-feedback">
      <span class="action-icon">{{ getActionIcon(currentAction) }}</span>
      <span>{{ getActionText(currentAction) }}</span>
    </div>
    
    <div v-if="currentGesture" class="gesture-feedback">
      <span class="gesture-feedback-icon">{{ getGestureIcon(currentGesture.gesture) }}</span>
      <div class="gesture-feedback-info">
        <div class="gesture-feedback-name">{{ getGestureName(currentGesture.gesture) }}</div>
        <div class="gesture-feedback-confidence">{{ Math.round(currentGesture.bbox.confidence * 100) }}% 置信度</div>
      </div>
    </div>
    
    <div v-if="showGuide" class="gesture-guide">
      <h3>手势指南</h3>
      <div class="guide-item">
        <span class="gesture-icon">🖐️</span>
        <span class="gesture-desc">手掌：重置视图</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">👍</span>
        <span class="gesture-desc">点赞：放大模型</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">👎</span>
        <span class="gesture-desc">点踩：缩小模型</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">✊</span>
        <span class="gesture-desc">拳头：切换展品</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">👌</span>
        <span class="gesture-desc">OK手势：显示信息</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">☝️</span>
        <span class="gesture-desc">手指指向：移动模型</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import CameraView from './CameraView.vue'
import { BackendGestureRecognitionService } from '../services/backendGestureRecognition'
import { ActionRecognitionService } from '../services/actionRecognition'
import { MediaPipeHandTrackingService } from '../services/mediaPipeHandTracking'

export default {
  name: 'GestureControl',
  components: {
    CameraView
  },
  props: {
    width: {
      type: Number,
      default: 640
    },
    height: {
      type: Number,
      default: 480
    },
    showOverlay: {
      type: Boolean,
      default: true
    },
    showGuide: {
      type: Boolean,
      default: true
    }
  },
  emits: ['action', 'gesture', 'finger-move'],
  setup(props, { emit }) {
    const cameraViewRef = ref(null)
    const gestureService = new BackendGestureRecognitionService()
    const actionService = new ActionRecognitionService()
    const mediaPipeService = new MediaPipeHandTrackingService()
    
    const currentAction = ref(null)
    const currentGesture = ref(null)
    const isInitializing = ref(false)
    const initProgress = ref(0)
    const initStatus = ref('')
    let isInitialized = false
    
    // MediaPipe相关状态
    const isMediaPipeEnabled = ref(false)
    const isMediaPipeInitializing = ref(false)
    let mediaPipeInitialized = false
    
    // 手指追踪相关状态
    const isFingerTracking = ref(false)
    const lastFingerPosition = ref({ x: 0, y: 0 })
    const currentFingerPosition = ref({ x: 0, y: 0 })

    const onFrame = async (imageData) => {
      if (!isInitialized) return
      
      try {
        const detections = await gestureService.processFrame(imageData)
        cameraViewRef.value?.updateDetections(detections)
        
        // 检测手指追踪
        if (detections.length > 0) {
          const hand = detections[0]
          
          // 计算手部中心点作为手指位置
          const centerX = (hand.bbox.x1 + hand.bbox.x2) / 2
          const centerY = (hand.bbox.y1 + hand.bbox.y2) / 2
          currentFingerPosition.value = { x: centerX, y: centerY }
          
          // 检测POINT手势（手指指向）- 同时检查数字ID和字符串名称
          const isPointGesture = hand.gesture === 19 || hand.gestureName === 'point'
          if (isPointGesture) { // POINT手势
            if (!isFingerTracking.value) {
              // 开始追踪
              isFingerTracking.value = true
              lastFingerPosition.value = { x: centerX, y: centerY }
              console.log('开始手指追踪')
            } else {
              // 计算位置变化
              const deltaX = centerX - lastFingerPosition.value.x
              const deltaY = centerY - lastFingerPosition.value.y
              
              // 只有当变化足够大时才触发移动
              if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                // 发送手指移动事件
                emit('finger-move', {
                  deltaX: deltaX,
                  deltaY: deltaY,
                  position: { x: centerX, y: centerY }
                })
                
                // 更新最后位置
                lastFingerPosition.value = { x: centerX, y: centerY }
              }
            }
          } else {
            // 不是POINT手势，停止追踪
            if (isFingerTracking.value) {
              isFingerTracking.value = false
              console.log('停止手指追踪')
            }
          }
        } else {
          // 没有检测到手，停止追踪
          if (isFingerTracking.value) {
            isFingerTracking.value = false
            console.log('停止手指追踪：未检测到手')
          }
        }
        
        // 更新动作识别
        const action = actionService.updateDetections(detections)
        
        if (action && action !== currentAction.value) {
          currentAction.value = action
          emit('action', action)
          
          // 3秒后清除动作反馈
          setTimeout(() => {
            if (currentAction.value === action) {
              currentAction.value = null
            }
          }, 3000)
        }
        
        // 发送手势事件
        if (detections.length > 0) {
          const gesture = detections[0]
          emit('gesture', gesture)
          
          // 更新当前手势状态，用于反馈
          currentGesture.value = gesture
          
          // 3秒后清除手势反馈
          setTimeout(() => {
            if (currentGesture.value === gesture) {
              currentGesture.value = null
            }
          }, 2000)
        } else {
          // 没有检测到手，清除手势反馈
          if (currentGesture.value) {
            currentGesture.value = null
          }
        }
      } catch (error) {
        console.error('手势处理失败:', error)
      }
    }

    const onDetections = (detections) => {
      console.log('检测到手势:', detections)
    }

    const getActionIcon = (action) => {
      const iconMap = {
        swipe_left: '👈',
        swipe_right: '👉',
        swipe_up: '👆',
        swipe_down: '👇',
        tap: '👆',
        double_tap: '👆👆',
        drag: '✋',
        drop: '🖐️',
        zoom_in: '🔍+',
        zoom_out: '🔍-',
        fast_swipe_up: '⏫',
        fast_swipe_down: '⏬'
      }
      
      return iconMap[action] || '✋'
    }

    const getActionText = (action) => {
      const textMap = {
        swipe_left: '向左滑动',
        swipe_right: '向右滑动',
        swipe_up: '向上滑动',
        swipe_down: '向下滑动',
        tap: '点击',
        double_tap: '双击',
        drag: '拖动',
        drop: '释放',
        zoom_in: '放大',
        zoom_out: '缩小',
        fast_swipe_up: '快速向上',
        fast_swipe_down: '快速向下'
      }
      
      return textMap[action] || '未知动作'
    }
    
    const getGestureIcon = (gestureId) => {
      const iconMap = {
        19: '☝️', // POINT 手指指向
        25: '✊', // FIST 拳头
        31: '🖐️', // PALM 手掌
        27: '👍', // LIKE 点赞
        24: '👎', // DISLIKE 点踩
        29: '👌'  // OK OK手势
      }
      
      return iconMap[gestureId] || '✋'
    }
    
    const getGestureName = (gestureId) => {
      const nameMap = {
        19: '手指指向',
        25: '拳头',
        31: '手掌',
        27: '点赞',
        24: '点踩',
        29: 'OK手势'
      }
      
      return nameMap[gestureId] || '未知手势'
    }

    const initialize = async () => {
      try {
        isInitializing.value = true
        initProgress.value = 0
        initStatus.value = '准备初始化...'
        
        // 模拟进度更新
        const updateProgress = (progress, status) => {
          initProgress.value = progress
          initStatus.value = status
        }
        
        updateProgress(10, '初始化Canvas元素...')
        await new Promise(resolve => setTimeout(resolve, 200))
        
        updateProgress(30, '连接后端服务...')
        await new Promise(resolve => setTimeout(resolve, 300))
        
        updateProgress(60, '测试API连接...')
        try {
          await gestureService.initialize()
        } catch (error) {
          console.warn('后端服务连接失败，将在需要时重试:', error)
        }
        await new Promise(resolve => setTimeout(resolve, 300))
        
        updateProgress(80, '初始化完成...')
        await new Promise(resolve => setTimeout(resolve, 200))
        
        updateProgress(100, '系统已就绪')
        await new Promise(resolve => setTimeout(resolve, 300))
        
        isInitialized = true
        isInitializing.value = false
        console.log('手势识别系统初始化成功')
      } catch (error) {
        console.error('手势识别系统初始化失败:', error)
        initStatus.value = '初始化失败，请检查网络连接'
        setTimeout(() => {
          isInitializing.value = false
        }, 2000)
        // 不显示alert，避免阻塞用户操作
        console.error('手势识别系统初始化失败，请检查后端服务是否运行')
      }
    }

    onMounted(() => {
      initialize()
    })

    onUnmounted(() => {
      cameraViewRef.value?.stopCamera()
    })

    return {
      cameraViewRef,
      currentAction,
      currentGesture,
      isInitializing,
      initProgress,
      initStatus,
      onFrame,
      onDetections,
      getActionIcon,
      getActionText,
      getGestureIcon,
      getGestureName
    }
  }
}
</script>

<style scoped>
.gesture-control {
  position: relative;
  width: 100%;
  height: 100%;
  font-family: var(--font-family);
}

.action-feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(196, 146, 16, 0.9);
  color: #fff;
  padding: 20px 40px;
  border-radius: 8px;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: fadeIn 0.3s ease;
}

.action-feedback .action-icon {
  font-size: 32px;
}

.gesture-guide {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 15px;
  border-radius: 8px;
  max-width: 300px;
}

.gesture-guide h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: var(--text-color);
}

.guide-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.guide-item:last-child {
  margin-bottom: 0;
}

.gesture-icon {
  font-size: 20px;
  margin-right: 10px;
  width: 30px;
  text-align: center;
}

.gesture-feedback {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(196, 146, 16, 0.9);
  color: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: fadeIn 0.3s ease;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(196, 146, 16, 0.3);
}

.gesture-feedback .gesture-feedback-icon {
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.gesture-feedback .gesture-feedback-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gesture-feedback .gesture-feedback-name {
  font-size: 16px;
  font-weight: bold;
  line-height: 1.2;
}

.gesture-feedback .gesture-feedback-confidence {
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.2;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.init-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.init-content {
  background: #333;
  padding: 40px 50px;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
}

.init-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(196, 146, 16, 0.1);
  border-left: 4px solid var(--text-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.init-text {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  text-align: center;
}

.init-progress-bar {
  width: 100%;
  height: 10px;
  background: rgba(196, 146, 16, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.init-progress {
  height: 100%;
  background: var(--text-color);
  border-radius: 5px;
  transition: width 0.3s ease;
}

.init-status {
  font-size: 14px;
  color: #ccc;
  text-align: center;
  min-height: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>