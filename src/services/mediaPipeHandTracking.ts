import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

export interface FingerPosition {
  x: number
  y: number
  z?: number
}

export class MediaPipeHandTrackingService {
  private hands: Hands | null = null
  private isInitialized = false
  private isProcessing = false
  
  // 平滑处理相关
  private positionHistory: FingerPosition[] = []
  private readonly MAX_HISTORY = 5
  private readonly SMOOTHING_FACTOR = 0.7
  
  // 回调函数
  private onResultCallback: ((position: FingerPosition) => void) | null = null
  
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }
    
    try {
      console.log('初始化MediaPipe Hands服务...')
      
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        }
      })
      
      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })
      
      this.hands.onResults(this.onResults.bind(this))
      
      this.isInitialized = true
      console.log('MediaPipe Hands服务初始化成功')
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
      
      // 创建临时canvas用于处理图像数据
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        return null
      }
      
      canvas.width = imageData.width
      canvas.height = imageData.height
      ctx.putImageData(imageData, 0, 0)
      
      // 发送到MediaPipe处理
      await this.hands.send({ image: canvas })
      
      return null
    } catch (error) {
      console.error('MediaPipe处理失败:', error)
      return null
    } finally {
      this.isProcessing = false
    }
  }
  
  private onResults(results: any): void {
    if (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return
    }
    
    const landmarks = results.multiHandLandmarks[0]
    
    if (!landmarks || landmarks.length < 9) {
      return
    }
    
    // 获取食指指尖（关键点8）的坐标
    const indexFingerTip = landmarks[8]
    const position: FingerPosition = {
      x: indexFingerTip.x * 640, // 假设图像宽度为640
      y: indexFingerTip.y * 480, // 假设图像高度为480
      z: indexFingerTip.z
    }
    
    // 平滑处理
    const smoothedPosition = this.smoothPosition(position)
    
    // 调用回调函数
    if (this.onResultCallback) {
      this.onResultCallback(smoothedPosition)
    }
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
  }
  
  async destroy(): Promise<void> {
    if (this.hands) {
      this.hands.close()
      this.hands = null
    }
    
    this.isInitialized = false
    this.onResultCallback = null
    this.positionHistory = []
    
    console.log('MediaPipe Hands服务已销毁')
  }
  
  isReady(): boolean {
    return this.isInitialized
  }
}