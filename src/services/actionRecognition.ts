import type { HandDetection } from '../types/gesture'
import { GESTURE_MAPPINGS, ACTION_RECOGNITION_CONFIG, type ActionType } from '../constants/gestureConstants'

const gestureToActionMap: Record<number, ActionType> = {
  27: 'zoom_in',
  39: 'zoom_in',
  
  24: 'zoom_out',
  
  19: 'rotate',
  30: 'rotate',
  31: 'rotate',
  35: 'rotate',
  36: 'rotate',
  29: 'rotate',
  
  0: 'toggle_thumbbar',
  1: 'toggle_thumbbar',
  2: 'toggle_thumbbar',
  3: 'toggle_thumbbar',
  10: 'toggle_thumbbar',
  11: 'toggle_thumbbar',
  12: 'toggle_thumbbar',
  13: 'toggle_thumbbar',
  15: 'toggle_thumbbar',
  16: 'toggle_thumbbar',
  17: 'toggle_thumbbar',
  18: 'toggle_thumbbar',
}

const validateHandDetection = (detection: HandDetection): boolean => {
  const bbox = detection.bbox;
  const width = bbox.x2 - bbox.x1;
  const height = bbox.y2 - bbox.y1;
  
  const aspectRatio = width / height;
  if (aspectRatio < 0.3 || aspectRatio > 2) {
    return false;
  }
  
  const area = width * height;
  if (area < 1000 || area > 100000) {
    return false;
  }
  
  return true;
}

const STATIC_GESTURES = GESTURE_MAPPINGS.STATIC_GESTURES
const DYNAMIC_GESTURES = GESTURE_MAPPINGS.DYNAMIC_GESTURES

export class ActionRecognitionService {
  private currentAction: ActionType | null = null
  private actionStartTime = 0
  private gestureHistory: ActionType[] = []
  private readonly MAX_HISTORY_LENGTH = ACTION_RECOGNITION_CONFIG.MAX_HISTORY_LENGTH
  private readonly STABILITY_THRESHOLD = ACTION_RECOGNITION_CONFIG.STABILITY_THRESHOLD
  private lastSwipeTime = 0
  private readonly SWIPE_COOLDOWN = 2000
  
  updateDetections(detections: HandDetection[]): ActionType | null {
    const currentTime = Date.now()
    
    const validDetections = detections.filter(detection => validateHandDetection(detection))
    
    if (validDetections.length > 0) {
      const lastDetection = validDetections[validDetections.length - 1]
      const gestureId = lastDetection.gesture
      const action = this.mapGestureToAction(gestureId)
      
      if (!action) {
        return null
      }
      
      if (action === 'toggle_thumbbar') {
        if (currentTime - this.lastSwipeTime < this.SWIPE_COOLDOWN) {
          return null
        }
        
        this.lastSwipeTime = currentTime
        this.currentAction = action
        this.actionStartTime = currentTime
        return action
      }
      
      if (action !== this.currentAction) {
        if (this.gestureHistory.length > 10) {
          this.gestureHistory = this.gestureHistory.slice(-10)
        }
      }
      
      const DYNAMIC_ACTIONS = ['rotate', 'switch', 'switch_next', 'switch_prev']
      
      if (DYNAMIC_ACTIONS.includes(action)) {
        this.gestureHistory.push(action)
        
        if (this.gestureHistory.length > 15) {
          this.gestureHistory.shift()
        }
        
        const stableAction = this.getStableAction(false)
        
        if (stableAction) {
          if (stableAction !== this.currentAction) {
            this.currentAction = stableAction
            this.actionStartTime = currentTime
            return stableAction
          }
          return stableAction
        }
        
        return null
      } else {
        this.gestureHistory.push(action)
        
        if (this.gestureHistory.length > this.MAX_HISTORY_LENGTH) {
          this.gestureHistory.shift()
        }
        
        const stableAction = this.getStableAction(true)
        
        if (stableAction) {
          if (stableAction !== this.currentAction) {
            this.currentAction = stableAction
            this.actionStartTime = currentTime
            return stableAction
          } else if (currentTime - this.actionStartTime > 3000) {
            this.actionStartTime = currentTime
            return stableAction
          }
        }
        
        return null
      }
    } else {
      this.gestureHistory = []
    }
    
    const DYNAMIC_ACTIONS = ['rotate', 'switch', 'switch_next', 'switch_prev', 'toggle_thumbbar']
    if (this.currentAction && !DYNAMIC_ACTIONS.includes(this.currentAction) && currentTime - this.actionStartTime > 3000) {
      this.currentAction = null
    }
    
    return null
  }
  
  private getStableAction(isStatic: boolean): ActionType | null {
    const minHistoryLength = isStatic ? ACTION_RECOGNITION_CONFIG.MIN_HISTORY_LENGTH_STATIC : ACTION_RECOGNITION_CONFIG.MIN_HISTORY_LENGTH_DYNAMIC
    
    if (this.gestureHistory.length < minHistoryLength) {
      return null
    }
    
    const actionCounts: Record<string, number> = {}
    for (const action of this.gestureHistory) {
      actionCounts[action] = (actionCounts[action] || 0) + 1
    }
    
    let maxCount = 0
    let mostFrequentAction: ActionType | null = null
    for (const [action, count] of Object.entries(actionCounts)) {
      if (count > maxCount) {
        maxCount = count
        mostFrequentAction = action as ActionType
      }
    }
    
    const requiredStability = isStatic ? ACTION_RECOGNITION_CONFIG.STABILITY_THRESHOLD_STATIC : ACTION_RECOGNITION_CONFIG.STABILITY_THRESHOLD_DYNAMIC
    const stability = maxCount / this.gestureHistory.length
    
    if (stability >= requiredStability && mostFrequentAction !== null) {
      return mostFrequentAction
    }
    
    return null
  }
  
  private mapGestureToAction(gestureId: number): ActionType | null {
    const action = gestureToActionMap[gestureId]
    if (['switch', 'switch_next', 'switch_prev', 'toggle_thumbbar'].includes(action) && import.meta.env.DEV) {
      console.log(`SWIPE手势识别: 手势ID=${gestureId}, 映射为动作=${action}`)
    }
    return action
  }
  
  reset(): void {
    this.currentAction = null
    this.actionStartTime = 0
    this.gestureHistory = []
    this.lastSwipeTime = 0
  }
}
