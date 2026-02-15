<template>
  <div class="camera-view">
    <!-- 摄像头视频元素 - 直接显示画面 -->
    <video
      ref="videoRef"
      autoplay
      playsinline
      muted
      class="video-display"
    ></video>
    
    <!-- 调试覆盖层 - 仅在开发模式下显示 -->
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
        <div class="info-item">
          <span class="label">摄像头状态:</span>
          <span class="value">{{ isCameraReady ? '就绪' : '加载中' }}</span>
        </div>
      </div>
      <div 
        v-for="(detection, index) in detections" 
        :key="index" 
        class="detection-box" 
        :style="getBoxStyle(detection.bbox)"
      >
        <div class="gesture-label">{{ detection.gestureName }}</div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="!isCameraReady" class="loading">
      <div class="loading-spinner"></div>
      <p>正在初始化摄像头...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 组件属性
const props = defineProps({
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
  },
  handLandmarks: {
    type: Object,
    default: null
  }
})

// 组件事件
const emit = defineEmits(['frame', 'detections'])

// 响应式引用
const videoRef = ref(null)
const isCameraReady = ref(false)
const fps = ref(0)
const detections = ref([])

// 内部状态
let stream = null
let animationFrameId = null
let frameCount = 0
let lastFpsUpdate = 0
let lastProcessTime = 0
const PROCESS_INTERVAL = 40 // 约25fps

// 视频加载完成处理
const onVideoLoaded = () => {
  console.log('视频加载完成')
  isCameraReady.value = true
  startProcessing()
}

// 启动摄像头
const startCamera = async () => {
  try {
    console.log('开始启动摄像头...')
    
    // 检查浏览器是否支持媒体设备
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('浏览器不支持摄像头访问')
    }
    
    // 请求摄像头权限
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: props.width },
        height: { ideal: props.height },
        facingMode: 'user'
      }
    })
    
    console.log('摄像头权限获取成功，流状态:', stream.active)
    
    if (videoRef.value) {
      // 确保视频元素正确设置
      videoRef.value.srcObject = stream
      videoRef.value.onloadedmetadata = onVideoLoaded
      videoRef.value.onplay = () => {
        console.log('视频开始播放')
      }
      videoRef.value.onerror = (e) => {
        console.error('视频元素错误:', e)
      }
      
      console.log('视频流已设置到video元素')
    } else {
      console.error('videoRef未找到')
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
    
    // 即使失败也要设置isCameraReady为true，避免一直显示加载状态
    isCameraReady.value = true
  }
}

// 开始处理视频帧
const startProcessing = () => {
  processFrame()
}

// 处理每一帧
const processFrame = () => {
  if (!videoRef.value) {
    animationFrameId = requestAnimationFrame(processFrame)
    return
  }
  
  // 检查视频是否已加载
  if (videoRef.value.readyState < 2) {
    animationFrameId = requestAnimationFrame(processFrame)
    return
  }
  
  // 获取当前时间
  const currentTime = performance.now()
  
  // 帧处理节流
  if (currentTime - lastProcessTime < PROCESS_INTERVAL) {
    animationFrameId = requestAnimationFrame(processFrame)
    return
  }
  
  lastProcessTime = currentTime
  
  try {
    // 生成用于处理的图像数据
    const imageData = captureVideoFrame()
    
    // 发送帧数据
    emit('frame', imageData)
    
    // 更新FPS
    updateFps(currentTime)
    
  } catch (error) {
    console.error('帧处理失败:', error)
  }
  
  // 继续下一帧
  animationFrameId = requestAnimationFrame(processFrame)
}

// 捕获视频帧作为图像数据
const captureVideoFrame = () => {
  // 创建临时canvas来捕获视频帧
  const canvas = document.createElement('canvas')
  canvas.width = props.width / 2
  canvas.height = props.height / 2
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法创建canvas上下文')
  }
  
  // 绘制视频帧到canvas
  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
  
  // 获取图像数据
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

// 更新FPS计数
const updateFps = (currentTime) => {
  frameCount++
  if (currentTime - lastFpsUpdate >= 1000) {
    fps.value = frameCount
    frameCount = 0
    lastFpsUpdate = currentTime
  }
}

// 更新检测结果
const updateDetections = (newDetections) => {
  detections.value = newDetections
  emit('detections', newDetections)
}

// 获取检测框样式
const getBoxStyle = (bbox) => {
  if (!videoRef.value) {
    return {
      left: `${bbox.x1}px`,
      top: `${bbox.y1}px`,
      width: `${bbox.x2 - bbox.x1}px`,
      height: `${bbox.y2 - bbox.y1}px`
    }
  }
  
  // 注意：视频帧被压缩了一半发送给后端，所以检测框坐标也是基于压缩后的尺寸
  // 需要将检测框坐标乘以2来映射回原始尺寸
  const compressionRatio = 2
  
  const videoWidth = videoRef.value.offsetWidth
  const videoHeight = videoRef.value.offsetHeight
  
  const scaleX = videoWidth / props.width
  const scaleY = videoHeight / props.height
  
  const originalLeft = bbox.x1 * compressionRatio * scaleX
  const top = bbox.y1 * compressionRatio * scaleY
  const width = (bbox.x2 - bbox.x1) * compressionRatio * scaleX
  const height = (bbox.y2 - bbox.y1) * compressionRatio * scaleY
  
  // 考虑视频的水平翻转（transform: scaleX(-1)）
  // 翻转后的left坐标 = 视频宽度 - 原始left - 宽度
  const flippedLeft = videoWidth - originalLeft - width
  
  return {
    left: `${flippedLeft}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  }
}

// 停止摄像头
const stopCamera = () => {
  // 取消动画帧
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  // 停止视频流
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  
  // 重置状态
  isCameraReady.value = false
}

// 生命周期钩子
onMounted(() => {
  startCamera()
})

onUnmounted(() => {
  stopCamera()
})

// 暴露方法给父组件
defineExpose({
  updateDetections,
  stopCamera
})
</script>

<style scoped>
.camera-view {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: var(--font-family);
  background-color: #000;
}

/* 视频显示 - 直接显示摄像头画面 */
.video-display {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* 水平翻转，获得镜像效果 */
  z-index: 1;
}

/* 调试覆盖层 */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

/* 检测信息 */
.detection-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 11;
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

/* 检测框 */
.detection-box {
  position: absolute;
  border: 2px solid var(--text-color);
  background: rgba(196, 146, 16, 0.1);
  border-radius: 4px;
  z-index: 11;
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

/* 加载状态 */
.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #fff;
  z-index: 20;
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
  margin: 0;
}
</style>