import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import { MEDIAPIPE_CONFIG } from '../constants/gestureConstants'

export interface FingerPosition {
  x: number
  y: number
  z?: number
}

export interface HandLandmarks {
  landmarks: FingerPosition[]
  handInViewConfidence: number
}

export class MediaPipeHandTrackingService {
  private hands: Hands | null = null
  private isInitialized = false
  private isProcessing = false
  
  // 平滑处理相关
  private positionHistory: FingerPosition[] = []
  private readonly MAX_HISTORY = 15
  private readonly SMOOTHING_FACTOR = 0.98
  private readonly LANDMARK_SMOOTHING_FACTOR = 0.95
  
  // 回调函数
  private onResultCallback: ((position: FingerPosition) => void) | null = null
  
  // 最新的手部关键点
  private latestLandmarks: HandLandmarks | null = null
  
  // 重用 canvas 元素，避免频繁创建
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }
    
    try {
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        }
      })
      
      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // 降低模型复杂度，提高处理速度
        minDetectionConfidence: MEDIAPIPE_CONFIG.MIN_DETECTION_CONFIDENCE,
        minTrackingConfidence: MEDIAPIPE_CONFIG.MIN_TRACKING_CONFIDENCE
      })
      
      this.hands.onResults(this.onResults.bind(this))
      
      this.isInitialized = true
    } catch (error) {
      console.error('MediaPipe Hands服务初始化失败:', error)
      throw error
    }
  }
  
  async processFrame(imageData: ImageData): Promise<FingerPosition | null> {
    if (!this.isInitialized || this.isProcessing) {
      return null
    }
    
    this.isProcessing = true
    
    try {
      if (!this.hands) {
        return null
      }
      
      // 检查图像数据
      if (!imageData || !imageData.data) {
        return null
      }
      
      // 重用 canvas 元素，避免频繁创建
      if (!this.canvas) {
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext('2d')
      }
      
      if (!this.ctx) {
        return null
      }
      
      // 减小画布尺寸，提高处理速度
      this.canvas.width = 320
      this.canvas.height = 240
      
      // 绘制图像数据
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.ctx.putImageData(imageData, 0, 0)
      
      try {
        // 发送图像数据到 MediaPipe
        await this.hands.send({ image: this.canvas })
      } catch (error) {
        console.error('MediaPipeHandTrackingService.processFrame: 发送图像数据失败:', error)
        // 尝试重新初始化 MediaPipe
        try {
          await this.initialize()
        } catch (reinitError) {
          console.error('MediaPipeHandTrackingService.processFrame: 重新初始化失败:', reinitError)
        }
        return null
      }
      
      // 减少等待时间，提高实时性
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // 检查是否有最新的手部关键点
      const landmarks = this.getLatestLandmarks()
      
      if (landmarks && landmarks.landmarks && landmarks.landmarks.length > 8) {
        // 确保 landmarks.landmarks[8] 存在且有效
        if (landmarks.landmarks[8] && typeof landmarks.landmarks[8].x === 'number' && typeof landmarks.landmarks[8].y === 'number') {
          // 返回食指指尖（关键点8）的坐标
          return landmarks.landmarks[8]
        } else {
          return null
        }
      }
      
      return null
    } catch (error) {
      console.error('MediaPipe处理失败:', error)
      // 尝试重新初始化 MediaPipe
      try {
        await this.initialize()
      } catch (reinitError) {
        console.error('MediaPipeHandTrackingService.processFrame: 重新初始化失败:', reinitError)
      }
      return null
    } finally {
      // 确保 isProcessing 标志重置为 false
      this.isProcessing = false
    }
  }
  
  // 存储历史关键点数据
  private landmarksHistory: FingerPosition[][] = []
  private readonly MAX_LANDMARKS_HISTORY = 12
  
  private onResults(results: any): void {
    if (!results) {
      // 不设置latestLandmarks为null，保留上次的关键点
      return
    }
    
    if (!results.multiHandLandmarks) {
      // 不设置latestLandmarks为null，保留上次的关键点
      return
    }
    
    if (results.multiHandLandmarks.length === 0) {
      // 不设置latestLandmarks为null，保留上次的关键点
      return
    }
    
    const landmarks = results.multiHandLandmarks[0]
    
    if (!landmarks) {
      this.latestLandmarks = null
      return
    }
    
    if (landmarks.length < 21) {
      this.latestLandmarks = null
      return
    }
    
    // 存储所有关键点
    const normalizedLandmarks: FingerPosition[] = landmarks.map((landmark: any) => ({
      x: landmark.x * 640, // 保持与原始逻辑一致，映射到640x480坐标
      y: landmark.y * 480, // 保持与原始逻辑一致，映射到640x480坐标
      z: landmark.z
    }))
    
    // 平滑处理手部关键点
    const smoothedLandmarks = this.smoothLandmarks(normalizedLandmarks)
    
    // 检查是否有 multiHandedness 属性
    if (!results.multiHandedness || results.multiHandedness.length === 0) {
      this.latestLandmarks = {
        landmarks: smoothedLandmarks,
        handInViewConfidence: 0.5 // 使用默认值
      }
    } else {
      this.latestLandmarks = {
        landmarks: smoothedLandmarks,
        handInViewConfidence: results.multiHandedness[0].score
      }
    }
    
    // 获取食指指尖（关键点8）的坐标
    const indexFingerTip = landmarks[8]
    const position: FingerPosition = {
      x: indexFingerTip.x * 640, // 保持与原始逻辑一致，映射到640x480坐标
      y: indexFingerTip.y * 480, // 保持与原始逻辑一致，映射到640x480坐标
      z: indexFingerTip.z
    }
    
    // 平滑处理
    const smoothedPosition = this.smoothPosition(position)
    
    // 调用回调函数
    if (this.onResultCallback) {
      this.onResultCallback(smoothedPosition)
    }
  }
  
  // 平滑处理手部关键点
  private smoothLandmarks(landmarks: FingerPosition[]): FingerPosition[] {
    // 添加到历史记录
    this.landmarksHistory.push(landmarks)
    
    // 限制历史记录长度
    if (this.landmarksHistory.length > this.MAX_LANDMARKS_HISTORY) {
      this.landmarksHistory.shift()
    }
    
    // 如果历史记录不足，直接返回当前关键点
    if (this.landmarksHistory.length < 2) {
      return landmarks
    }
    
    // 平滑处理每个关键点
    const smoothedLandmarks: FingerPosition[] = landmarks.map((landmark, index) => {
      // 收集所有历史记录中对应索引的关键点
      const historyPoints = this.landmarksHistory.map(history => history[index])
        .filter(point => point !== undefined && point !== null)
      
      if (historyPoints.length < 2) {
        return landmark
      }
      
      // 计算移动平均
      let sumX = 0
      let sumY = 0
      let sumZ = 0
      
      for (const point of historyPoints) {
        sumX += point.x
        sumY += point.y
        sumZ += point.z || 0
      }
      
      const avgX = sumX / historyPoints.length
      const avgY = sumY / historyPoints.length
      const avgZ = sumZ / historyPoints.length
      
      // 混合当前位置和平滑位置
      return {
        x: landmark.x * (1 - this.LANDMARK_SMOOTHING_FACTOR) + avgX * this.LANDMARK_SMOOTHING_FACTOR,
        y: landmark.y * (1 - this.LANDMARK_SMOOTHING_FACTOR) + avgY * this.LANDMARK_SMOOTHING_FACTOR,
        z: (landmark.z || 0) * (1 - this.LANDMARK_SMOOTHING_FACTOR) + avgZ * this.LANDMARK_SMOOTHING_FACTOR
      }
    })
    
    return smoothedLandmarks
  }
  
  // 获取最新的手部关键点
  getLatestLandmarks(): HandLandmarks | null {
    return this.latestLandmarks
  }
  
  private smoothPosition(position: FingerPosition): FingerPosition {
    // 添加到历史记录
    this.positionHistory.push(position)
    
    // 限制历史记录长度
    if (this.positionHistory.length > this.MAX_HISTORY) {
      this.positionHistory.shift()
    }
    
    // 如果历史记录不足，直接返回当前位置
    if (this.positionHistory.length < 2) {
      return position
    }
    
    // 计算移动平均
    let sumX = 0
    let sumY = 0
    
    for (const pos of this.positionHistory) {
      sumX += pos.x
      sumY += pos.y
    }
    
    const avgX = sumX / this.positionHistory.length
    const avgY = sumY / this.positionHistory.length
    
    // 混合当前位置和平滑位置
    return {
      x: position.x * (1 - this.SMOOTHING_FACTOR) + avgX * this.SMOOTHING_FACTOR,
      y: position.y * (1 - this.SMOOTHING_FACTOR) + avgY * this.SMOOTHING_FACTOR,
      z: position.z
    }
  }
  
  onResult(callback: (position: FingerPosition) => void): void {
    this.onResultCallback = callback
  }
  
  clearHistory(): void {
    this.positionHistory = []
    this.landmarksHistory = []
  }
  
  async destroy(): Promise<void> {
    if (this.hands) {
      this.hands.close()
      this.hands = null
    }
    
    this.isInitialized = false
    this.onResultCallback = null
    this.positionHistory = []
    this.landmarksHistory = []
    this.latestLandmarks = null
  }
  
  isReady(): boolean {
    return this.isInitialized
  }
  
  async dispose(): Promise<void> {
    await this.destroy()
  }
}
