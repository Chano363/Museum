// 手势识别相关常量管理

// 动作识别配置
export const ACTION_RECOGNITION_CONFIG = {
  MAX_HISTORY_LENGTH: 30,
  STABILITY_THRESHOLD: 0.5,
  MIN_HISTORY_LENGTH_STATIC: 3,
  MIN_HISTORY_LENGTH_DYNAMIC: 5,
  STABILITY_THRESHOLD_STATIC: 0.5,
  STABILITY_THRESHOLD_DYNAMIC: 0.45
}

// 手势控制配置
export const GESTURE_CONTROL_CONFIG = {
  ACTION_COOLDOWN: 300,
  AUTO_STOP_DELAY: 2000,
  ZOOM_ACTION_RESET_TIME: 1000,
  DEFAULT_ACTION_RESET_TIME: 3000
}

// 后端服务配置
export const BACKEND_CONFIG = {
  CONNECTION_TIMEOUT: 3000,
  MAX_RETRIES: 1,
  MIN_REQUEST_INTERVAL: 33,  // 约30fps，提高手指追踪响应速度
  IMAGE_WIDTH: 320,
  IMAGE_HEIGHT: 240,
  IMAGE_QUALITY: 0.7
}

// 模型控制配置
export const MODEL_CONTROL_CONFIG = {
  ZOOM_STEP: 0.2,
  MIN_CAMERA_DISTANCE: 0.1,
  MAX_CAMERA_DISTANCE: 1,
  DEFAULT_CAMERA_ORBIT: '0deg 75deg 0.5m',
  ROTATION_SENSITIVITY: 0.5
}

// 手势映射
export const GESTURE_MAPPINGS = {
  // 放大操作
  ZOOM_IN: [27, 39],
  // 缩小操作
  ZOOM_OUT: [24],
  // 旋转操作
  ROTATE: [19, 30, 31, 35, 36, 29],
  // 动态手势
  DYNAMIC_GESTURES: [19, 30],
  // 静态手势
  STATIC_GESTURES: [27, 39, 24]
}

// 动作类型
export type ActionType = 'zoom_in' | 'zoom_out' | 'rotate' | 'switch' | 'switch_next' | 'switch_prev' | 'reset' | 'toggle_thumbbar'
