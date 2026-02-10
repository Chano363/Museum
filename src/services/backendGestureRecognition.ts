import type { HandDetection } from '../types/gesture'

export class BackendGestureRecognitionService {
  private isInitialized = false
  private isProcessing = false
  
  // 重用canvas元素
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  
  // 网络传输配置
  private connectionTimeout = 5000 // 连接超时5秒
  private retryCount = 0
  private maxRetries = 1 // 最大1次重试
  
  async initialize(): Promise<void> {
    try {
      console.log('正在初始化后端手势识别服务...')
      
      // 初始化canvas元素
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
      
      if (!this.ctx) {
        throw new Error('无法创建画布上下文')
      }
      
      // 测试后端连接 - 创建一个简单的 1x1 像素的图像
      this.canvas.width = 1
      this.canvas.height = 1
      this.ctx.fillStyle = '#000000'
      this.ctx.fillRect(0, 0, 1, 1)
      const base64Image = this.canvas.toDataURL('image/jpeg')
      
      try {
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
          console.warn('后端手势识别服务初始化失败，将在需要时重试:', await response.text())
          // 不抛出错误，允许服务继续运行
        }
      } catch (error) {
        console.warn('后端服务连接失败，将在需要时重试:', error)
        // 不抛出错误，允许服务继续运行
      }
    } catch (error) {
      console.error('后端手势识别服务初始化失败:', error)
      // 不抛出错误，允许服务继续运行
    }
  }
  
  async processFrame(imageData: ImageData): Promise<HandDetection[]> {
    // 检查是否正在处理其他帧
    if (this.isProcessing) {
      return []
    }
    
    // 立即设置为处理中，避免并发处理
    this.isProcessing = true
    
    try {
      // 前端图像处理
      if (!this.canvas || !this.ctx) {
        return []
      }
      
      // 使用完整分辨率，不降低图像质量
      this.canvas.width = imageData.width
      this.canvas.height = imageData.height
      this.ctx.putImageData(imageData, 0, 0)
      
      // 使用JPEG格式，质量0.7
      const base64Image = this.canvas.toDataURL('image/jpeg', 0.7)
      
      // 发送到后端（带超时和重试）
      let response
      let retryCount = 0
      
      while (retryCount <= this.maxRetries) {
        try {
          // 使用Promise.race实现超时处理
          const fetchPromise = fetch('/api/recognize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: base64Image })
          })
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('请求超时')), this.connectionTimeout)
          )
          
          response = await Promise.race([fetchPromise, timeoutPromise])
          
          if (!response.ok) {
            throw new Error(`后端服务错误: ${response.status}`)
          }
          break
        } catch (error) {
          retryCount++
          if (retryCount > this.maxRetries) {
            return []
          }
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      const data = await response.json()
      const detections: HandDetection[] = data.detections || []
      
      return detections
    } catch (error) {
      return []
    } finally {
      this.isProcessing = false
    }
  }
  
  getFPS(): number {
    return 0
  }
  
  isReady(): boolean {
    return this.isInitialized
  }
  
  async destroy(): Promise<void> {
    this.isInitialized = false
    console.log('后端手势识别服务已销毁')
  }
}
