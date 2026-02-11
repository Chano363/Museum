import type { HandDetection } from '../types/gesture'
import { GESTURE_MAPPINGS, ACTION_RECOGNITION_CONFIG, type ActionType } from '../constants/gestureConstants'

// 灵活的手势映射表：允许多个手势ID映射到同一个操作
// 这样可以提高操作成功率，因为模型可能识别到相似的手势
const gestureToActionMap: Record<number, ActionType> = {
  // 放大操作
  27: 'zoom_in',      // like (点赞)
  3: 'zoom_in',       // thumb_index (拇指食指) - 也是拇指向上动作
  39: 'zoom_in',       // two_up (二上) - 向上动作
  18: 'zoom_in',      // grabbing (抓取) - 增加更多手势映射
  
  // 缩小操作
  24: 'zoom_out',      // dislike (点踩)
  20: 'zoom_out',      // call (打电话手势) - 增加更多手势映射
  
  // 移动模型操作
  38: 'rotate',       // three2 (三指向下)
  
  // 旋转操作
  31: 'rotate',         // palm (手掌)
  35: 'rotate',         // stop (停止)
  36: 'rotate',         // stop_inverted (停止反转)
  32: 'rotate',         // four (四指)
  33: 'rotate',         // three (三指)
  19: 'rotate',       // point (手指指向)
  30: 'rotate',       // one (一指) - 也是单指动作
  
  // 旋转操作
  29: 'rotate',         // ok (OK手势)
  11: 'rotate',         // part_hand_heart (心形手势1)
  12: 'rotate',         // part_hand_heart2 (心形手势2)
  22: 'rotate',         // little_finger (小指)
  
  
  // 只有SWIPE相关的手势用于切换展品
  // 注意：SWIPE手势主要通过前端SwipeDetector检测，这里不直接映射静态手势ID
}

// 手部验证函数：检查检测到的区域是否符合手部特征
const validateHandDetection = (detection: HandDetection): boolean => {
  // 检查检测到的区域是否符合手部的大小和形状特征
  const bbox = detection.bbox;
  const width = bbox.x2 - bbox.x1;
  const height = bbox.y2 - bbox.y1;
  
  // 手部的宽高比通常在0.3-2之间
  const aspectRatio = width / height;
  if (aspectRatio < 0.3 || aspectRatio > 2) {
    return false;
  }
  
  // 手部的大小应该在合理范围内
  const area = width * height;
  if (area < 1000 || area > 100000) {
    return false;
  }
  
  return true;
}

// 静态手势ID列表（需要严格验证的手势）
const STATIC_GESTURES = GESTURE_MAPPINGS.STATIC_GESTURES // 包含所有需要验证的手势，包括dislike和four

// 动态手势ID列表（需要实时响应的手势）
const DYNAMIC_GESTURES = GESTURE_MAPPINGS.DYNAMIC_GESTURES // point, one（用于旋转）

/**
 * 动作识别服务
 * 
 * 注意事项：
 * 1. 动态动作（如 rotate）需要持续触发，确保手指追踪能够持续
 * 2. 静态动作（如 zoom_in, zoom_out）需要在冷却时间后再次触发
 * 3. 稳定性阈值和历史记录长度是经过调优的，不要轻易修改
 * 4. 动作触发逻辑已经过系统性修复，确保所有动作能够正确触发
 */
export class ActionRecognitionService {
  private currentAction: ActionType | null = null
  private actionStartTime = 0
  private gestureHistory: ActionType[] = [] // 动作历史记录（存储动作类型而不是手势ID）
  private readonly MAX_HISTORY_LENGTH = ACTION_RECOGNITION_CONFIG.MAX_HISTORY_LENGTH // 最大历史记录数
  private readonly STABILITY_THRESHOLD = ACTION_RECOGNITION_CONFIG.STABILITY_THRESHOLD // 稳定阈值
  
  updateDetections(detections: HandDetection[]): ActionType | null {
    const currentTime = Date.now()
    
    if (detections.length > 0) {
      console.log('ActionRecognitionService.updateDetections:', detections.length, 'detections')
    }
    
    // 过滤掉不符合手部特征的检测结果
    console.log('原始检测结果数量:', detections.length, '，检测到的手势ID:', detections.map(d => d.gesture))
    const validDetections = detections.filter(detection => {
      const isValid = validateHandDetection(detection)
      console.log('手势ID:', detection.gesture, '，验证结果:', isValid)
      return isValid
    })
    console.log('验证后的检测结果数量:', validDetections.length)
    
    // 直接根据当前检测到的手势返回操作
    if (validDetections.length > 0) {
      const lastDetection = validDetections[validDetections.length - 1]
      const gestureId = lastDetection.gesture
      const action = this.mapGestureToAction(gestureId)
      console.log('处理手势ID:', gestureId, '，映射到动作:', action)
      
      if (!action) {
        console.log('手势ID:', gestureId, '没有映射到任何动作')
        return null
      }
      
      // 当检测到的动作与当前动作不同时，清除部分历史记录，减少之前动作的影响
      if (action !== this.currentAction) {
        // 保留最近的10条历史记录，清除更早的记录
        if (this.gestureHistory.length > 10) {
          this.gestureHistory = this.gestureHistory.slice(-10)
          console.log('动作变化，清除部分历史记录，当前长度:', this.gestureHistory.length)
        }
      }
      
      // 动态动作列表（需要实时响应的动作）
      const DYNAMIC_ACTIONS = ['rotate'] // 旋转动作需要实时响应
      
      // 根据动作类型决定如何处理
      if (DYNAMIC_ACTIONS.includes(action)) {
        // 对于动态动作（需要实时响应）
        this.gestureHistory.push(action) // 存储动作类型
        console.log('添加动作到历史记录:', action, '，历史记录长度:', this.gestureHistory.length)
        
        // 限制历史记录长度（动态动作使用更短的历史记录）
        if (this.gestureHistory.length > 15) { // 动态动作只需要15轮历史，减少触发时间
          this.gestureHistory.shift()
          console.log('历史记录超过最大长度，移除最早的记录，当前长度:', this.gestureHistory.length)
        }
        
        // 计算最常见的动作（动态动作需要较少历史记录和较低的稳定性）
        const stableAction = this.getStableAction(false)
        
        if (stableAction) {
          if (stableAction !== this.currentAction) {
            this.currentAction = stableAction
            this.actionStartTime = currentTime
            console.log('动态动作确认:', stableAction)
          }
          // 对于动态动作，只要有稳定动作就返回，确保持续触发
          return stableAction
        }
        
        // 对于动态动作，特别是rotate，只要检测到手势就返回，确保持续触发
        if (action === 'rotate') {
          // 对于rotate动作，即使历史记录不足，也直接返回
          console.log('检测到rotate手势，直接返回:', action)
          return action
        }
        
        // 对于其他动态动作，只有达到稳定性要求才返回，确保手势稳定
        if (action && this.gestureHistory.length >= 5) {
          // 即使历史记录不足，也要检查最近的几个动作是否一致
          const recentHistory = this.gestureHistory.slice(-5)
          const recentActionCount = recentHistory.filter(a => a === action).length
          const recentStability = recentActionCount / recentHistory.length
          
          if (recentStability >= 0.8) {
            console.log('动态动作稳定，直接返回:', action, '稳定性:', recentStability.toFixed(2))
            return action
          } else {
            console.log('动态动作不稳定，等待更多数据:', action, '稳定性:', recentStability.toFixed(2))
          }
        }
        
        return null
      } else {
        // 对于静态动作（需要严格验证）
        this.gestureHistory.push(action) // 存储动作类型
        console.log('添加动作到历史记录:', action, '，历史记录长度:', this.gestureHistory.length)
        
        // 限制历史记录长度
        if (this.gestureHistory.length > this.MAX_HISTORY_LENGTH) {
          this.gestureHistory.shift()
          console.log('历史记录超过最大长度，移除最早的记录，当前长度:', this.gestureHistory.length)
        }
        
        // 计算最常见的动作（静态动作需要更多历史记录和更高的稳定性）
        const stableAction = this.getStableAction(true)
        
        if (stableAction) {
          if (stableAction !== this.currentAction) {
            this.currentAction = stableAction
            this.actionStartTime = currentTime
            console.log('静态动作确认:', stableAction)
            return stableAction
          } else if (currentTime - this.actionStartTime > 3000) {
            // 如果动作已经确认超过3秒，允许再次触发
            this.actionStartTime = currentTime
            console.log('静态动作再次确认:', stableAction)
            return stableAction
          }
        }
        
        return null
      }
    } else {
      // 没有检测到手势时清除历史
      this.gestureHistory = []
    }
    
    // 重置当前动作（仅重置静态动作，动态动作如rotate需要持续触发）
    const DYNAMIC_ACTIONS = ['rotate'] // 旋转动作需要实时响应
    if (this.currentAction && !DYNAMIC_ACTIONS.includes(this.currentAction) && currentTime - this.actionStartTime > 3000) {
      this.currentAction = null
    }
    
    return null
  }
  
  // 获取最稳定的动作（多数投票）
  private getStableAction(isStatic: boolean): ActionType | null {
    // 静态手势需要更多历史记录，动态手势需要较少历史记录
    const minHistoryLength = isStatic ? ACTION_RECOGNITION_CONFIG.MIN_HISTORY_LENGTH_STATIC : ACTION_RECOGNITION_CONFIG.MIN_HISTORY_LENGTH_DYNAMIC
    
    if (this.gestureHistory.length < minHistoryLength) {
      return null // 历史记录不足，等待更多数据
    }
    
    // 统计每个动作的出现次数
    const actionCounts: Record<string, number> = {}
    for (const action of this.gestureHistory) {
      actionCounts[action] = (actionCounts[action] || 0) + 1
    }
    
    // 找出出现次数最多的动作
    let maxCount = 0
    let mostFrequentAction: ActionType | null = null
    for (const [action, count] of Object.entries(actionCounts)) {
      if (count > maxCount) {
        maxCount = count
        mostFrequentAction = action as ActionType
      }
    }
    
    // 检查是否达到稳定阈值（静态手势需要更高的稳定性）
    const requiredStability = isStatic ? ACTION_RECOGNITION_CONFIG.STABILITY_THRESHOLD_STATIC : ACTION_RECOGNITION_CONFIG.STABILITY_THRESHOLD_DYNAMIC
    const stability = maxCount / this.gestureHistory.length
    console.log(`${isStatic ? '静态' : '动态'}动作稳定性:`, stability.toFixed(2), '历史长度:', this.gestureHistory.length)
    
    if (stability >= requiredStability && mostFrequentAction !== null) {
      return mostFrequentAction
    }
    
    return null
  }
  
  private mapGestureToAction(gestureId: number): ActionType | null {
    const action = gestureToActionMap[gestureId]
    return action
  }
  
  reset(): void {
    this.currentAction = null
    this.actionStartTime = 0
    this.gestureHistory = []
  }
}
