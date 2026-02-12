import { io, Socket } from 'socket.io-client'
import type { HandDetection } from '../types/gesture'
import { BACKEND_CONFIG } from '../constants/gestureConstants'

export interface ProcessFrameResult {
  detections: HandDetection[]
  fingerPosition: { x: number; y: number; z: number } | null
  landmarks: Array<{ x: number; y: number; z: number }>
}

export class BackendGestureRecognitionService {
  private isInitialized = false
  private useWebSocket = false
  private socket: Socket | null = null
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private pendingResolve: ((result: ProcessFrameResult) => void) | null = null
  private lastRequestTime = 0
  private readonly MIN_REQUEST_INTERVAL = BACKEND_CONFIG.MIN_REQUEST_INTERVAL
  private frameCount = 0
  
  async initialize(): Promise<void> {
    try {
      console.log('[手势服务] 正在初始化...')
      
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
      
      if (!this.ctx) {
        throw new Error('无法创建画布上下文')
      }
      
      console.log('[手势服务] 尝试WebSocket连接...')
      
      this.initSocket()
      
      await this.waitForConnection()
      
      this.useWebSocket = true
      this.isInitialized = true
      console.log('[手势服务] 初始化完成，模式: WebSocket')
    } catch (error) {
      console.error('[手势服务] 初始化失败:', error)
      this.isInitialized = true
      this.useWebSocket = false
      console.log('[手势服务] 初始化完成，模式: HTTP (WebSocket失败)')
    }
  }
  
  private initSocket(): void {
    this.socket = io('http://localhost:5000', {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    })
    
    this.socket.on('connect', () => {
      console.log('[手势服务] WebSocket已连接, id:', this.socket?.id)
    })
    
    this.socket.on('connect_error', (error) => {
      console.error('[手势服务] WebSocket连接错误:', error.message)
    })
    
    this.socket.on('result', (result: ProcessFrameResult) => {
      console.log('[手势服务] 收到结果:', result.detections?.length || 0, '个检测, 手势:', result.detections?.map(d => d.gestureName).join(','))
      if (this.pendingResolve) {
        this.pendingResolve(result)
        this.pendingResolve = null
      } else {
        console.warn('[手势服务] 收到结果但没有pendingResolve')
      }
    })
    
    this.socket.on('disconnect', (reason) => {
      console.log('[手势服务] WebSocket断开:', reason)
    })
    
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[手势服务] WebSocket重连成功, 尝试次数:', attemptNumber)
    })
    
    this.socket.on('reconnect_error', (error) => {
      console.error('[手势服务] WebSocket重连错误:', error.message)
    })
    
    this.socket.on('reconnect_failed', () => {
      console.error('[手势服务] WebSocket重连失败')
    })
    
    this.socket.onAny((event, ...args) => {
      console.log('[手势服务] 收到事件:', event, args.length > 0 ? '有数据' : '无数据')
    })
  }
  
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }
      
      const onConnect = () => {
        cleanup()
        resolve()
      }
      
      const onError = (error: Error) => {
        cleanup()
        reject(error)
      }
      
      const cleanup = () => {
        this.socket?.off('connect', onConnect)
        this.socket?.off('connect_error', onError)
        clearTimeout(timeout)
      }
      
      this.socket?.on('connect', onConnect)
      this.socket?.on('connect_error', onError)
      
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error('WebSocket连接超时'))
      }, 10000)
    })
  }
  
  private prepareImage(imageData: ImageData): string {
    if (!this.canvas || !this.ctx) {
      return ''
    }
    
    const targetWidth = BACKEND_CONFIG.IMAGE_WIDTH
    const targetHeight = BACKEND_CONFIG.IMAGE_HEIGHT
    this.canvas.width = targetWidth
    this.canvas.height = targetHeight
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = imageData.width
    tempCanvas.height = imageData.height
    const tempCtx = tempCanvas.getContext('2d')
    
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0)
      this.ctx.clearRect(0, 0, targetWidth, targetHeight)
      this.ctx.drawImage(
        tempCanvas, 
        0, 0, imageData.width, imageData.height, 
        0, 0, targetWidth, targetHeight
      )
    }
    
    return this.canvas.toDataURL('image/jpeg', BACKEND_CONFIG.IMAGE_QUALITY)
  }
  
  async processFrame(imageData: ImageData): Promise<ProcessFrameResult> {
    const defaultResult: ProcessFrameResult = {
      detections: [],
      fingerPosition: null,
      landmarks: []
    }
    
    if (!this.isInitialized) {
      console.warn('[手势服务] 服务未初始化')
      return defaultResult
    }
    
    const currentTime = Date.now()
    if (currentTime - this.lastRequestTime < this.MIN_REQUEST_INTERVAL) {
      return defaultResult
    }
    this.lastRequestTime = currentTime
    
    const base64Image = this.prepareImage(imageData)
    if (!base64Image) {
      return defaultResult
    }
    
    this.frameCount++
    
    if (this.useWebSocket && this.socket?.connected) {
      return this.processFrameWebSocket(base64Image)
    } else {
      return this.processFrameHTTP(base64Image)
    }
  }
  
  private processFrameWebSocket(base64Image: string): Promise<ProcessFrameResult> {
    const defaultResult: ProcessFrameResult = {
      detections: [],
      fingerPosition: null,
      landmarks: []
    }
    
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        console.warn('[手势服务] WebSocket未连接')
        resolve(defaultResult)
        return
      }
      
      if (this.pendingResolve) {
        console.warn('[手势服务] 上一个请求未完成，跳过')
        resolve(defaultResult)
        return
      }
      
      this.pendingResolve = resolve
      
      console.log('[手势服务] 发送帧 #' + this.frameCount + ', socket id:', this.socket.id)
      this.socket.emit('frame', { image: base64Image })
      
      setTimeout(() => {
        if (this.pendingResolve === resolve) {
          console.warn('[手势服务] WebSocket响应超时')
          this.pendingResolve = null
          resolve(defaultResult)
        }
      }, BACKEND_CONFIG.CONNECTION_TIMEOUT)
    })
  }
  
  private async processFrameHTTP(base64Image: string): Promise<ProcessFrameResult> {
    const defaultResult: ProcessFrameResult = {
      detections: [],
      fingerPosition: null,
      landmarks: []
    }
    
    try {
      console.log('[手势服务] HTTP发送帧 #' + this.frameCount)
      const response = await fetch('http://localhost:5000/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      })
      
      if (!response.ok) {
        console.error('[手势服务] HTTP错误:', response.status)
        return defaultResult
      }
      
      const data = await response.json()
      console.log('[手势服务] HTTP结果:', data.detections?.length || 0, '个检测')
      
      return {
        detections: data.detections || [],
        fingerPosition: data.fingerPosition || null,
        landmarks: data.landmarks || []
      }
    } catch (error) {
      console.error('[手势服务] HTTP请求失败:', error)
      return defaultResult
    }
  }
  
  isReady(): boolean {
    return this.isInitialized
  }
  
  async dispose(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.canvas = null
    this.ctx = null
    this.isInitialized = false
    console.log('[手势服务] 已释放')
  }
}
