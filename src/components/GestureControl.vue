<template>
  <div class="gesture-control">
    <CameraView
      ref="cameraViewRef"
      :width="width"
      :height="height"
      :show-overlay="showOverlay"
      :hand-landmarks="isFingerTracking ? handLandmarks : null"
      @frame="onFrame"
      @detections="onDetections"
    />
    
    <div v-if="isInitializing" class="init-overlay">
      <div class="init-content">
        <div class="init-spinner"></div>
        <div class="init-text">{{ initStatus }}</div>
        <div class="init-progress-bar">
          <div class="init-progress" :style="{ width: initProgress + '%' }"></div>
        </div>
      </div>
    </div>
    
    <div v-if="currentAction" class="action-feedback">
      <span class="action-icon">{{ getActionIcon(currentAction) }}</span>
      <span>{{ getActionText(currentAction) }}</span>
    </div>
    
    <div v-if="currentGesture" class="gesture-feedback">
      <span class="gesture-feedback-icon">{{ getGestureIcon(currentGesture.gesture) }}</span>
      <div class="gesture-feedback-info">
        <span class="gesture-name">{{ currentGesture.gestureName }}</span>
        <span class="gesture-id">ID: {{ currentGesture.gesture }}</span>
      </div>
    </div>
    

    
    <div v-if="isFingerTracking" class="tracking-feedback">
      <div class="tracking-content">
        <span class="tracking-icon">👆</span>
        <div class="tracking-text">
          <div class="tracking-title">手指追踪中</div>
          <div class="tracking-subtitle">移动手指来旋转模型</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { BackendGestureRecognitionService } from '../services/backendGestureRecognition'
import { ActionRecognitionService } from '../services/actionRecognition'

import { GESTURE_CONTROL_CONFIG } from '../constants/gestureConstants'
import CameraView from './CameraView.vue'

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
      default: false
    }
  },
  emits: ['action', 'gesture', 'finger-move', 'displayGestureHint'],
  setup(props, { emit }) {
    const cameraViewRef = ref(null)
    const isInitialized = ref(false)
    const isInitializing = ref(true)
    const initProgress = ref(0)
    const initStatus = ref('准备中...')
    const currentAction = ref(null)
    const currentGesture = ref(null)
    const currentFingerPosition = ref(null)
    const fingerPosition = ref(null)
    const isFingerTracking = ref(false)
    const handLandmarks = ref(null)
    const lastFingerPosition = ref({ x: 0, y: 0 })
    const isFirstFingerPosition = ref(true) // 标记是否是第一次检测到手指位置
    const lastMoveTime = ref(0)
    const AUTO_STOP_DELAY = GESTURE_CONTROL_CONFIG.AUTO_STOP_DELAY
    const isRotationTriggered = ref(false) // 标记旋转动作是否真正被触发
    
    const gestureRecognition = new BackendGestureRecognitionService()
    const actionRecognition = new ActionRecognitionService()
    
    // 动作冷却
    let lastActionTime = 0
    const ACTION_COOLDOWN = GESTURE_CONTROL_CONFIG.ACTION_COOLDOWN
    
    let animationFrameId = null
    

    
    const isRotateGesture = (gestureId) => {
      return gestureId === 19 || gestureId === 30 || gestureId === 31 || gestureId === 35 || gestureId === 36 || gestureId === 38 || gestureId === 32 || gestureId === 33 || gestureId === 29 || gestureId === 11 || gestureId === 12 || gestureId === 22
    }
    
    // 坐标映射函数：将原始640x480坐标转换为实际显示坐标
    const mapCoordinates = (x, y) => {
      if (!cameraViewRef.value) {
        return { x, y }
      }
      
      const cameraElement = cameraViewRef.value.$el
      if (!cameraElement) {
        return { x, y }
      }
      
      const displayWidth = cameraElement.offsetWidth
      const displayHeight = cameraElement.offsetHeight
      
      const mappedX = (x / 640) * displayWidth
      const mappedY = (y / 480) * displayHeight
      
      return { x: mappedX, y: mappedY }
    }
    
    const isOneShotGesture = (gestureId) => {
      const oneShotGestures = [27, 3, 39, 24, 38, 29, 11, 12, 18, 20, 22, 0, 1, 2, 3, 10, 11, 12, 13, 15, 16, 17, 18]
      return oneShotGestures.includes(gestureId)
    }
    
    const getActionFromGesture = (gestureId) => {
      const actionMap = {
        // 放大操作
        27: 'zoom_in',      // like (点赞)
        39: 'zoom_in',      // two_up (二指向上)
        
        // 缩小操作
        24: 'zoom_out',     // dislike (点踩)
        
        // 旋转操作
        19: 'rotate',       // point (手指指向)
        30: 'rotate',       // one (一指)
        31: 'rotate',       // palm (手掌)
        35: 'rotate',       // stop (停止)
        36: 'rotate',       // stop_inverted (停止反转)
        29: 'rotate',       // ok (OK手势)
        
        // 注意：手势ID 0-44是静态手势分类，不是SWIPE事件
        // 如果需要SWIPE功能，应基于手部轨迹检测实现
      }
      return actionMap[gestureId] || null
    }
    
    const stopTracking = (clearHistory = true) => {
      if (isFingerTracking.value) {
        isFingerTracking.value = false
        lastFingerPosition.value = { x: 0, y: 0 }
        isFirstFingerPosition.value = true
        lastMoveTime.value = 0
        fingerPosition.value = null
        isRotationTriggered.value = false
        console.log('GestureControl.stopTracking: 重置旋转动作触发状态')
      }
    }
    
    const onFrame = async (imageData) => {
      if (!isInitialized.value) return
      
      try {
        const result = await gestureRecognition.processFrame(imageData)
        const detections = result.detections
        
        if (detections && detections.length > 0) {
          console.log('[GestureControl] 收到检测:', detections.map(d => `${d.gestureName}(${d.gesture})`).join(', '))
        }
        
        const validDetections = detections.filter(detection => {
          const bbox = detection.bbox;
          
          if (bbox.confidence < 0.6) {
            return false;
          }
          
          const width = bbox.x2 - bbox.x1;
          const height = bbox.y2 - bbox.y1;
          
          const aspectRatio = width / height;
          if (aspectRatio < 0.3 || aspectRatio > 2) {
            return false;
          }
          
          const area = width * height;
          if (area < 1000 || area > 100000) {
            return false;
          }
          
          return true;
        });
        
        if (validDetections.length > 0) {
          console.log('[GestureControl] 有效检测:', validDetections.length)
        }
        
        cameraViewRef.value?.updateDetections(validDetections)
        const currentTime = Date.now()
        
        // 如果旋转动作已触发，继续手指追踪（即使没有检测到手势）
        if (isRotationTriggered.value && result.fingerPosition) {
          const { x, y } = result.fingerPosition
          const mirroredX = 640 - x
          
          const mappedPosition = mapCoordinates(mirroredX, y)
          fingerPosition.value = { x: mappedPosition.x, y: mappedPosition.y }
          
          if (result.landmarks && result.landmarks.length > 0) {
            handLandmarks.value = result.landmarks
          }
          
          isFingerTracking.value = true
          
          if (isFirstFingerPosition.value) {
            lastFingerPosition.value = { x: mirroredX, y }
            isFirstFingerPosition.value = false
            console.log('[GestureControl] 发送finger-move (首次):', { deltaX: 0, deltaY: 0, position: { x: mirroredX, y } })
            emit('finger-move', {
              deltaX: 0,
              deltaY: 0,
              position: { x: mirroredX, y }
            })
          } else {
            const deltaX = mirroredX - lastFingerPosition.value.x
            const deltaY = y - lastFingerPosition.value.y
            
            console.log('[GestureControl] 发送finger-move:', { deltaX, deltaY })
            emit('finger-move', {
              deltaX: deltaX,
              deltaY: deltaY,
              position: { x: mirroredX, y }
            })
            
            lastFingerPosition.value = { x: mirroredX, y }
          }
          
          lastMoveTime.value = currentTime
          return
        }
        
        if (validDetections.length > 0) {
          const hand = validDetections[0]
          const gestureId = hand.gesture
          
          const recognizedAction = actionRecognition.updateDetections(validDetections)
          
          if (recognizedAction) {
            console.log('[GestureControl] 识别动作:', recognizedAction)
            const DYNAMIC_ACTIONS = ['rotate']
            if (DYNAMIC_ACTIONS.includes(recognizedAction)) {
              if (currentAction.value !== recognizedAction) {
                currentAction.value = recognizedAction
                emit('action', recognizedAction)
              }
              
              if (recognizedAction === 'rotate') {
                if (!isRotationTriggered.value) {
                  isRotationTriggered.value = true
                  console.log('[GestureControl] 旋转动作已触发')
                }
                
                if (isRotationTriggered.value && !isFingerTracking.value) {
                  isFingerTracking.value = true
                  lastMoveTime.value = 0
                }
              }
            } else {
              if (currentTime - lastActionTime >= ACTION_COOLDOWN) {
                currentAction.value = recognizedAction
                emit('action', recognizedAction)
                console.log('[GestureControl] 触发动作:', recognizedAction)
                lastActionTime = currentTime
                
                const resetTime = ['zoom_in', 'zoom_out'].includes(recognizedAction) ? GESTURE_CONTROL_CONFIG.ZOOM_ACTION_RESET_TIME : GESTURE_CONTROL_CONFIG.DEFAULT_ACTION_RESET_TIME
                setTimeout(() => {
                  if (currentAction.value === recognizedAction) {
                    currentAction.value = null
                  }
                }, resetTime)
              }
            }
          }
          
          // 如果旋转动作已触发，继续手指追踪
          if (isRotationTriggered.value && result.fingerPosition) {
            const { x, y } = result.fingerPosition
            const mirroredX = 640 - x
            
            const mappedPosition = mapCoordinates(mirroredX, y)
            fingerPosition.value = { x: mappedPosition.x, y: mappedPosition.y }
            
            if (result.landmarks && result.landmarks.length > 0) {
              handLandmarks.value = result.landmarks
            }
            
            isFingerTracking.value = true
            
            if (isFirstFingerPosition.value) {
              lastFingerPosition.value = { x: mirroredX, y }
              isFirstFingerPosition.value = false
              console.log('[GestureControl] 发送finger-move (首次):', { deltaX: 0, deltaY: 0, position: { x: mirroredX, y } })
              emit('finger-move', {
                deltaX: 0,
                deltaY: 0,
                position: { x: mirroredX, y }
              })
            } else {
              const deltaX = mirroredX - lastFingerPosition.value.x
              const deltaY = y - lastFingerPosition.value.y
              
              console.log('[GestureControl] 发送finger-move:', { deltaX, deltaY })
              emit('finger-move', {
                deltaX: deltaX,
                deltaY: deltaY,
                position: { x: mirroredX, y }
              })
              
              lastFingerPosition.value = { x: mirroredX, y }
            }
            
            lastMoveTime.value = currentTime
          }
          
          // 超时检查：如果超过2秒没有更新，停止追踪
          if (isRotationTriggered.value && currentTime - lastMoveTime.value > 2000) {
            console.log('[GestureControl] 超时停止追踪')
            stopTracking(false)
            fingerPosition.value = null
            handLandmarks.value = null
          }
        } else {
          // 没有有效检测，但旋转动作已触发时，检查超时
          if (isRotationTriggered.value) {
            if (currentTime - lastMoveTime.value > 2000) {
              console.log('[GestureControl] 无检测超时停止追踪')
              stopTracking(false)
              fingerPosition.value = null
              handLandmarks.value = null
            }
          } else {
            stopTracking(false)
            fingerPosition.value = null
            handLandmarks.value = null
          }
        }
      } catch (error) {
        console.error('手势处理失败:', error)
      }
    }
    
    const onDetections = (detections) => {
      // 空实现
    }
    
    const getActionIcon = (action) => {
    const iconMap = {
      'switch': '👈👉',
      'switch_next': '👉',
      'switch_prev': '👈',
      'reset': '🖐️',
      'zoom_in': '👍',
      'zoom_out': '👎',
      'show_info': '👌',
      'rotate': '☝️'
    }
    return iconMap[action] || '✋'
  }

  const getActionText = (action) => {
    const textMap = {
      'switch': '滑动',
      'switch_next': '向右滑动',
      'switch_prev': '向左滑动',
      'reset': '手掌',
      'zoom_in': '点赞',
      'zoom_out': '点踩',
      'show_info': 'OK手势',
      'rotate': '手指指向'
    }
    return textMap[action] || '未知动作'
  }

    const getGestureIcon = (gestureId) => {
      const iconMap = {
        // SWIPE手势图标
        0: '👉',  // SWIPE_RIGHT
        1: '👈',  // SWIPE_LEFT
        2: '👆',  // SWIPE_UP
        3: '👇',  // SWIPE_DOWN
        10: '👉', // SWIPE_RIGHT2
        11: '👈', // SWIPE_LEFT2
        12: '👆', // SWIPE_UP2
        13: '👇', // SWIPE_DOWN2
        15: '👉', // SWIPE_RIGHT3
        16: '👈', // SWIPE_LEFT3
        17: '👆', // SWIPE_UP3
        18: '👇', // SWIPE_DOWN3
        // 其他手势图标
        4: '👈', 5: '👉', 6: '👇',
        7: '👆', 8: '👈', 9: '👉',
        14: '✌️',
        19: '☝️', 20: '📞',
        21: '3️⃣', 22: '🧐', 23: '🖕', 24: '👎', 25: '✊',
        26: '4️⃣', 27: '👍', 28: '🤫', 29: '👌', 30: '☝️',
        31: '🖐️', 32: '✌️', 33: '✌️', 34: '🤘', 35: '🛑',
        36: '🛑', 37: '3️⃣', 38: '3️⃣', 39: '✌️', 40: '✌️',
        41: '🔫', 42: '👈', 43: '👉', 44: '👇'
      }
      return iconMap[gestureId] || '✋'
    }
    
    const startCamera = async () => {
      if (isInitialized.value) return
      
      try {
        isInitializing.value = true
        initStatus.value = '正在初始化手势识别...'
        initProgress.value = 10
        
        await gestureRecognition.initialize()
        
        initStatus.value = '手势识别初始化成功'
        initProgress.value = 50
        
        isInitialized.value = true
        isInitializing.value = false
      } catch (error) {
        console.error('手势识别服务初始化失败:', error)
        isInitializing.value = false
      }
    }
    
    onMounted(() => {
      startCamera()
    })
    
    onUnmounted(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      gestureRecognition.dispose()
    })
    
    return {
      cameraViewRef,
      isInitialized,
      isInitializing,
      initProgress,
      initStatus,
      currentAction,
      currentGesture,
      currentFingerPosition,
      fingerPosition,
      isFingerTracking,
      handLandmarks,
      onFrame,
      onDetections,
      getActionIcon,
      getActionText,
      getGestureIcon,
      startCamera
    }
  }
}
</script>

<style scoped>
.gesture-control {
  position: relative;
  width: 100%;
  height: 100%;
}

.init-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.init-content {
  text-align: center;
  color: white;
}

.init-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.init-text {
  margin-bottom: 15px;
  font-size: 16px;
}

.init-progress-bar {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.init-progress {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.action-feedback {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  z-index: 100;
}

.action-icon {
  font-size: 24px;
}

.gesture-feedback {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
}

.gesture-feedback-icon {
  font-size: 20px;
}

.gesture-feedback-info {
  display: flex;
  flex-direction: column;
}

.gesture-name {
  font-size: 12px;
}

.gesture-id {
  font-size: 10px;
  opacity: 0.7;
}

.finger-dot {
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.tracking-feedback {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px 20px;
  border-radius: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.tracking-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tracking-icon {
  font-size: 24px;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.tracking-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tracking-title {
  font-size: 16px;
  font-weight: bold;
  color: #4CAF50;
}

.tracking-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
