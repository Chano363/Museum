import type { HandDetection } from '../types/gesture'
import { GESTURE_MAPPINGS, ACTION_RECOGNITION_CONFIG, type ActionType } from '../constants/gestureConstants'

// 手势映射表：将手势ID映射到操作
// 注意：手势ID 0-44是静态手势分类，不是动态SWIPE事件
// SWIPE应该基于手部轨迹检测，而不是静态手势分类
const gestureToActionMap: Record<number, ActionType> = {
  // 放大操作
  27: 'zoom_in',      // like (点赞)
  39: 'zoom_in',      // two_up (二指向上)
  
  // 缩小操作
  24: 'zoom_out',     // dislike (点踩)
  
  // 旋转操作
  19: 'rotate',       // point (手指指向)
  30: 'rotate',       // one (一指)
  31: 'rotate',       // palm (手掌)
  35: 'rotate',       // stop (停止)
  36: 'rotate',       // stop_inverted (停止反转)
  29: 'rotate',       // ok (OK手势)
  
  // 注意：以下手势ID是静态手势，不应映射为SWIPE
  // 0: hand_down (手向下)
  // 1: hand_right (手向右)
  // 2: hand_left (手向左)
  // 3: thumb_index (拇指食指)
  // 10: half_down
  // 11: part_hand_heart
  // 12: part_hand_heart2
  // 13: fist_inverted
  // 15: two_right
  // 16: two_down
  // 17: grabbing
  // 18: grip
  // 如果需要SWIPE功能，应基于手部轨迹检测实现，而不是静态手势分类
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
    
    // 过滤掉不符合手部特征的检测结果
    const validDetections = detections.filter(detection => validateHandDetection(detection))
    
    // 直接根据当前检测到的手势返回操作
    if (validDetections.length > 0) {
      const lastDetection = validDetections[validDetections.length - 1]
      const gestureId = lastDetection.gesture
      const action = this.mapGestureToAction(gestureId)
      
      if (!action) {
        return null
      }
      
      // 当检测到的动作与当前动作不同时，清除部分历史记录，减少之前动作的影响
      if (action !== this.currentAction) {
        // 保留最近的10条历史记录，清除更早的记录
        if (this.gestureHistory.length > 10) {
          this.gestureHistory = this.gestureHistory.slice(-10)
        }
      }
      
      // 动态动作列表（需要实时响应的动作）
      const DYNAMIC_ACTIONS = ['rotate', 'switch', 'switch_next', 'switch_prev'] // 旋转和切换动作需要实时响应
      
      // 根据动作类型决定如何处理
      if (DYNAMIC_ACTIONS.includes(action)) {
        // 对于动态动作（需要实时响应），直接返回，不需要投票机制
        if (['switch', 'switch_next', 'switch_prev'].includes(action)) {
          // SWIPE动作直接返回，确保立即触发
          this.currentAction = action
          this.actionStartTime = currentTime
          return action
        }
        
        // 对于旋转动作，仍然使用投票机制确保稳定性
        this.gestureHistory.push(action) // 存储动作类型
        
        // 限制历史记录长度（动态动作使用更短的历史记录）
        if (this.gestureHistory.length > 15) { // 动态动作只需要15轮历史，减少触发时间
          this.gestureHistory.shift()
        }
        
        // 计算最常见的动作（动态动作需要较少历史记录和较低的稳定性）
        const stableAction = this.getStableAction(false)
        
        if (stableAction) {
          if (stableAction !== this.currentAction) {
            this.currentAction = stableAction
            this.actionStartTime = currentTime
          }
          // 对于动态动作，只要有稳定动作就返回，确保持续触发
          return stableAction
        }
        
        return null
      } else {
        // 对于静态动作（需要严格验证）
        this.gestureHistory.push(action) // 存储动作类型
        
        // 限制历史记录长度
        if (this.gestureHistory.length > this.MAX_HISTORY_LENGTH) {
          this.gestureHistory.shift()
        }
        
        // 计算最常见的动作（静态动作需要更多历史记录和更高的稳定性）
        const stableAction = this.getStableAction(true)
        
        if (stableAction) {
          if (stableAction !== this.currentAction) {
            this.currentAction = stableAction
            this.actionStartTime = currentTime
            return stableAction
          } else if (currentTime - this.actionStartTime > 3000) {
            // 如果动作已经确认超过3秒，允许再次触发
            this.actionStartTime = currentTime
            return stableAction
          }
        }
        
        return null
      }
    } else {
      // 没有检测到手势时清除历史
      this.gestureHistory = []
    }
    
    // 重置当前动作（仅重置静态动作，动态动作如rotate和switch需要持续触发）
    const DYNAMIC_ACTIONS = ['rotate', 'switch', 'switch_next', 'switch_prev'] // 旋转和切换动作需要实时响应
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
    
    if (stability >= requiredStability && mostFrequentAction !== null) {
      return mostFrequentAction
    }
    
    return null
  }
  
  private mapGestureToAction(gestureId: number): ActionType | null {
    const action = gestureToActionMap[gestureId]
    // 添加SWIPE手势的调试信息，只在开发模式下显示
    if (['switch', 'switch_next', 'switch_prev'].includes(action) && import.meta.env.DEV) {
      console.log(`SWIPE手势识别: 手势ID=${gestureId}, 映射为动作=${action}`)
    }
    return action
  }
  
  reset(): void {
    this.currentAction = null
    this.actionStartTime = 0
    this.gestureHistory = []
  }
}
