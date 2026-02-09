import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-webgl'
import * as handpose from '@tensorflow-models/handpose'
import type { HandDetection } from '../types/gesture'

export class TfjsGestureRecognitionService {
  private model: handpose.HandPose | null = null
  private isInitialized = false
  private isProcessing = false
  
  // 性能监控
  private fps = 0
  private frameCount = 0
  private lastFpsUpdate = 0
  
  async initialize(): Promise<void> {
    try {
      console.log('正在初始化 TensorFlow.js 手势识别模型...')
      
      // 加载 handpose 模型
      this.model = await handpose.load()
      this.isInitialized = true
      console.log('TensorFlow.js 手势识别系统初始化完成')
    } catch (error) {
      console.error('TensorFlow.js 模型初始化失败:', error)
      throw new Error(`TensorFlow.js 手势识别模型初始化失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  async processFrame(imageData: ImageData): Promise<HandDetection[]> {
    if (!this.isInitialized || this.isProcessing) {
      return []
    }
    
    this.isProcessing = true
    
    try {
      const startTime = performance.now()
      
      // 使用 handpose 模型检测手部
      const predictions = await this.model!.estimateHands(imageData, false)
      
      // 转换为 HandDetection 格式
      const detections: HandDetection[] = predictions.map((prediction, index) => {
        // 计算边界框
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        
        prediction.landmarks.forEach(landmark => {
          minX = Math.min(minX, landmark[0])
          minY = Math.min(minY, landmark[1])
          maxX = Math.max(maxX, landmark[0])
          maxY = Math.max(maxY, landmark[1])
        })
        
        // 添加一些边距
        const margin = 20
        minX = Math.max(0, minX - margin)
        minY = Math.max(0, minY - margin)
        maxX = Math.min(imageData.width, maxX + margin)
        maxY = Math.min(imageData.height, maxY + margin)
        
        // 简单的手势分类（基于关键点位置）
        const gesture = this.classifyGesture(prediction.landmarks)
        
        return {
          bbox: {
            x1: minX,
            y1: minY,
            x2: maxX,
            y2: maxY,
            confidence: prediction.handInViewConfidence
          },
          gesture,
          gestureName: this.getGestureName(gesture)
        }
      })
      
      // 更新 FPS
      this.frameCount++
      const currentTime = performance.now()
      if (currentTime - this.lastFpsUpdate >= 1000) {
        this.fps = this.frameCount
        this.frameCount = 0
        this.lastFpsUpdate = currentTime
      }
      
      const processingTime = performance.now() - startTime
      console.log(`TensorFlow.js 处理时间: ${processingTime.toFixed(2)}ms, FPS: ${this.fps}`)
      
      return detections
    } catch (error) {
      console.error('TensorFlow.js 帧处理失败:', error)
      return []
    } finally {
      this.isProcessing = false
    }
  }
  
  private classifyGesture(landmarks: number[][]): number {
    // 简单的手势分类逻辑
    // 0: 拳头
    // 1: 张开手
    // 2: 点赞
    // 3: 拇指向下
    // 4: 剪刀手
    // 5: OK 手势
    // 6: 其他
    
    // 拇指尖和食指尖的位置
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]
    const ringTip = landmarks[16]
    const pinkyTip = landmarks[20]
    
    // 手掌根部的位置
    const palmBase = landmarks[0]
    
    // 计算手指是否伸直
    const thumbExtended = this.isFingerExtended(thumbTip, landmarks[3], palmBase)
    const indexExtended = this.isFingerExtended(indexTip, landmarks[7], palmBase)
    const middleExtended = this.isFingerExtended(middleTip, landmarks[11], palmBase)
    const ringExtended = this.isFingerExtended(ringTip, landmarks[15], palmBase)
    const pinkyExtended = this.isFingerExtended(pinkyTip, landmarks[19], palmBase)
    
    // 计算拇指和食指之间的距离
    const thumbIndexDistance = this.getDistance(thumbTip, indexTip)
    const palmWidth = this.getDistance(landmarks[5], landmarks[17])
    const normalizedDistance = thumbIndexDistance / palmWidth
    
    // 分类手势
    if (!thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      // 所有手指都弯曲，是拳头
      return 0
    } else if (thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended) {
      // 所有手指都伸直，是张开手
      return 1
    } else if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      // 只有拇指伸直，是点赞
      return 2
    } else if (!thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      // 只有食指伸直，是指点
      return 5
    } else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      // 食指和中指伸直，是剪刀手
      return 4
    } else if (normalizedDistance < 0.5 && thumbExtended && indexExtended) {
      // 拇指和食指靠近，是 OK 手势
      return 5
    } else {
      // 其他手势
      return 6
    }
  }
  
  private isFingerExtended(tip: number[], pip: number[], palmBase: number[]): boolean {
    // 计算手指是否伸直
    const tipToPip = this.getDistance(tip, pip)
    const pipToPalm = this.getDistance(pip, palmBase)
    return tipToPip > pipToPalm * 0.7
  }
  
  private getDistance(point1: number[], point2: number[]): number {
    // 计算两点之间的欧几里得距离
    const dx = point1[0] - point2[0]
    const dy = point1[1] - point2[1]
    return Math.sqrt(dx * dx + dy * dy)
  }
  
  private getGestureName(gesture: number): string {
    // 根据手势 ID 返回手势名称
    const gestureNames = {
      0: 'fist',
      1: 'palm',
      2: 'like',
      3: 'dislike',
      4: 'peace',
      5: 'ok',
      6: 'unknown'
    }
    return gestureNames[gesture] || 'unknown'
  }
  
  isReady(): boolean {
    return this.isInitialized
  }
}