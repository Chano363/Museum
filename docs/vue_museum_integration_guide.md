# Vue + 动态手势识别 - 博物馆展览场景集成指南

## 目录
1. [场景分析](#场景分析)
2. [架构设计](#架构设计)
3. [项目结构](#项目结构)
4. [实现步骤](#实现步骤)
5. [完整代码](#完整代码)
6. [性能优化](#性能优化)
7. [部署指南](#部署指南)
8. [常见问题](#常见问题)

---

## 场景分析

### 博物馆展览场景特点

#### 用户需求
- **交互方式**: 通过手势控制展品信息展示
- **用户群体**: 各年龄段观众，包括儿童和老年人
- **使用环境**: 室内，光照条件相对稳定
- **设备**: 触摸屏或大屏显示器 + 摄像头

#### 性能要求评估

| 指标 | 要求 | 说明 |
|------|------|------|
| **响应延迟** | < 200ms | 手势到响应的时间，确保流畅体验 |
| **识别准确率** | > 90% | 手势识别准确率，避免误触发 |
| **FPS** | 15-30 FPS | 实时处理帧率，平衡性能和流畅度 |
| **并发用户** | 1-2人 | 单个终端同时支持的用户数 |
| **系统稳定性** | 99.9% | 长时间运行不崩溃 |
| **启动时间** | < 3秒 | 从打开页面到可用的时间 |

#### 硬件配置建议

**最低配置**
- CPU: Intel i3 或同等性能
- 内存: 4GB
- 摄像头: 720p, 30fps
- 浏览器: Chrome 90+, Edge 90+, Safari 14+

**推荐配置**
- CPU: Intel i5 或同等性能
- 内存: 8GB
- 摄像头: 1080p, 30fps
- 浏览器: Chrome 100+, Edge 100+

**高性能配置**
- CPU: Intel i7 或同等性能
- 内存: 16GB
- 摄像头: 1080p, 60fps
- GPU: 支持WebGL 2.0

#### 功能需求

1. **手势控制**
   - 左右滑动：切换展品
   - 上下滑动：滚动内容
   - 点击/双击：选择展品
   - 拖动：移动视角
   - 缩放：放大/缩小展品

2. **用户体验**
   - 实时手势反馈
   - 操作提示和引导
   - 错误处理和恢复
   - 无障碍支持

3. **系统管理**
   - 性能监控
   - 日志记录
   - 远程配置
   - 自动更新

---

## 架构设计

### 技术栈

```
前端框架: Vue 3 + TypeScript
UI框架: Element Plus / Ant Design Vue
手势识别: ONNX Runtime Web
状态管理: Pinia
路由: Vue Router
构建工具: Vite
```

### 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     Vue 3 应用                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  展品展示    │  │  手势控制    │  │  系统设置    │  │
│  │  组件        │  │  组件        │  │  组件        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│              手势识别服务层 (Gesture Service)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  手部检测    │  │  手势分类    │  │  动作识别    │  │
│  │  模块        │  │  模块        │  │  模块        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│              ONNX Runtime Web (WASM)                    │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │  手部检测    │  │  手势分类    │                   │
│  │  模型        │  │  模型        │                   │
│  └──────────────┘  └──────────────┘                   │
├─────────────────────────────────────────────────────────┤
│              浏览器 API                                │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │  摄像头      │  │  Canvas      │                   │
│  │  API         │  │  API         │                   │
│  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### 数据流

```
摄像头视频流
    ↓
帧捕获 (requestAnimationFrame)
    ↓
图像预处理 (Canvas → ImageData → Tensor)
    ↓
手部检测 (ONNX Runtime)
    ↓
手部裁剪提取
    ↓
手势分类 (ONNX Runtime)
    ↓
动作识别 (手势序列分析)
    ↓
事件触发 (Vue事件系统)
    ↓
UI更新 (响应式数据)
```

---

## 项目结构

```
museum-gesture-app/
├── public/
│   ├── models/
│   │   ├── hand_detector.onnx          # 手部检测模型
│   │   └── crops_classifier.onnx       # 手势分类模型
│   └── index.html
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── styles/
│   ├── components/
│   │   ├── GestureControl.vue          # 手势控制组件
│   │   ├── ExhibitionDisplay.vue       # 展品展示组件
│   │   ├── CameraView.vue             # 摄像头视图组件
│   │   ├── GestureFeedback.vue        # 手势反馈组件
│   │   └── SystemSettings.vue         # 系统设置组件
│   ├── services/
│   │   ├── gestureRecognition.ts      # 手势识别服务
│   │   ├── handDetection.ts           # 手部检测模块
│   │   ├── gestureClassification.ts    # 手势分类模块
│   │   └── actionRecognition.ts       # 动作识别模块
│   ├── stores/
│   │   ├── gesture.ts                 # 手势状态管理
│   │   ├── exhibition.ts              # 展品状态管理
│   │   └── system.ts                  # 系统状态管理
│   ├── types/
│   │   ├── gesture.ts                 # 手势类型定义
│   │   └── exhibition.ts              # 展品类型定义
│   ├── utils/
│   │   ├── imageProcessing.ts         # 图像处理工具
│   │   ├── performance.ts             # 性能监控工具
│   │   └── logger.ts                 # 日志工具
│   ├── App.vue
│   └── main.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 实现步骤

### 步骤1: 项目初始化

```bash
# 创建Vue 3项目
npm create vue@latest museum-gesture-app
cd museum-gesture-app

# 安装依赖
npm install onnxruntime-web
npm install pinia
npm install element-plus

# 安装TypeScript支持
npm install -D typescript @types/node
```

### 步骤2: 配置Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'onnxruntime': ['onnxruntime-web']
        }
      }
    }
  }
})
```

### 步骤3: 定义类型

```typescript
// src/types/gesture.ts
export interface BoundingBox {
  x1: number
  y1: number
  x2: number
  y2: number
  confidence: number
}

export interface HandDetection {
  bbox: BoundingBox
  gesture: number
  gestureName: string
}

export interface GestureEvent {
  type: string
  timestamp: number
  confidence: number
}

export enum GestureType {
  HAND_DOWN = 0,
  HAND_RIGHT = 1,
  HAND_LEFT = 2,
  THUMB_INDEX = 3,
  THUMB_LEFT = 4,
  THUMB_RIGHT = 5,
  THUMB_DOWN = 6,
  HALF_UP = 7,
  HALF_LEFT = 8,
  HALF_RIGHT = 9,
  HALF_DOWN = 10,
  PART_HAND_HEART = 11,
  PART_HAND_HEART2 = 12,
  FIST_INVERTED = 13,
  TWO_LEFT = 14,
  TWO_RIGHT = 15,
  TWO_DOWN = 16,
  GRABBING = 17,
  GRIP = 18,
  POINT = 19,
  CALL = 20,
  THREE3 = 21,
  LITTLE_FINGER = 22,
  MIDDLE_FINGER = 23,
  DISLIKE = 24,
  FIST = 25,
  FOUR = 26,
  LIKE = 27,
  MUTE = 28,
  OK = 29,
  ONE = 30,
  PALM = 31,
  PEACE = 32,
  PEACE_INVERTED = 33,
  ROCK = 34,
  STOP = 35,
  STOP_INVERTED = 36,
  THREE = 37,
  THREE2 = 38,
  TWO_UP = 39,
  TWO_UP_INVERTED = 40,
  THREE_GUN = 41,
  ONE_LEFT = 42,
  ONE_RIGHT = 43,
  ONE_DOWN = 44
}

export enum ActionType {
  SWIPE_LEFT = 'swipe_left',
  SWIPE_RIGHT = 'swipe_right',
  SWIPE_UP = 'swipe_up',
  SWIPE_DOWN = 'swipe_down',
  TAP = 'tap',
  DOUBLE_TAP = 'double_tap',
  DRAG = 'drag',
  DROP = 'drop',
  ZOOM_IN = 'zoom_in',
  ZOOM_OUT = 'zoom_out',
  FAST_SWIPE_UP = 'fast_swipe_up',
  FAST_SWIPE_DOWN = 'fast_swipe_down'
}

export const GESTURE_NAMES: Record<number, string> = {
  0: 'hand_down',
  1: 'hand_right',
  2: 'hand_left',
  3: 'thumb_index',
  4: 'thumb_left',
  5: 'thumb_right',
  6: 'thumb_down',
  7: 'half_up',
  8: 'half_left',
  9: 'half_right',
  10: 'half_down',
  11: 'part_hand_heart',
  12: 'part_hand_heart2',
  13: 'fist_inverted',
  14: 'two_left',
  15: 'two_right',
  16: 'two_down',
  17: 'grabbing',
  18: 'grip',
  19: 'point',
  20: 'call',
  21: 'three3',
  22: 'little_finger',
  23: 'middle_finger',
  24: 'dislike',
  25: 'fist',
  26: 'four',
  27: 'like',
  28: 'mute',
  29: 'ok',
  30: 'one',
  31: 'palm',
  32: 'peace',
  33: 'peace_inverted',
  34: 'rock',
  35: 'stop',
  36: 'stop_inverted',
  37: 'three',
  38: 'three2',
  39: 'two_up',
  40: 'two_up_inverted',
  41: 'three_gun',
  42: 'one_left',
  43: 'one_right',
  44: 'one_down'
}
```

```typescript
// src/types/exhibition.ts
export interface ExhibitionItem {
  id: string
  title: string
  description: string
  imageUrl: string
  category: string
  year?: string
  artist?: string
}

export interface ExhibitionState {
  currentItem: ExhibitionItem | null
  currentIndex: number
  items: ExhibitionItem[]
  zoomLevel: number
  isDragging: boolean
  dragPosition: { x: number; y: number }
}
```

---

## 完整代码

### 1. 手势识别服务

```typescript
// src/services/gestureRecognition.ts
import * as ort from 'onnxruntime-web'
import type { BoundingBox, HandDetection, GestureEvent } from '@/types/gesture'
import { GESTURE_NAMES } from '@/types/gesture'

export class GestureRecognitionService {
  private detectionSession: ort.InferenceSession | null = null
  private classificationSession: ort.InferenceSession | null = null
  private isInitialized = false
  private isProcessing = false
  
  // 模型配置
  private readonly DETECTOR_SIZE = { width: 320, height: 256 }
  private readonly CLASSIFIER_SIZE = { width: 128, height: 128 }
  private readonly MEAN = [127, 127, 127]
  private readonly STD = [128, 128, 128]
  
  // 性能监控
  private fps = 0
  private frameCount = 0
  private lastFpsUpdate = 0
  
  constructor() {
    ort.env.wasm.numThreads = 4
  }
  
  async initialize(detectorPath: string, classifierPath: string): Promise<void> {
    try {
      console.log('正在初始化手势识别模型...')
      
      // 加载手部检测模型
      this.detectionSession = await ort.InferenceSession.create(detectorPath)
      console.log('手部检测模型加载完成')
      
      // 加载手势分类模型
      this.classificationSession = await ort.InferenceSession.create(classifierPath)
      console.log('手势分类模型加载完成')
      
      this.isInitialized = true
      console.log('手势识别系统初始化完成')
    } catch (error) {
      console.error('模型初始化失败:', error)
      throw error
    }
  }
  
  private preprocessForDetection(imageData: ImageData): ort.Tensor {
    const { width, height, data } = imageData
    const tensorData = new Float32Array(3 * this.DETECTOR_SIZE.height * this.DETECTOR_SIZE.width)
    
    // 创建临时canvas进行缩放
    const canvas = document.createElement('canvas')
    canvas.width = this.DETECTOR_SIZE.width
    canvas.height = this.DETECTOR_SIZE.height
    const ctx = canvas.getContext('2d')!
    
    // 将ImageData绘制到canvas上
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(imageData, 0, 0)
    
    // 缩放图像
    ctx.drawImage(tempCanvas, 0, 0, this.DETECTOR_SIZE.width, this.DETECTOR_SIZE.height)
    const resizedImageData = ctx.getImageData(0, 0, this.DETECTOR_SIZE.width, this.DETECTOR_SIZE.height)
    
    // 归一化处理
    for (let i = 0; i < resizedImageData.data.length; i += 4) {
      const r = resizedImageData.data[i]
      const g = resizedImageData.data[i + 1]
      const b = resizedImageData.data[i + 2]
      
      const pixelIndex = i / 4
      tensorData[pixelIndex] = (r - this.MEAN[0]) / this.STD[0]
      tensorData[pixelIndex + this.DETECTOR_SIZE.width * this.DETECTOR_SIZE.height] = (g - this.MEAN[1]) / this.STD[1]
      tensorData[pixelIndex + 2 * this.DETECTOR_SIZE.width * this.DETECTOR_SIZE.height] = (b - this.MEAN[2]) / this.STD[2]
    }
    
    return new ort.Tensor('float32', tensorData, [1, 3, this.DETECTOR_SIZE.height, this.DETECTOR_SIZE.width])
  }
  
  private preprocessForClassification(imageData: ImageData): ort.Tensor {
    const tensorData = new Float32Array(3 * this.CLASSIFIER_SIZE.height * this.CLASSIFIER_SIZE.width)
    
    // 创建临时canvas进行缩放
    const canvas = document.createElement('canvas')
    canvas.width = this.CLASSIFIER_SIZE.width
    canvas.height = this.CLASSIFIER_SIZE.height
    const ctx = canvas.getContext('2d')!
    
    // 将ImageData绘制到canvas上
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = imageData.width
    tempCanvas.height = imageData.height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(imageData, 0, 0)
    
    // 缩放图像
    ctx.drawImage(tempCanvas, 0, 0, this.CLASSIFIER_SIZE.width, this.CLASSIFIER_SIZE.height)
    const resizedImageData = ctx.getImageData(0, 0, this.CLASSIFIER_SIZE.width, this.CLASSIFIER_SIZE.height)
    
    // 归一化处理
    for (let i = 0; i < resizedImageData.data.length; i += 4) {
      const r = resizedImageData.data[i]
      const g = resizedImageData.data[i + 1]
      const b = resizedImageData.data[i + 2]
      
      const pixelIndex = i / 4
      tensorData[pixelIndex] = (r - this.MEAN[0]) / this.STD[0]
      tensorData[pixelIndex + this.CLASSIFIER_SIZE.width * this.CLASSIFIER_SIZE.height] = (g - this.MEAN[1]) / this.STD[1]
      tensorData[pixelIndex + 2 * this.CLASSIFIER_SIZE.width * this.CLASSIFIER_SIZE.height] = (b - this.MEAN[2]) / this.STD[2]
    }
    
    return new ort.Tensor('float32', tensorData, [1, 3, this.CLASSIFIER_SIZE.height, this.CLASSIFIER_SIZE.width])
  }
  
  private async detectHands(imageData: ImageData, confidenceThreshold = 0.5): Promise<BoundingBox[]> {
    if (!this.detectionSession) {
      throw new Error('检测模型未初始化')
    }
    
    const inputTensor = this.preprocessForDetection(imageData)
    const inputName = this.detectionSession.inputNames[0]
    
    const outputs = await this.detectionSession.run({ [inputName]: inputTensor })
    const outputName = this.detectionSession.outputNames[0]
    const output = outputs[outputName]
    
    const detections = output.data as Float32Array
    const boxes: BoundingBox[] = []
    
    // 解析检测结果
    for (let i = 0; i < detections.length; i += 6) {
      const confidence = detections[i + 4]
      
      if (confidence > confidenceThreshold) {
        const x1 = detections[i] * imageData.width
        const y1 = detections[i + 1] * imageData.height
        const x2 = detections[i + 2] * imageData.width
        const y2 = detections[i + 3] * imageData.height
        
        boxes.push({
          x1: Math.max(0, Math.floor(x1)),
          y1: Math.max(0, Math.floor(y1)),
          x2: Math.min(imageData.width, Math.floor(x2)),
          y2: Math.min(imageData.height, Math.floor(y2)),
          confidence
        })
      }
    }
    
    return boxes
  }
  
  private extractHandCrop(imageData: ImageData, bbox: BoundingBox): ImageData {
    const { x1, y1, x2, y2 } = bbox
    const width = x2 - x1
    const height = y2 - y1
    
    // 计算正方形裁剪区域
    let cropX1 = x1
    let cropY1 = y1
    let cropX2 = x2
    let cropY2 = y2
    
    if (height > width) {
      const diff = (height - width) / 2
      cropX1 = Math.max(0, x1 - diff)
      cropX2 = Math.min(imageData.width, x2 + diff)
    } else if (width > height) {
      const diff = (width - height) / 2
      cropY1 = Math.max(0, y1 - diff)
      cropY2 = Math.min(imageData.height, y2 + diff)
    }
    
    // 提取裁剪区域
    const canvas = document.createElement('canvas')
    canvas.width = cropX2 - cropX1
    canvas.height = cropY2 - cropY1
    const ctx = canvas.getContext('2d')!
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = imageData.width
    tempCanvas.height = imageData.height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(imageData, 0, 0)
    
    ctx.drawImage(
      tempCanvas,
      cropX1, cropY1, cropX2 - cropX1, cropY2 - cropY1,
      0, 0, cropX2 - cropX1, cropY2 - cropY1
    )
    
    return ctx.getImageData(0, 0, cropX2 - cropX1, cropY2 - cropY1)
  }
  
  private async classifyGestures(imageData: ImageData, boxes: BoundingBox[]): Promise<number[]> {
    if (!this.classificationSession) {
      throw new Error('分类模型未初始化')
    }
    
    if (boxes.length === 0) {
      return []
    }
    
    // 提取手部裁剪
    const crops = boxes.map(bbox => this.extractHandCrop(imageData, bbox))
    
    // 预处理所有裁剪
    const processedCrops = crops.map(crop => this.preprocessForClassification(crop))
    
    // 批量推理
    const batchSize = processedCrops.length
    const batchTensorData = new Float32Array(batchSize * 3 * this.CLASSIFIER_SIZE.height * this.CLASSIFIER_SIZE.width)
    
    for (let i = 0; i < processedCrops.length; i++) {
      const cropData = processedCrops[i].data as Float32Array
      batchTensorData.set(cropData, i * cropData.length)
    }
    
    const batchTensor = new ort.Tensor('float32', batchTensorData, [batchSize, 3, this.CLASSIFIER_SIZE.height, this.CLASSIFIER_SIZE.width])
    const inputName = this.classificationSession.inputNames[0]
    
    const outputs = await this.classificationSession.run({ [inputName]: batchTensor })
    const outputName = this.classificationSession.outputNames[0]
    const output = outputs[outputName]
    
    // 获取预测类别
    const predictions = output.data as Float32Array
    const labels: number[] = []
    
    for (let i = 0; i < batchSize; i++) {
      let maxProb = -Infinity
      let maxIndex = 0
      
      for (let j = 0; j < 45; j++) {
        const prob = predictions[i * 45 + j]
        if (prob > maxProb) {
          maxProb = prob
          maxIndex = j
        }
      }
      
      labels.push(maxIndex)
    }
    
    return labels
  }
  
  async processFrame(imageData: ImageData): Promise<HandDetection[]> {
    if (!this.isInitialized || this.isProcessing) {
      return []
    }
    
    this.isProcessing = true
    
    try {
      const startTime = performance.now()
      
      // 手部检测
      const boxes = await this.detectHands(imageData, 0.5)
      
      // 手势分类
      const labels = await this.classifyGestures(imageData, boxes)
      
      // 组合结果
      const detections: HandDetection[] = boxes.map((bbox, index) => ({
        bbox,
        gesture: labels[index] || 0,
        gestureName: GESTURE_NAMES[labels[index]] || 'unknown'
      }))
      
      // 更新FPS
      this.frameCount++
      const currentTime = performance.now()
      if (currentTime - this.lastFpsUpdate >= 1000) {
        this.fps = this.frameCount
        this.frameCount = 0
        this.lastFpsUpdate = currentTime
      }
      
      const processingTime = performance.now() - startTime
      console.log(`处理时间: ${processingTime.toFixed(2)}ms, FPS: ${this.fps}`)
      
      return detections
    } catch (error) {
      console.error('帧处理失败:', error)
      return []
    } finally {
      this.isProcessing = false
    }
  }
  
  getFps(): number {
    return this.fps
  }
  
  isReady(): boolean {
    return this.isInitialized
  }
}
```

### 2. 动作识别服务

```typescript
// src/services/actionRecognition.ts
import type { HandDetection, GestureEvent, ActionType } from '@/types/gesture'
import { ActionType as AT } from '@/types/gesture'

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
  
  reset(): void {
    this.handHistories.clear()
    this.currentAction = null
    this.actionStartTime = 0
  }
}
```

### 3. Vue组件 - 摄像头视图

```vue
<!-- src/components/CameraView.vue -->
<template>
  <div class="camera-view">
    <video
      ref="videoRef"
      autoplay
      playsinline
      muted
      @loadedmetadata="onVideoLoaded"
    ></video>
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
    ></canvas>
    <div v-if="showOverlay" class="overlay">
      <div class="detection-info">
        <div class="info-item">
          <span class="label">FPS:</span>
          <span class="value">{{ fps }}</span>
        </div>
        <div class="info-item">
          <span class="label">检测数:</span>
          <span class="value">{{ detections.length }}</span>
        </div>
      </div>
      <div v-for="(detection, index) in detections" :key="index" class="detection-box" :style="getBoxStyle(detection.bbox)">
        <div class="gesture-label">{{ detection.gestureName }}</div>
      </div>
    </div>
    <div v-if="!isCameraReady" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <p>正在初始化摄像头...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import type { HandDetection } from '@/types/gesture'

interface Props {
  width?: number
  height?: number
  showOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 640,
  height: 480,
  showOverlay: true
})

const emit = defineEmits<{
  frame: [imageData: ImageData]
  detections: [detections: HandDetection[]]
}>()

const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const isCameraReady = ref(false)
const fps = ref(0)
const detections = ref<HandDetection[]>([])

const canvasWidth = computed(() => props.width)
const canvasHeight = computed(() => props.height)

let stream: MediaStream | null = null
let animationFrameId: number | null = null
let frameCount = 0
let lastFpsUpdate = 0

const onVideoLoaded = () => {
  isCameraReady.value = true
  startProcessing()
}

const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: props.width },
        height: { ideal: props.height },
        facingMode: 'user'
      }
    })
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (error) {
    console.error('摄像头启动失败:', error)
    alert('无法访问摄像头，请检查权限设置')
  }
}

const startProcessing = () => {
  const processFrame = () => {
    if (!videoRef.value || !canvasRef.value) return
    
    const ctx = canvasRef.value.getContext('2d')!
    ctx.drawImage(videoRef.value, 0, 0, canvasWidth.value, canvasHeight.value)
    
    const imageData = ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value)
    
    // 发送帧数据
    emit('frame', imageData)
    
    // 更新FPS
    frameCount++
    const currentTime = performance.now()
    if (currentTime - lastFpsUpdate >= 1000) {
      fps.value = frameCount
      frameCount = 0
      lastFpsUpdate = currentTime
    }
    
    animationFrameId = requestAnimationFrame(processFrame)
  }
  
  processFrame()
}

const updateDetections = (newDetections: HandDetection[]) => {
  detections.value = newDetections
  emit('detections', newDetections)
}

const getBoxStyle = (bbox: any) => {
  return {
    left: `${bbox.x1}px`,
    top: `${bbox.y1}px`,
    width: `${bbox.x2 - bbox.x1}px`,
    height: `${bbox.y2 - bbox.y1}px`
  }
}

const stopCamera = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
}

onMounted(() => {
  startCamera()
})

onUnmounted(() => {
  stopCamera()
})

defineExpose({
  updateDetections,
  stopCamera
})
</script>

<style scoped>
.camera-view {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}

video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: none;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.detection-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
}

.info-item {
  margin-bottom: 5px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: bold;
  margin-right: 5px;
}

.value {
  color: #409eff;
}

.detection-box {
  position: absolute;
  border: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
}

.gesture-label {
  position: absolute;
  top: -25px;
  left: 0;
  background: #409eff;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #fff;
}

.loading .el-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.loading p {
  font-size: 16px;
}
</style>
```

### 4. Vue组件 - 手势控制

```vue
<!-- src/components/GestureControl.vue -->
<template>
  <div class="gesture-control">
    <CameraView
      ref="cameraViewRef"
      :width="width"
      :height="height"
      :show-overlay="showOverlay"
      @frame="onFrame"
      @detections="onDetections"
    />
    
    <div v-if="currentAction" class="action-feedback">
      <el-icon><component :is="getActionIcon(currentAction)" /></el-icon>
      <span>{{ getActionText(currentAction) }}</span>
    </div>
    
    <div v-if="showGuide" class="gesture-guide">
      <h3>手势指南</h3>
      <div class="guide-item">
        <span class="gesture-icon">👈</span>
        <span class="gesture-desc">向左滑动：上一个展品</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">👉</span>
        <span class="gesture-desc">向右滑动：下一个展品</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">👆</span>
        <span class="gesture-desc">向上滑动：向上滚动</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">👇</span>
        <span class="gesture-desc">向下滑动：向下滚动</span>
      </div>
      <div class="guide-item">
        <span class="gesture-icon">👆</span>
        <span class="gesture-desc">点击：选择展品</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CameraView from './CameraView.vue'
import { GestureRecognitionService } from '@/services/gestureRecognition'
import { ActionRecognitionService } from '@/services/actionRecognition'
import type { HandDetection, ActionType } from '@/types/gesture'
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Pointer, ZoomIn, ZoomOut } from '@element-plus/icons-vue'

interface Props {
  width?: number
  height?: number
  showOverlay?: boolean
  showGuide?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 640,
  height: 480,
  showOverlay: true,
  showGuide: true
})

const emit = defineEmits<{
  action: [action: ActionType]
  gesture: [detection: HandDetection]
}>()

const cameraViewRef = ref<InstanceType<typeof CameraView>>()
const gestureService = new GestureRecognitionService()
const actionService = new ActionRecognitionService()

const currentAction = ref<ActionType | null>(null)
let isInitialized = false

const onFrame = async (imageData: ImageData) => {
  if (!isInitialized) return
  
  try {
    const detections = await gestureService.processFrame(imageData)
    cameraViewRef.value?.updateDetections(detections)
    
    // 更新动作识别
    const action = actionService.updateDetections(detections)
    
    if (action && action !== currentAction.value) {
      currentAction.value = action
      emit('action', action)
      
      // 3秒后清除动作反馈
      setTimeout(() => {
        if (currentAction.value === action) {
          currentAction.value = null
        }
      }, 3000)
    }
    
    // 发送手势事件
    if (detections.length > 0) {
      emit('gesture', detections[0])
    }
  } catch (error) {
    console.error('手势处理失败:', error)
  }
}

const onDetections = (detections: HandDetection[]) => {
  console.log('检测到手势:', detections)
}

const getActionIcon = (action: ActionType) => {
  const iconMap: Record<ActionType, any> = {
    swipe_left: ArrowLeft,
    swipe_right: ArrowRight,
    swipe_up: ArrowUp,
    swipe_down: ArrowDown,
    tap: Pointer,
    double_tap: Pointer,
    drag: Pointer,
    drop: Pointer,
    zoom_in: ZoomIn,
    zoom_out: ZoomOut,
    fast_swipe_up: ArrowUp,
    fast_swipe_down: ArrowDown
  }
  
  return iconMap[action] || Pointer
}

const getActionText = (action: ActionType) => {
  const textMap: Record<ActionType, string> = {
    swipe_left: '向左滑动',
    swipe_right: '向右滑动',
    swipe_up: '向上滑动',
    swipe_down: '向下滑动',
    tap: '点击',
    double_tap: '双击',
    drag: '拖动',
    drop: '释放',
    zoom_in: '放大',
    zoom_out: '缩小',
    fast_swipe_up: '快速向上',
    fast_swipe_down: '快速向下'
  }
  
  return textMap[action] || '未知动作'
}

const initialize = async () => {
  try {
    await gestureService.initialize(
      '/models/hand_detector.onnx',
      '/models/crops_classifier.onnx'
    )
    isInitialized = true
    console.log('手势识别系统初始化成功')
  } catch (error) {
    console.error('手势识别系统初始化失败:', error)
    alert('手势识别系统初始化失败，请刷新页面重试')
  }
}

onMounted(() => {
  initialize()
})

onUnmounted(() => {
  cameraViewRef.value?.stopCamera()
})
</script>

<style scoped>
.gesture-control {
  position: relative;
  width: 100%;
  height: 100%;
}

.action-feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(64, 158, 255, 0.9);
  color: #fff;
  padding: 20px 40px;
  border-radius: 8px;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: fadeIn 0.3s ease;
}

.action-feedback .el-icon {
  font-size: 32px;
}

.gesture-guide {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 15px;
  border-radius: 8px;
  max-width: 300px;
}

.gesture-guide h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #409eff;
}

.guide-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.guide-item:last-child {
  margin-bottom: 0;
}

.gesture-icon {
  font-size: 20px;
  margin-right: 10px;
  width: 30px;
  text-align: center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
```

### 5. Vue组件 - 展品展示

```vue
<!-- src/components/ExhibitionDisplay.vue -->
<template>
  <div class="exhibition-display">
    <div class="exhibition-container" :style="containerStyle">
      <div class="exhibition-item" v-if="currentItem">
        <div class="item-image">
          <img :src="currentItem.imageUrl" :alt="currentItem.title" />
        </div>
        <div class="item-info">
          <h2 class="item-title">{{ currentItem.title }}</h2>
          <div class="item-meta">
            <span v-if="currentItem.artist" class="meta-item">
              <el-icon><User /></el-icon>
              {{ currentItem.artist }}
            </span>
            <span v-if="currentItem.year" class="meta-item">
              <el-icon><Calendar /></el-icon>
              {{ currentItem.year }}
            </span>
          </div>
          <p class="item-description">{{ currentItem.description }}</p>
        </div>
      </div>
      
      <div v-else class="no-item">
        <el-empty description="暂无展品" />
      </div>
    </div>
    
    <div class="navigation">
      <el-button
        type="primary"
        :icon="ArrowLeft"
        :disabled="currentIndex === 0"
        @click="previousItem"
      >
        上一个
      </el-button>
      
      <div class="pagination">
        <span>{{ currentIndex + 1 }}</span>
        <span>/</span>
        <span>{{ items.length }}</span>
      </div>
      
      <el-button
        type="primary"
        :icon="ArrowRight"
        :disabled="currentIndex === items.length - 1"
        @click="nextItem"
      >
        下一个
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, ArrowRight, User, Calendar } from '@element-plus/icons-vue'
import type { ExhibitionItem } from '@/types/exhibition'

interface Props {
  items: ExhibitionItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [item: ExhibitionItem]
}>()

const currentIndex = ref(0)
const zoomLevel = ref(1)
const dragPosition = ref({ x: 0, y: 0 })

const currentItem = computed(() => props.items[currentIndex.value])

const containerStyle = computed(() => ({
  transform: `scale(${zoomLevel.value}) translate(${dragPosition.value.x}px, ${dragPosition.value.y}px)`,
  transition: 'transform 0.3s ease'
}))

const previousItem = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    resetView()
    emit('select', currentItem.value)
  }
}

const nextItem = () => {
  if (currentIndex.value < props.items.length - 1) {
    currentIndex.value++
    resetView()
    emit('select', currentItem.value)
  }
}

const resetView = () => {
  zoomLevel.value = 1
  dragPosition.value = { x: 0, y: 0 }
}

const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value += 0.2
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value -= 0.2
  }
}

const handleSwipeLeft = () => {
  previousItem()
}

const handleSwipeRight = () => {
  nextItem()
}

const handleSwipeUp = () => {
  // 向上滚动内容
  const infoElement = document.querySelector('.item-info')
  if (infoElement) {
    infoElement.scrollTop -= 200
  }
}

const handleSwipeDown = () => {
  // 向下滚动内容
  const infoElement = document.querySelector('.item-info')
  if (infoElement) {
    infoElement.scrollTop += 200
  }
}

const handleTap = () => {
  // 选择当前展品
  emit('select', currentItem.value)
}

defineExpose({
  previousItem,
  nextItem,
  zoomIn,
  zoomOut,
  handleSwipeLeft,
  handleSwipeRight,
  handleSwipeUp,
  handleSwipeDown,
  handleTap
})
</script>

<style scoped>
.exhibition-display {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.exhibition-container {
  flex: 1;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background: #fff;
}

.exhibition-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.item-image {
  flex: 1;
  overflow: hidden;
  background: #f5f5f5;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.item-info {
  padding: 20px;
  background: #fff;
  max-height: 40%;
  overflow-y: auto;
}

.item-title {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #303133;
}

.item-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
  font-size: 14px;
}

.item-description {
  margin: 0;
  line-height: 1.8;
  color: #606266;
}

.no-item {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 16px;
  color: #606266;
}
</style>
```

### 6. 主应用组件

```vue
<!-- src/App.vue -->
<template>
  <div class="app">
    <el-container>
      <el-header>
        <h1>博物馆手势交互系统</h1>
      </el-header>
      
      <el-main>
        <el-row :gutter="20">
          <el-col :span="16">
            <ExhibitionDisplay
              ref="exhibitionDisplayRef"
              :items="exhibitionItems"
              @select="onExhibitionSelect"
            />
          </el-col>
          
          <el-col :span="8">
            <GestureControl
              ref="gestureControlRef"
              :width="640"
              :height="480"
              :show-overlay="true"
              :show-guide="true"
              @action="onGestureAction"
              @gesture="onGestureDetected"
            />
          </el-col>
        </el-row>
      </el-main>
      
      <el-footer>
        <div class="status-bar">
          <span class="status-item">
            <el-icon><Monitor /></el-icon>
            系统状态: {{ systemStatus }}
          </span>
          <span class="status-item">
            <el-icon><Timer /></el-icon>
            FPS: {{ fps }}
          </span>
          <span class="status-item">
            <el-icon><User /></el-icon>
            当前手势: {{ currentGesture }}
          </span>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Monitor, Timer, User } from '@element-plus/icons-vue'
import ExhibitionDisplay from './components/ExhibitionDisplay.vue'
import GestureControl from './components/GestureControl.vue'
import type { ExhibitionItem } from '@/types/exhibition'
import type { HandDetection, ActionType } from '@/types/gesture'

const exhibitionDisplayRef = ref<InstanceType<typeof ExhibitionDisplay>>()
const gestureControlRef = ref<InstanceType<typeof GestureControl>>()

const systemStatus = ref('运行中')
const fps = ref(0)
const currentGesture = ref('无')

const exhibitionItems: ExhibitionItem[] = [
  {
    id: '1',
    title: '古代青铜器',
    description: '这是一件精美的古代青铜器，制作于商周时期，展现了当时高超的铸造工艺。青铜器在中国古代具有重要的礼仪和实用功能，是中华文明的重要象征。',
    imageUrl: '/images/bronze.jpg',
    category: '青铜器',
    year: '公元前1600-前256年',
    artist: '商周工匠'
  },
  {
    id: '2',
    title: '明代瓷器',
    description: '这件明代瓷器以其精美的釉色和优雅的造型著称，代表了明代瓷器制作的高超水平。明代瓷器在中国陶瓷史上占有重要地位。',
    imageUrl: '/images/porcelain.jpg',
    category: '瓷器',
    year: '1368-1644年',
    artist: '景德镇窑工'
  },
  {
    id: '3',
    title: '宋代书画',
    description: '这幅宋代书画作品笔法精湛，意境深远，体现了宋代文人的审美情趣。宋代书画在中国艺术史上具有重要地位。',
    imageUrl: '/images/painting.jpg',
    category: '书画',
    year: '960-1279年',
    artist: '宋代画家'
  }
]

const onGestureAction = (action: ActionType) => {
  console.log('检测到动作:', action)
  
  switch (action) {
    case 'swipe_left':
      exhibitionDisplayRef.value?.handleSwipeLeft()
      break
    case 'swipe_right':
      exhibitionDisplayRef.value?.handleSwipeRight()
      break
    case 'swipe_up':
      exhibitionDisplayRef.value?.handleSwipeUp()
      break
    case 'swipe_down':
      exhibitionDisplayRef.value?.handleSwipeDown()
      break
    case 'tap':
      exhibitionDisplayRef.value?.handleTap()
      break
    case 'zoom_in':
      exhibitionDisplayRef.value?.zoomIn()
      break
    case 'zoom_out':
      exhibitionDisplayRef.value?.zoomOut()
      break
    default:
      console.log('未处理的动作:', action)
  }
}

const onGestureDetected = (detection: HandDetection) => {
  currentGesture.value = detection.gestureName
}

const onExhibitionSelect = (item: ExhibitionItem) => {
  console.log('选择展品:', item.title)
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
}

.el-header {
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.el-header h1 {
  font-size: 24px;
  font-weight: bold;
}

.el-main {
  padding: 20px;
}

.el-footer {
  background: #fff;
  border-top: 1px solid #e4e7ed;
  padding: 10px 20px;
}

.status-bar {
  display: flex;
  gap: 30px;
  justify-content: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
  font-size: 14px;
}
</style>
```

### 7. 主入口文件

```typescript
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(ElementPlus)

app.mount('#app')
```

---

## 性能优化

### 1. 模型优化

#### 使用量化模型
```typescript
// 使用INT8量化模型可以减少50%的内存占用和提高推理速度
const quantizedModelPath = '/models/hand_detector_quantized.onnx'
```

#### 模型剪枝
```typescript
// 使用剪枝后的模型，减少参数数量
const prunedModelPath = '/models/crops_classifier_pruned.onnx'
```

### 2. 推理优化

#### 批处理
```typescript
// 同时处理多个手部
async function batchClassify(crops: ImageData[]): Promise<number[]> {
  const batchSize = crops.length
  const batchTensor = createBatchTensor(crops)
  const results = await classificationSession.run({ input: batchTensor })
  return parseResults(results)
}
```

#### 异步处理
```typescript
// 使用Web Worker进行异步推理
const worker = new Worker('/workers/gesture-worker.js')
worker.postMessage({ imageData })
worker.onmessage = (event) => {
  const detections = event.data
  updateUI(detections)
}
```

### 3. 渲染优化

#### 节流处理
```typescript
// 限制帧率，减少不必要的处理
let lastProcessTime = 0
const TARGET_FPS = 15
const FRAME_INTERVAL = 1000 / TARGET_FPS

function processFrame(imageData: ImageData) {
  const currentTime = performance.now()
  if (currentTime - lastProcessTime < FRAME_INTERVAL) {
    return
  }
  lastProcessTime = currentTime
  
  // 处理帧
  gestureService.processFrame(imageData)
}
```

#### 虚拟滚动
```vue
<!-- 使用虚拟滚动优化长列表 -->
<el-table-v2
  :columns="columns"
  :data="items"
  :width="700"
  :height="400"
  fixed
/>
```

### 4. 内存优化

#### 对象池
```typescript
// 重用对象，减少GC压力
class ObjectPool<T> {
  private pool: T[] = []
  
  acquire(): T {
    return this.pool.pop() || this.create()
  }
  
  release(obj: T): void {
    this.pool.push(obj)
  }
  
  protected abstract create(): T
}
```

#### 内存监控
```typescript
// 监控内存使用
function checkMemoryUsage() {
  if (performance.memory) {
    const used = performance.memory.usedJSHeapSize / 1024 / 1024
    const total = performance.memory.totalJSHeapSize / 1024 / 1024
    
    console.log(`内存使用: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB`)
    
    if (used > total * 0.9) {
      console.warn('内存使用过高，建议优化')
    }
  }
}
```

### 5. 网络优化

#### CDN加速
```typescript
// 使用CDN加载模型文件
const MODEL_BASE_URL = 'https://cdn.example.com/models'
const detectorPath = `${MODEL_BASE_URL}/hand_detector.onnx`
const classifierPath = `${MODEL_BASE_URL}/crops_classifier.onnx`
```

#### 懒加载
```typescript
// 按需加载模型
async function loadModelOnDemand() {
  if (!detectionSession) {
    detectionSession = await ort.InferenceSession.create(detectorPath)
  }
  return detectionSession
}
```

---

## 部署指南

### 1. 构建项目

```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 生产环境构建
npm run build

# 预览生产构建
npm run preview
```

### 2. 部署到静态服务器

#### Nginx配置
```nginx
server {
    listen 80;
    server_name museum.example.com;
    
    root /var/www/museum-gesture-app/dist;
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 缓存模型文件
    location /models/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

### 3. 部署到云服务

#### Vercel部署
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel
```

#### Netlify部署
```bash
# 安装Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

### 4. Docker部署

```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# 构建Docker镜像
docker build -t museum-gesture-app .

# 运行容器
docker run -p 80:80 museum-gesture-app
```

### 5. 监控和日志

#### 性能监控
```typescript
// 集成性能监控
import { setupPerformanceMonitoring } from '@/utils/performance'

setupPerformanceMonitoring({
  reportUrl: '/api/performance',
  sampleRate: 0.1
})
```

#### 错误日志
```typescript
// 集成错误日志
import { setupErrorLogging } from '@/utils/logger'

setupErrorLogging({
  reportUrl: '/api/errors',
  environment: 'production'
})
```

---

## 常见问题

### 1. 摄像头无法启动

**问题**: 提示"无法访问摄像头"

**解决方案**:
```typescript
// 检查摄像头权限
async function checkCameraPermission() {
  try {
    const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
    console.log('摄像头权限:', permission.state)
    
    if (permission.state === 'denied') {
      alert('请在浏览器设置中允许摄像头访问权限')
    }
  } catch (error) {
    console.error('权限检查失败:', error)
  }
}
```

### 2. 模型加载失败

**问题**: 提示"模型初始化失败"

**解决方案**:
```typescript
// 检查模型文件路径
async function validateModelPaths() {
  const detectorPath = '/models/hand_detector.onnx'
  const classifierPath = '/models/crops_classifier.onnx'
  
  try {
    const detectorResponse = await fetch(detectorPath, { method: 'HEAD' })
    const classifierResponse = await fetch(classifierPath, { method: 'HEAD' })
    
    if (!detectorResponse.ok) {
      throw new Error(`检测模型文件不存在: ${detectorPath}`)
    }
    
    if (!classifierResponse.ok) {
      throw new Error(`分类模型文件不存在: ${classifierPath}`)
    }
    
    console.log('模型文件验证成功')
  } catch (error) {
    console.error('模型文件验证失败:', error)
    throw error
  }
}
```

### 3. 性能问题

**问题**: FPS过低，响应延迟大

**解决方案**:
```typescript
// 降低处理分辨率
const LOW_RES_WIDTH = 320
const LOW_RES_HEIGHT = 240

// 降低帧率
const TARGET_FPS = 15

// 使用量化模型
const QUANTIZED_MODEL = true
```

### 4. 手势识别不准确

**问题**: 手势识别错误率高

**解决方案**:
```typescript
// 调整置信度阈值
const CONFIDENCE_THRESHOLD = 0.6

// 增加最小帧数
const MIN_FRAMES_FOR_ACTION = 20

// 添加手势平滑
function smoothGestures(detections: HandDetection[]): HandDetection[] {
  // 实现手势平滑算法
}
```

---

## 总结

本文档提供了完整的Vue + 动态手势识别在博物馆展览场景中的集成方案，包括：

1. **场景分析**: 详细分析了博物馆展览场景的性能需求和用户需求
2. **架构设计**: 提供了清晰的技术架构和数据流设计
3. **完整代码**: 实现了所有必要的Vue组件和服务
4. **性能优化**: 提供了多种性能优化策略
5. **部署指南**: 详细说明了各种部署方式

通过本方案，你可以在博物馆展览场景中实现流畅、准确的手势交互体验。
