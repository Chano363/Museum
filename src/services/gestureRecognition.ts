import * as ort from 'onnxruntime-web'
import type { BoundingBox, HandDetection, GestureEvent } from '../types/gesture'
import { GESTURE_NAMES } from '../types/gesture'

export class GestureRecognitionService {
  private detectionSession: ort.InferenceSession | null = null
  private classificationSession: ort.InferenceSession | null = null
  private isInitialized = false
  private isProcessing = false
  
  // 模型配置
  private readonly DETECTOR_SIZE = { width: 320, height: 240 }
  private readonly CLASSIFIER_SIZE = { width: 128, height: 128 }
  private readonly MEAN = [127, 127, 127]
  private readonly STD = [128, 128, 128]
  
  // 性能监控
  private fps = 0
  private frameCount = 0
  private lastFpsUpdate = 0
  
  constructor() {
    // 完全禁用WASM，确保不加载任何WASM文件
    ort.env.wasm.enabled = false
    ort.env.wasm.wasmPaths = {}
    ort.env.wasm.simd = false
    ort.env.wasm.proxy = false
  }
  
  async initialize(detectorPath: string, classifierPath: string): Promise<void> {
    try {
      console.log('正在初始化手势识别模型...')
      
      // 验证模型路径
      if (!detectorPath || !classifierPath) {
        throw new Error('模型路径不能为空')
      }
      
      // 直接使用CPU执行，避免WASM初始化失败的问题
      console.log('使用CPU模式加载模型...')
      
      // 加载手部检测模型
      this.detectionSession = await ort.InferenceSession.create(detectorPath, {
        executionProviders: ['cpu']
      })
      console.log('手部检测模型（CPU模式）加载完成')
      
      // 加载手势分类模型
      this.classificationSession = await ort.InferenceSession.create(classifierPath, {
        executionProviders: ['cpu']
      })
      console.log('手势分类模型（CPU模式）加载完成')
      
      this.isInitialized = true
      console.log('手势识别系统初始化完成')
    } catch (error) {
      console.error('模型初始化失败:', error)
      // 提供更友好的错误信息
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      throw new Error(`手势识别模型初始化失败: ${errorMessage}。请检查模型文件是否存在且路径正确。`)
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
    
    // 动态获取类别数量
    const numClasses = output.dims[output.dims.length - 1]
    
    for (let i = 0; i < batchSize; i++) {
      let maxProb = -Infinity
      let maxIndex = 0
      
      for (let j = 0; j < numClasses; j++) {
        const prob = predictions[i * numClasses + j]
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