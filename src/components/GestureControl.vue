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
import { MediaPipeHandTrackingService } from '../services/mediaPipeHandTracking'
import { ActionRecognitionService } from '../services/actionRecognition'
import { SwipeDetector } from '../utils/swipeDetector'
import { GestureEvent } from '../utils/gestureEnums'
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
    const mediaPipeInitialized = ref(false)
    const isRotationTriggered = ref(false) // 标记旋转动作是否真正被触发
    
    const gestureRecognition = new BackendGestureRecognitionService()
    const handTracking = new MediaPipeHandTrackingService()
    const actionRecognition = new ActionRecognitionService()
    const swipeDetector = new SwipeDetector()
    
    // 动作冷却
    let lastActionTime = 0
    const ACTION_COOLDOWN = GESTURE_CONTROL_CONFIG.ACTION_COOLDOWN
    
    let animationFrameId = null
    
    const initializeMediaPipe = async () => {
      if (mediaPipeInitialized.value) return
      
      try {
        initStatus.value = '正在初始化MediaPipe...'
        initProgress.value = 30
        
        await handTracking.initialize()
        
        initStatus.value = 'MediaPipe初始化成功'
        initProgress.value = 100
        mediaPipeInitialized.value = true
      } catch (error) {
        console.error('MediaPipe服务初始化失败:', error)
        isInitializing.value = false
        mediaPipeInitialized.value = false
      }
    }
    
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
        3: 'zoom_in',       // thumb_index (拇指食指)
        39: 'zoom_in',      // two_up (二上)
        18: 'zoom_in',      // grabbing (抓取)
        
        // 缩小操作
        24: 'zoom_out',     // dislike (点踩)
        20: 'zoom_out',     // call (打电话手势)
        
        // 旋转操作
        38: 'rotate',       // three2 (三指向下)
        32: 'rotate',       // four (四指)
        33: 'rotate',       // three (三指)
        
        // 旋转操作
        29: 'rotate',       // ok (OK手势)
        11: 'rotate',       // part_hand_heart (心形手势1)
        12: 'rotate',       // part_hand_heart2 (心形手势2)
        22: 'rotate',       // little_finger (小指)
        
        // 旋转操作
        19: 'rotate',       // point (手指指向)
        30: 'rotate',       // one (一指)
        31: 'rotate',       // palm (手掌)
        35: 'rotate',       // stop (停止)
        36: 'rotate',       // stop_inverted (停止反转)
        
        // 只有SWIPE手势用于切换展品（使用GestureEvent枚举）
        [GestureEvent.SWIPE_RIGHT]: 'switch',
        [GestureEvent.SWIPE_LEFT]: 'switch',
        [GestureEvent.SWIPE_UP]: 'switch',
        [GestureEvent.SWIPE_DOWN]: 'switch',
        [GestureEvent.SWIPE_RIGHT2]: 'switch',
        [GestureEvent.SWIPE_LEFT2]: 'switch',
        [GestureEvent.SWIPE_UP2]: 'switch',
        [GestureEvent.SWIPE_DOWN2]: 'switch',
        [GestureEvent.SWIPE_RIGHT3]: 'switch',
        [GestureEvent.SWIPE_LEFT3]: 'switch',
        [GestureEvent.SWIPE_UP3]: 'switch',
        [GestureEvent.SWIPE_DOWN3]: 'switch'
      }
      return actionMap[gestureId] || null
    }
    
    const stopTracking = (clearHistory = true) => {
      if (isFingerTracking.value) {
        isFingerTracking.value = false
        lastFingerPosition.value = { x: 0, y: 0 }
        isFirstFingerPosition.value = true // 重置首次检测标志
        lastMoveTime.value = 0
        if (clearHistory) {
          handTracking.clearHistory()
        }
        // 清除手指位置，避免小白点残留
        fingerPosition.value = null
        // 重置SWIPE检测
        swipeDetector.reset()
        // 重置旋转动作触发状态
        isRotationTriggered.value = false
        console.log('GestureControl.stopTracking: 重置旋转动作触发状态')
      }
    }
    
/**
 * 处理每一帧的图像数据
 * 
 * 注意事项：
 * 1. 动态动作（如 rotate）需要持续触发，确保手指追踪能够持续
 * 2. 静态动作（如 zoom_in, zoom_out）需要在冷却时间后再次触发
 * 3. 手指追踪逻辑已经过系统性修复，确保能够正确处理旋转动作
 * 4. 不要轻易修改动作处理逻辑，否则可能导致动作无法触发
 */
    const onFrame = async (imageData) => {
      if (!isInitialized.value) return
      
      try {
        const detections = await gestureRecognition.processFrame(imageData)
        
        // 过滤掉不符合手部特征的检测结果
        const validDetections = detections.filter(detection => {
          const bbox = detection.bbox;
          const width = bbox.x2 - bbox.x1;
          const height = bbox.y2 - bbox.y1;
          
          // 手部的宽高比通常在0.3-2之间
          const aspectRatio = width / height;
          if (aspectRatio < 0.3 || aspectRatio > 2) {
            return false;
          }
          
          // 手部的大小应该在合理范围内
          const area = width * height;
          if (area < 1000 || area > 100000) {
            return false;
          }
          
          return true;
        });
        
        cameraViewRef.value?.updateDetections(validDetections)
        const currentTime = Date.now()
        
        if (validDetections.length > 0) {
          const hand = validDetections[0]
          const gestureId = hand.gesture
          
          // 先调用 actionRecognition.updateDetections 进行处理
          const recognizedAction = actionRecognition.updateDetections(validDetections)
          
          // 处理识别到的动作
          if (recognizedAction) {
            // 对于动态动作（如 rotate），不受冷却时间和动作是否变化的限制
            if (recognizedAction === 'rotate') {
              // 持续更新 currentAction.value，确保持续触发
              if (currentAction.value !== recognizedAction) {
                currentAction.value = recognizedAction
                emit('action', recognizedAction)
              }
              
              // 触发完成后标记旋转动作已触发
              if (!isRotationTriggered.value) {
                isRotationTriggered.value = true
              }
              
              // 只有在旋转动作真正触发后才开始手指追踪
              if (isRotationTriggered.value && !isFingerTracking.value) {
                isFingerTracking.value = true
                // 不重置lastFingerPosition，保留上次位置作为参考
                lastMoveTime.value = 0
                
                if (!mediaPipeInitialized.value) {
                  await initializeMediaPipe()
                }
              }
              
              // 不设置 setTimeout，因为 rotate 动作需要持续追踪
            } else {
              // 对于静态动作，使用更短的冷却时间，确保可以连续触发
              if (currentTime - lastActionTime >= ACTION_COOLDOWN) {
                currentAction.value = recognizedAction
                emit('action', recognizedAction)
                lastActionTime = currentTime
                
                // 对于缩放动作，使用更短的重置时间，确保可以快速连续触发
                const resetTime = ['zoom_in', 'zoom_out'].includes(recognizedAction) ? GESTURE_CONTROL_CONFIG.ZOOM_ACTION_RESET_TIME : GESTURE_CONTROL_CONFIG.DEFAULT_ACTION_RESET_TIME
                setTimeout(() => {
                  if (currentAction.value === recognizedAction) {
                    currentAction.value = null
                  }
                }, resetTime)
              }
            }
          } else {
            // 没有识别到动作，但如果是旋转动作已触发，不停止追踪
            if (currentAction.value !== 'rotate' || !isRotationTriggered.value) {
              stopTracking(false) // 不清除历史记录，避免下一次进入时闪动
              // 清除手指位置和手部关键点
              fingerPosition.value = null
              handLandmarks.value = null
            }
          }
          
          // 只有在通过投票机制确认了其他动作时，才停止旋转追踪
          if (recognizedAction && recognizedAction !== 'rotate' && currentAction.value === 'rotate' && isRotationTriggered.value) {
            // 只有当识别到的动作是静态动作（如zoom_in、zoom_out）或swipe动作时，才停止旋转追踪
            if (['zoom_in', 'zoom_out'].includes(recognizedAction) || recognizedAction === 'switch') {
              stopTracking(false) // 不清除历史记录，避免下一次进入时闪动
              fingerPosition.value = null
              handLandmarks.value = null
            }
          }
          
          // 只有在通过投票机制确认了 rotation 动作且旋转动作已触发后，才开始手指追踪
          if (recognizedAction === 'rotate' || (currentAction.value === 'rotate' && isRotationTriggered.value)) {
            if (!isFingerTracking.value) {
              isFingerTracking.value = true
              // 不重置lastFingerPosition，保留上次位置作为参考
              lastMoveTime.value = 0
              
              if (!mediaPipeInitialized.value) {
                await initializeMediaPipe()
              }
            }
            
            try {
              // 只要旋转动作已触发，就持续处理手指追踪
              if (isRotationTriggered.value) {
                // 确保 MediaPipe 已初始化
                if (!mediaPipeInitialized.value) {
                  await initializeMediaPipe()
                }
                
                // 处理手指追踪
                const detectedPosition = await handTracking.processFrame(imageData)
                
                if (detectedPosition) {
                  // 更新手指位置用于显示白点
                  const mappedPosition = mapCoordinates(detectedPosition.x, detectedPosition.y)
                  fingerPosition.value = { x: mappedPosition.x, y: mappedPosition.y }
                  currentFingerPosition.value = { x: detectedPosition.x, y: detectedPosition.y }
                  
                  // 获取手部关键点
                  handLandmarks.value = handTracking.getLatestLandmarks()
                  
                  // 确保手指追踪状态为 true
                  isFingerTracking.value = true
                  
                  // 发送手指移动事件，确保 3D 模型能够旋转
                  const deltaX = detectedPosition.x - lastFingerPosition.value.x
                  const deltaY = detectedPosition.y - lastFingerPosition.value.y
                  
                  if (isFirstFingerPosition.value) {
                    // 第一次检测到手指位置，初始化位置
                    lastFingerPosition.value = { x: detectedPosition.x, y: detectedPosition.y }
                    isFirstFingerPosition.value = false
                    
                    // 第一次检测到手指位置时也发送事件，确保小白点能够显示
                    emit('finger-move', {
                      deltaX: 0,
                      deltaY: 0,
                      position: { x: detectedPosition.x, y: detectedPosition.y }
                    })
                  } else {
                    // 无论移动距离大小，都发送手指移动事件，确保小白点位置能够更新
                    emit('finger-move', {
                      deltaX: deltaX,
                      deltaY: deltaY,
                      position: { x: detectedPosition.x, y: detectedPosition.y }
                    })
                    
                    // 检测SWIPE手势（使用SwipeDetector）
                    const swipeEvent = swipeDetector.detectSwipe({ x: detectedPosition.x, y: detectedPosition.y }, deltaX, deltaY)
                    if (swipeEvent) {
                      // 处理SWIPE手势用于切换展品
                      if (currentTime - lastActionTime >= ACTION_COOLDOWN) {
                        const action = getActionFromGesture(swipeEvent)
                        if (action && action !== currentAction.value) {
                          currentAction.value = action
                          emit('action', action)
                          lastActionTime = currentTime
                          
                          setTimeout(() => {
                            if (currentAction.value === action) {
                              currentAction.value = null
                            }
                          }, 3000)
                        }
                      }
                    }
                    
                    lastFingerPosition.value = { x: detectedPosition.x, y: detectedPosition.y }
                  }
                } else {
                  // 使用手部边界框中心作为备选位置
                  const centerX = (hand.bbox.x1 + hand.bbox.x2) / 2
                  const centerY = (hand.bbox.y1 + hand.bbox.y2) / 2
                  
                  // 更新白点位置
                  const mappedPosition = mapCoordinates(centerX, centerY)
                  fingerPosition.value = { x: mappedPosition.x, y: mappedPosition.y }
                  
                  // 确保手指追踪状态为 true
                  isFingerTracking.value = true
                  
                  if (isFirstFingerPosition.value) {
                    // 第一次检测到手指位置，初始化位置
                    lastFingerPosition.value = { x: centerX, y: centerY }
                    isFirstFingerPosition.value = false
                    
                    // 第一次检测到手指位置时也发送事件，确保小白点能够显示
                    emit('finger-move', {
                      deltaX: 0,
                      deltaY: 0,
                      position: { x: centerX, y: centerY }
                    })
                  } else {
                    const deltaX = centerX - lastFingerPosition.value.x
                    const deltaY = centerY - lastFingerPosition.value.y
                    
                    // 无论移动距离大小，都发送手指移动事件，确保小白点位置能够更新
                    emit('finger-move', {
                      deltaX: deltaX,
                      deltaY: deltaY,
                      position: { x: centerX, y: centerY }
                    })
                    
                    // 检测SWIPE手势（使用SwipeDetector）
                    const swipeEvent = swipeDetector.detectSwipe({ x: centerX, y: centerY }, deltaX, deltaY)
                    if (swipeEvent) {
                      // 处理SWIPE手势用于切换展品
                      if (currentTime - lastActionTime >= ACTION_COOLDOWN) {
                        const action = getActionFromGesture(swipeEvent)
                        if (action && action !== currentAction.value) {
                          currentAction.value = action
                          emit('action', action)
                          lastActionTime = currentTime
                          
                          setTimeout(() => {
                            if (currentAction.value === action) {
                              currentAction.value = null
                            }
                          }, 3000)
                        }
                      }
                    }
                    
                    lastFingerPosition.value = { x: centerX, y: centerY }
                  }
                }
              } else if (recognizedAction === 'rotate') {
                // 旋转动作已识别但未触发，继续等待触发
              } else {
                // 非 rotation 动作或旋转动作未触发，停止手指追踪
                isFingerTracking.value = false
                handLandmarks.value = null
                fingerPosition.value = null
              }
            } catch (error) {
              console.error('GestureControl.onFrame: 手指追踪失败:', error)
              
              // 只要旋转动作已触发，就持续处理错误
              if (isRotationTriggered.value) {
                // 使用手部边界框中心作为备选位置
                const centerX = (hand.bbox.x1 + hand.bbox.x2) / 2
                const centerY = (hand.bbox.y1 + hand.bbox.y2) / 2
                
                // 更新白点位置
                const mappedPosition = mapCoordinates(centerX, centerY)
                fingerPosition.value = { x: mappedPosition.x, y: mappedPosition.y }
                
                // 确保手指追踪状态为 true
                isFingerTracking.value = true
                
                if (isFirstFingerPosition.value) {
                  // 第一次检测到手指位置，初始化位置
                  lastFingerPosition.value = { x: centerX, y: centerY }
                  isFirstFingerPosition.value = false
                } else {
                  const deltaX = centerX - lastFingerPosition.value.x
                  const deltaY = centerY - lastFingerPosition.value.y
                  
                  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                    lastMoveTime.value = currentTime
                    
                    // 检测SWIPE手势（使用SwipeDetector）
                    const swipeEvent = swipeDetector.detectSwipe({ x: centerX, y: centerY }, deltaX, deltaY)
                    if (swipeEvent) {
                      // 处理SWIPE手势用于切换展品
                      if (currentTime - lastActionTime >= ACTION_COOLDOWN) {
                        const action = getActionFromGesture(swipeEvent)
                        if (action && action !== currentAction.value) {
                          currentAction.value = action
                          emit('action', action)
                          lastActionTime = currentTime
                          
                          setTimeout(() => {
                            if (currentAction.value === action) {
                              currentAction.value = null
                            }
                          }, 3000)
                        }
                      }
                    } else {
                      // 正常的手指移动，用于旋转模型
                      emit('finger-move', {
                        deltaX: deltaX,
                        deltaY: deltaY,
                        position: { x: centerX, y: centerY }
                      })
                    }
                    
                    lastFingerPosition.value = { x: centerX, y: centerY }
                  }
                }
              }
            }
            
            // 只有在非旋转动作时才应用自动停止延迟
            if (currentAction.value !== 'rotate' && currentTime - lastMoveTime.value > AUTO_STOP_DELAY) {
              stopTracking(false) // 不清除历史记录，避免下一次进入时闪动
            }
          } else {
            // 非旋转动作或旋转动作未触发，停止追踪并清除相关状态
            stopTracking(false) // 不清除历史记录，避免下一次进入时闪动
            fingerPosition.value = null
            handLandmarks.value = null
          }
          
          currentGesture.value = hand
          setTimeout(() => {
            if (currentGesture.value === hand) {
              currentGesture.value = null
            }
          }, 2000)
        } else {
          // 重置SWIPE检测器
          swipeDetector.reset()
          stopTracking(false) // 不清除历史记录，避免下一次进入时闪动
          // 确保清除手指位置，避免小白点残留
          fingerPosition.value = null
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
      handTracking.dispose()
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
