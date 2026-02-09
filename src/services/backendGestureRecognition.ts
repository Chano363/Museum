import type { HandDetection } from '../types/gesture'

export class BackendGestureRecognitionService {
  private isInitialized = false
  private isProcessing = false
  
  // 性能监控
  private fps = 0
  private frameCount = 0
  private lastFpsUpdate = 0
  
  async initialize(): Promise<void> {
    try {
      console.log('正在初始化后端手势识别服务...')
      
      // 测试后端连接 - 创建一个简单的 1x1 像素的图像
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('无法创建画布上下文')
      }
      
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 1, 1)
      const base64Image = canvas.toDataURL('image/jpeg')
      
      const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image })
      })
      
      if (response.ok) {
        console.log('后端手势识别服务初始化成功')
        this.isInitialized = true
      } else {
        console.error('后端手势识别服务初始化失败:', await response.text())
        throw new Error('后端服务连接失败')
      }
    } catch (error) {
      console.error('后端手势识别服务初始化失败:', error)
      throw error
    }
  }
  
  async processFrame(imageData: ImageData): Promise<HandDetection[]> {
    if (!this.isInitialized || this.isProcessing) {
      return []
    }
    
    this.isProcessing = true
    
    try {
      const startTime = performance.now()
      
      // 将 ImageData 转换为 base64
      const canvas = document.createElement('canvas')
      canvas.width = imageData.width
      canvas.height = imageData.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('无法创建画布上下文')
      }
      
      ctx.putImageData(imageData, 0, 0)
      const base64Image = canvas.toDataURL('image/jpeg')
      
      // 发送到后端
      const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image })
      })
      
      if (!response.ok) {
        throw new Error(`后端服务错误: ${await response.text()}`)
      }
      
      const data = await response.json()
      const detections: HandDetection[] = data.detections || []
      
      // 性能监控
      this.updateFPS(startTime)
      
      return detections
    } catch (error) {
      console.error('后端手势识别处理失败:', error)
      return []
    } finally {
      this.isProcessing = false
    }
  }
  
  private updateFPS(startTime: number) {
    this.frameCount++
    const now = performance.now()
    
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount / ((now - this.lastFpsUpdate) / 1000)
      this.frameCount = 0
      this.lastFpsUpdate = now
      console.log(`后端手势识别 FPS: ${this.fps.toFixed(1)}`)
    }
  }
  
  getFPS(): number {
    return this.fps
  }
  
  isReady(): boolean {
    return this.isInitialized
  }
  
  async destroy(): Promise<void> {
    this.isInitialized = false
    console.log('后端手势识别服务已销毁')
  }
}
