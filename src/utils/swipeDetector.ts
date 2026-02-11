import { GestureEvent } from './gestureEnums'

export class SwipeDetector {
  private static readonly MIN_SWIPE_DURATION = 5 // 最小持续时间（帧）- 增加到5帧以减少误触发
  private static readonly SWIPE_THRESHOLD = 70 // 滑动阈值（像素）- 增加到70像素以减少误触发
  private static readonly MAX_SWIPE_DURATION = 30 // 最大持续时间（帧）

  private swipeStartTimestamp: number | null = null
  private swipeStartPosition: { x: number; y: number } | null = null

  /**
   * 检测SWIPE手势
   * @param currentPosition 当前手指位置
   * @param deltaX X方向移动距离
   * @param deltaY Y方向移动距离
   * @returns 检测到的SWIPE手势事件，未检测到返回null
   */
  detectSwipe(currentPosition: { x: number; y: number }, deltaX: number, deltaY: number): GestureEvent | null {
    const currentTime = Date.now()
    
    // 开始检测SWIPE
    if (!this.swipeStartTimestamp) {
      this.swipeStartTimestamp = currentTime
      this.swipeStartPosition = currentPosition
      return null
    }
    
    // 检查SWIPE持续时间
    const duration = (currentTime - this.swipeStartTimestamp) / 16.67 // 转换为帧数
    if (duration < SwipeDetector.MIN_SWIPE_DURATION) {
      return null
    }
    
    // 计算移动距离
    if (!this.swipeStartPosition) return null
    const distanceX = Math.abs(currentPosition.x - this.swipeStartPosition.x)
    const distanceY = Math.abs(currentPosition.y - this.swipeStartPosition.y)
    
    // 水平SWIPE检测
    if (distanceX > distanceY && distanceX > SwipeDetector.SWIPE_THRESHOLD) {
      this.reset()
      if (currentPosition.x > this.swipeStartPosition.x) {
        return GestureEvent.SWIPE_RIGHT
      } else {
        return GestureEvent.SWIPE_LEFT
      }
    }
    
    // 垂直SWIPE检测
    if (distanceY > distanceX && distanceY > SwipeDetector.SWIPE_THRESHOLD) {
      this.reset()
      if (currentPosition.y > this.swipeStartPosition.y) {
        return GestureEvent.SWIPE_DOWN
      } else {
        return GestureEvent.SWIPE_UP
      }
    }
    
    // 超时重置
    if (duration > SwipeDetector.MAX_SWIPE_DURATION) {
      this.reset()
    }
    
    return null
  }

  /**
   * 重置SWIPE检测器
   */
  reset(): void {
    this.swipeStartTimestamp = null
    this.swipeStartPosition = null
  }
}
