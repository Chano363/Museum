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
    },
    handLandmarks: {
      type: Object,
      default: null
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
      
      // 获取 canvas context 并设置 willReadFrequently 属性以优化性能
      const ctx = canvasRef.value.getContext('2d', { willReadFrequently: true })
      
      // 水平翻转canvas，以纠正视频的翻转效果
      ctx.save()
      ctx.translate(canvasWidth.value, 0)
      ctx.scale(-1, 1)
      
      // 绘制视频帧
      ctx.drawImage(videoRef.value, 0, 0, canvasWidth.value, canvasHeight.value)
      
      // 绘制手部关键点
      if (props.handLandmarks && props.handLandmarks.landmarks && props.handLandmarks.landmarks.length > 0) {
        console.log('CameraView.processFrame: 绘制手部关键点:', props.handLandmarks)
        drawHandLandmarks(ctx, props.handLandmarks)
      }
      
      ctx.restore()
      
      const imageData = ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value)
      
      // 发送帧数据，确保每一帧都被处理
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
    
    const drawHandLandmarks = (ctx, handLandmarks) => {
    console.log('CameraView.drawHandLandmarks: 开始绘制手部关键点:', handLandmarks)
    if (!handLandmarks || !handLandmarks.landmarks) {
      console.log('CameraView.drawHandLandmarks: 无效的手部关键点数据')
      return
    }
    
    const landmarks = handLandmarks.landmarks
    console.log('CameraView.drawHandLandmarks: 关键点数量:', landmarks.length)
    
    if (landmarks.length < 21) {
      console.log('CameraView.drawHandLandmarks: 关键点数量不足')
      return
    }
    
    // 获取canvas的实际显示大小
    const canvasElement = canvasRef.value
    if (!canvasElement) {
      console.log('CameraView.drawHandLandmarks: canvas元素不存在')
      return
    }
    
    const displayWidth = canvasElement.offsetWidth
    const displayHeight = canvasElement.offsetHeight
    
    console.log('CameraView.drawHandLandmarks: canvas显示大小:', { displayWidth, displayHeight })
    
    // 坐标映射函数：将原始640x480坐标转换为实际显示坐标
    const mapCoordinates = (x, y) => {
      // 注意：摄像头画面是水平翻转的，需要调整x坐标
      // 同时，确保坐标在有效范围内
      const clampedX = Math.max(0, Math.min(640, x))
      const clampedY = Math.max(0, Math.min(480, y))
      
      // 水平翻转x坐标
      const flippedX = 640 - clampedX
      
      // 映射到实际显示尺寸
      const mappedX = (flippedX / 640) * displayWidth
      const mappedY = (clampedY / 480) * displayHeight
      
      console.log(`CameraView.mapCoordinates: 原始坐标 (${x}, ${y}) -> 限制后 (${clampedX}, ${clampedY}) -> 翻转后 (${flippedX}, ${clampedY}) -> 映射后 (${mappedX}, ${mappedY})`)
      
      return { x: mappedX, y: mappedY }
    }
    
    // 定义手指的连接关系
    const connections = [
      // 手腕到手指根部
      [0, 1], [1, 2], [2, 3], [3, 4], // 拇指
      [0, 5], [5, 6], [6, 7], [7, 8], // 食指
      [0, 9], [9, 10], [10, 11], [11, 12], // 中指
      [0, 13], [13, 14], [14, 15], [15, 16], // 无名指
      [0, 17], [17, 18], [18, 19], [19, 20]  // 小指
    ]
    
    // 绘制连接线
    ctx.strokeStyle = '#FF0000'
    ctx.lineWidth = 3
    console.log('CameraView.drawHandLandmarks: 开始绘制骨骼连接线')
    
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start]
      const endPoint = landmarks[end]
      
      if (startPoint && endPoint) {
        console.log(`CameraView.drawHandLandmarks: 绘制连接 ${start} -> ${end}: 起点 ${JSON.stringify(startPoint)}, 终点 ${JSON.stringify(endPoint)}`)
        const mappedStart = mapCoordinates(startPoint.x, startPoint.y)
        const mappedEnd = mapCoordinates(endPoint.x, endPoint.y)
        console.log(`CameraView.drawHandLandmarks: 映射后起点 ${JSON.stringify(mappedStart)}, 映射后终点 ${JSON.stringify(mappedEnd)}`)
        
        ctx.beginPath()
        ctx.moveTo(mappedStart.x, mappedStart.y)
        ctx.lineTo(mappedEnd.x, mappedEnd.y)
        ctx.stroke()
        console.log(`CameraView.drawHandLandmarks: 连接线 ${start} -> ${end} 绘制完成`)
      } else {
        console.log(`CameraView.drawHandLandmarks: 连接 ${start} -> ${end} 点数据无效`)
      }
    })
    
    // 绘制关键点
    ctx.lineWidth = 2
    console.log('CameraView.drawHandLandmarks: 开始绘制关键点')
    
    landmarks.forEach((landmark, index) => {
      if (landmark) {
        console.log(`CameraView.drawHandLandmarks: 绘制关键点 ${index}: ${JSON.stringify(landmark)}`)
        const mappedPoint = mapCoordinates(landmark.x, landmark.y)
        console.log(`CameraView.drawHandLandmarks: 映射后关键点 ${index}: ${JSON.stringify(mappedPoint)}`)
        
        // 绘制外圈 - 增大尺寸
        ctx.beginPath()
        ctx.arc(mappedPoint.x, mappedPoint.y, 10, 0, Math.PI * 2)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
        ctx.strokeStyle = '#FF0000'
        ctx.stroke()
        
        // 绘制内圈 - 增大尺寸
        ctx.beginPath()
        ctx.arc(mappedPoint.x, mappedPoint.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#FF0000'
        ctx.fill()
        
        console.log(`CameraView.drawHandLandmarks: 关键点 ${index} 绘制完成`)
      } else {
        console.log(`CameraView.drawHandLandmarks: 关键点 ${index} 数据无效`)
      }
    })
    
    console.log('CameraView.drawHandLandmarks: 手部关键点绘制完成')
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
      stopCamera,
      getBoxStyle,
      drawHandLandmarks
    }
  }
}
</script>

<style scoped>
.camera-view {
  position: relative;
  width: 100%;
  height: 100%;
  font-family: var(--font-family);
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
  /* 显示 canvas 以展示手部关键点 */
  z-index: 10;
  pointer-events: none;
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
  color: var(--text-color);
}

.detection-box {
  position: absolute;
  border: 2px solid var(--text-color);
  background: rgba(196, 146, 16, 0.1);
  border-radius: 4px;
}

.gesture-label {
  position: absolute;
  top: -25px;
  left: 0;
  background: var(--text-color);
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
  border-top-color: var(--text-color);
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