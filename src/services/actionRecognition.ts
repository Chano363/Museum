import type { HandDetection, ActionType } from '../types/gesture'
import { ActionType as AT } from '../types/gesture'

interface HandHistory {
  detections: HandDetection[]
  lastUpdate: number
}

export class ActionRecognitionService {
  private handHistories: Map<number, HandHistory> = new Map()
  private readonly MAX_HISTORY_LENGTH = 30
  private readonly MIN_FRAMES_FOR_ACTION = 15
  private readonly ACTION_THRESHOLD = 0.7
  
  private currentAction: ActionType | null = null
  private actionStartTime = 0
  
  updateDetections(detections: HandDetection[]): ActionType | null {
    const currentTime = Date.now()
    
    // 更新每个手的历史记录
    detections.forEach(detection => {
      const handId = this.getHandId(detection)
      let history = this.handHistories.get(handId)
      
      if (!history) {
        history = {
          detections: [],
          lastUpdate: currentTime
        }
        this.handHistories.set(handId, history)
      }
      
      history.detections.push(detection)
      history.lastUpdate = currentTime
      
      // 限制历史记录长度
      if (history.detections.length > this.MAX_HISTORY_LENGTH) {
        history.detections.shift()
      }
    })
    
    // 清理过期的手部历史
    this.cleanupOldHands(currentTime)
    
    // 识别动作
    const action = this.recognizeAction(currentTime)
    
    return action
  }
  
  private getHandId(detection: HandDetection): number {
    // 使用边界框中心点作为手部ID
    const centerX = (detection.bbox.x1 + detection.bbox.x2) / 2
    const centerY = (detection.bbox.y1 + detection.bbox.y2) / 2
    return Math.floor(centerX * 1000 + centerY)
  }
  
  private cleanupOldHands(currentTime: number): void {
    const maxAge = 2000 // 2秒
    
    for (const [handId, history] of this.handHistories) {
      if (currentTime - history.lastUpdate > maxAge) {
        this.handHistories.delete(handId)
      }
    }
  }
  
  private recognizeAction(currentTime: number): ActionType | null {
    for (const [handId, history] of this.handHistories) {
      if (history.detections.length < this.MIN_FRAMES_FOR_ACTION) {
        continue
      }
      
      const action = this.analyzeGestureSequence(history.detections)
      
      if (action && action !== this.currentAction) {
        this.currentAction = action
        this.actionStartTime = currentTime
        return action
      }
    }
    
    // 重置当前动作
    if (this.currentAction && currentTime - this.actionStartTime > 500) {
      this.currentAction = null
    }
    
    return null
  }
  
  private analyzeGestureSequence(detections: HandDetection[]): ActionType | null {
    const recentDetections = detections.slice(-this.MIN_FRAMES_FOR_ACTION)
    
    // 检测滑动动作
    const swipeAction = this.detectSwipe(recentDetections)
    if (swipeAction) return swipeAction
    
    // 检测点击动作
    const tapAction = this.detectTap(recentDetections)
    if (tapAction) return tapAction
    
    // 检测拖动动作
    const dragAction = this.detectDrag(recentDetections)
    if (dragAction) return dragAction
    
    // 检测静态手势
    const staticAction = this.detectStaticGesture(recentDetections)
    if (staticAction) return staticAction
    
    return null
  }
  
  private detectSwipe(detections: HandDetection[]): ActionType | null {
    const first = detections[0]
    const last = detections[detections.length - 1]
    
    const deltaX = last.bbox.x1 - first.bbox.x1
    const deltaY = last.bbox.y1 - first.bbox.y1
    
    const threshold = 100 // 最小滑动距离
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (deltaX > threshold) {
        return AT.SWIPE_RIGHT
      } else if (deltaX < -threshold) {
        return AT.SWIPE_LEFT
      }
    } else {
      // 垂直滑动
      if (deltaY > threshold) {
        return AT.SWIPE_DOWN
      } else if (deltaY < -threshold) {
        return AT.SWIPE_UP
      }
    }
    
    return null
  }
  
  private detectTap(detections: HandDetection[]): ActionType | null {
    // 检测连续的点手势
    const pointCount = detections.filter(d => d.gesture === 19).length
    
    if (pointCount >= this.MIN_FRAMES_FOR_ACTION * 0.8) {
      return AT.TAP
    }
    
    return null
  }
  
  private detectDrag(detections: HandDetection[]): ActionType | null {
    // 检测抓取手势
    const grabCount = detections.filter(d => d.gesture === 17).length
    
    if (grabCount >= this.MIN_FRAMES_FOR_ACTION * 0.6) {
      return AT.DRAG
    }
    
    return null
  }
  
  private detectStaticGesture(detections: HandDetection[]): ActionType | null {
    // 检测静态手势
    const gestureCounts = new Map<number, number>()
    
    // 统计每种手势出现的次数
    detections.forEach(d => {
      if (d.gesture !== undefined) {
        gestureCounts.set(d.gesture, (gestureCounts.get(d.gesture) || 0) + 1)
      }
    })
    
    // 找出出现次数最多的手势
    let maxCount = 0
    let mostFrequentGesture: number | null = null
    
    gestureCounts.forEach((count, gesture) => {
      if (count > maxCount) {
        maxCount = count
        mostFrequentGesture = gesture
      }
    })
    
    // 检查最频繁的手势是否占大多数
    if (mostFrequentGesture !== null && maxCount >= this.MIN_FRAMES_FOR_ACTION * 0.7) {
      // 根据手势类型返回相应的动作
      switch (mostFrequentGesture) {
        case 19: // point (手指指向)
          return AT.TAP // 用于触发手指追踪
        case 25: // fist (拳头)
          return AT.DRAG // 用于锁定/解锁旋转
        case 31: // palm (张开手)
          return AT.DROP // 用于重置视图
        case 27: // like (点赞)
          return AT.ZOOM_IN // 用于放大
        case 24: // dislike (拇指向下)
          return AT.ZOOM_OUT // 用于缩小
        case 29: // ok (OK手势)
          return AT.TAP // 用于显示信息
        default:
          return null
      }
    }
    
    return null
  }
  
  reset(): void {
    this.handHistories.clear()
    this.currentAction = null
    this.actionStartTime = 0
  }
}