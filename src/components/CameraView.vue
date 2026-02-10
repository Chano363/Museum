<template>
  <div class="camera-view">
    <video
      ref="videoRef"
      autoplay
      playsinline
      muted
      @loadedmetadata="onVideoLoaded"
    ></video>
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
    ></canvas>
    <div v-if="showOverlay" class="overlay">
      <div class="detection-info">
        <div class="info-item">
          <span class="label">FPS:</span>
          <span class="value">{{ fps }}</span>
        </div>
        <div class="info-item">
          <span class="label">检测数:</span>
          <span class="value">{{ detections.length }}</span>
        </div>
      </div>
      <div v-for="(detection, index) in detections" :key="index" class="detection-box" :style="getBoxStyle(detection.bbox)">
        <div class="gesture-label">{{ detection.gestureName }}</div>
      </div>
    </div>
    <div v-if="!isCameraReady" class="loading">
      <div class="loading-spinner"></div>
      <p>正在初始化摄像头...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, onBeforeUnmount, computed } from 'vue'

export default {
  name: 'CameraView',
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
    }
  },
  emits: ['frame', 'detections'],
  setup(props, { emit }) {
    const videoRef = ref(null)
    const canvasRef = ref(null)
    const isCameraReady = ref(false)
    const fps = ref(0)
    const detections = ref([])

    const canvasWidth = computed(() => props.width)
    const canvasHeight = computed(() => props.height)

    let stream = null
    let animationFrameId = null
    let frameCount = 0
    let lastFpsUpdate = 0

    const onVideoLoaded = () => {
      isCameraReady.value = true
      startProcessing()
    }

    const startCamera = async () => {
      try {
        // 请求摄像头权限
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: props.width },
            height: { ideal: props.height },
            facingMode: 'user'
          }
        })
        
        if (videoRef.value) {
          videoRef.value.srcObject = stream
        }
      } catch (error) {
        console.error('摄像头启动失败:', error)
        if (error.name === 'NotAllowedError') {
          alert('无法访问摄像头，请在浏览器设置中允许摄像头权限')
        } else if (error.name === 'NotFoundError') {
          alert('未找到摄像头设备')
        } else {
          alert('摄像头启动失败，请检查设备连接')
        }
      }
    }

    const startProcessing = () => {
      const processFrame = () => {
        if (!videoRef.value || !canvasRef.value) return
        
        const ctx = canvasRef.value.getContext('2d')
        ctx.drawImage(videoRef.value, 0, 0, canvasWidth.value, canvasHeight.value)
        
        const imageData = ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value)
        
        // 发送帧数据
        emit('frame', imageData)
        
        // 更新FPS
        frameCount++
        const currentTime = performance.now()
        if (currentTime - lastFpsUpdate >= 1000) {
          fps.value = frameCount
          frameCount = 0
          lastFpsUpdate = currentTime
        }
        
        animationFrameId = requestAnimationFrame(processFrame)
      }
      
      processFrame()
    }

    const updateDetections = (newDetections) => {
      detections.value = newDetections
      emit('detections', newDetections)
    }

    const getBoxStyle = (bbox) => {
      return {
        left: `${bbox.x1}px`,
        top: `${bbox.y1}px`,
        width: `${bbox.x2 - bbox.x1}px`,
        height: `${bbox.y2 - bbox.y1}px`
      }
    }

    const stopCamera = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        stream = null
      }
    }

    onMounted(() => {
      startCamera()
    })

    // 在组件卸载前关闭摄像头
    onBeforeUnmount(() => {
      stopCamera()
    })

    onUnmounted(() => {
      stopCamera()
    })

    return {
      videoRef,
      canvasRef,
      isCameraReady,
      fps,
      detections,
      canvasWidth,
      canvasHeight,
      onVideoLoaded,
      updateDetections,
      stopCamera
    }
  }
}
</script>

<style scoped>
.camera-view {
  position: relative;
  width: 100%;
  height: 100%;
}

video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: none;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.detection-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
}

.info-item {
  margin-bottom: 5px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: bold;
  margin-right: 5px;
}

.value {
  color: #409eff;
}

.detection-box {
  position: absolute;
  border: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
}

.gesture-label {
  position: absolute;
  top: -25px;
  left: 0;
  background: #409eff;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #fff;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #409eff;
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading p {
  font-size: 16px;
}
</style>