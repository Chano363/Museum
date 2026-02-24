import { io, Socket } from 'socket.io-client'
import type { HandDetection } from '../types/gesture'
import { BACKEND_CONFIG } from '../constants/gestureConstants'
import { API_BASE_URL, WS_BASE_URL } from '../config/api'

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
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
      
      if (!this.ctx) {
        throw new Error('无法创建画布上下文')
      }
      
      this.initSocket()
      
      await this.waitForConnection()
      
      this.useWebSocket = true
      this.isInitialized = true
    } catch (error) {
      console.error('[手势服务] 初始化失败:', error)
      this.isInitialized = true
      this.useWebSocket = false
    }
  }
  
  private initSocket(): void {
    this.socket = io(WS_BASE_URL, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    })
    
    this.socket.on('connect', () => {
    })
    
    this.socket.on('connect_error', (error) => {
      console.error('[手势服务] WebSocket连接错误:', error.message)
    })
    
    this.socket.on('result', (result: ProcessFrameResult) => {
      if (this.pendingResolve) {
        this.pendingResolve(result)
        this.pendingResolve = null
      }
    })
    
    this.socket.on('disconnect', (reason) => {
    })
    
    this.socket.on('reconnect', (attemptNumber) => {
    })
    
    this.socket.on('reconnect_error', (error) => {
      console.error('[手势服务] WebSocket重连错误:', error.message)
    })
    
    this.socket.on('reconnect_failed', () => {
      console.error('[手势服务] WebSocket重连失败')
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
        resolve(defaultResult)
        return
      }
      
      if (this.pendingResolve) {
        resolve(defaultResult)
        return
      }
      
      this.pendingResolve = resolve
      
      this.socket.emit('frame', { image: base64Image })
      
      setTimeout(() => {
        if (this.pendingResolve === resolve) {
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
      const response = await fetch(`${API_BASE_URL}/api/recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      })
      
      if (!response.ok) {
        return defaultResult
      }
      
      const data = await response.json()
      
      return {
        detections: data.detections || [],
        fingerPosition: data.fingerPosition || null,
        landmarks: data.landmarks || []
      }
    } catch (error) {
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
  }
}
