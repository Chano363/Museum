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
    
    <div v-if="currentAction" class="action-feedback">
      <span class="action-icon">{{ getActionIcon(currentAction) }}</span>
      <span>{{ getActionText(currentAction) }}</span>
    </div>
    
    <div v-if="showGuide" class="gesture-guide">
      <h3>手势指南</h3>
      <div class="guide-item">
        <span class="gesture-icon">👈</span>
        <span class="gesture-desc">向左滑动：上一个展品</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">👉</span>
        <span class="gesture-desc">向右滑动：下一个展品</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">👆</span>
        <span class="gesture-desc">向上滑动：向上滚动</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">👇</span>
        <span class="gesture-desc">向下滑动：向下滚动</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">👆</span>
        <span class="gesture-desc">点击：选择展品</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import CameraView from './CameraView.vue'
import { BackendGestureRecognitionService } from '../services/backendGestureRecognition'
import { ActionRecognitionService } from '../services/actionRecognition'

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
  emits: ['action', 'gesture'],
  setup(props, { emit }) {
    const cameraViewRef = ref(null)
    const gestureService = new BackendGestureRecognitionService()
    const actionService = new ActionRecognitionService()

    const currentAction = ref(null)
    let isInitialized = false

    const onFrame = async (imageData) => {
      if (!isInitialized) return
      
      try {
        const detections = await gestureService.processFrame(imageData)
        cameraViewRef.value?.updateDetections(detections)
        
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
          emit('gesture', detections[0])
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

    const initialize = async () => {
      try {
        await gestureService.initialize()
        isInitialized = true
        console.log('手势识别系统初始化成功')
      } catch (error) {
        console.error('手势识别系统初始化失败:', error)
        alert('手势识别系统初始化失败，请刷新页面重试')
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
      onFrame,
      onDetections,
      getActionIcon,
      getActionText
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

.action-feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(64, 158, 255, 0.9);
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
  color: #409eff;
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
</style>