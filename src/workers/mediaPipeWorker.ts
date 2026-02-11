import { Hands } from '@mediapipe/hands';

interface FingerPosition {
  x: number;
  y: number;
  z?: number;
}

interface HandLandmarks {
  landmarks: FingerPosition[];
  handInViewConfidence: number;
}

interface WorkerMessage {
  type: string;
  data?: any;
}

interface ProcessFrameMessage {
  type: 'processFrame';
  data: ImageData;
}

interface InitializeMessage {
  type: 'initialize';
}

interface ClearHistoryMessage {
  type: 'clearHistory';
}

interface DisposeMessage {
  type: 'dispose';
}

class MediaPipeWorker {
  private hands: Hands | null = null;
  private isInitialized = false;
  private isProcessing = false;
  
  // 平滑处理相关
  private positionHistory: FingerPosition[] = [];
  private readonly MAX_HISTORY = 15;
  private readonly SMOOTHING_FACTOR = 0.98;
  private readonly LANDMARK_SMOOTHING_FACTOR = 0.95;
  
  // 存储历史关键点数据
  private landmarksHistory: FingerPosition[][] = [];
  private readonly MAX_LANDMARKS_HISTORY = 12;
  
  // 最新的手部关键点
  private latestLandmarks: HandLandmarks | null = null;
  
  // 重用 canvas 元素，避免频繁创建
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  constructor() {
    self.onmessage = this.handleMessage.bind(this);
  }
  
  private handleMessage(event: MessageEvent<WorkerMessage>) {
    const message = event.data;
    
    switch (message.type) {
      case 'initialize':
        this.initialize();
        break;
      case 'processFrame':
        this.processFrame(message.data as ImageData);
        break;
      case 'clearHistory':
        this.clearHistory();
        break;
      case 'dispose':
        this.dispose();
        break;
    }
  }
  
  private async initialize() {
    if (this.isInitialized) {
      this.postMessage('initialized');
      return;
    }
    
    try {
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });
      
      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      this.hands.onResults(this.onResults.bind(this));
      
      this.isInitialized = true;
      this.postMessage('initialized');
    } catch (error) {
      console.error('MediaPipe Hands服务初始化失败:', error);
      this.postMessage({ error: error.message });
    }
  }
  
  private async processFrame(imageData: any) {
    if (!this.isInitialized || this.isProcessing) {
      this.postMessage(null);
      return;
    }
    
    this.isProcessing = true;
    
    try {
      if (!this.hands) {
        this.postMessage(null);
        return;
      }
      
      // 检查图像数据
      if (!imageData || !imageData.data) {
        this.postMessage(null);
        return;
      }
      
      // 重用 canvas 元素，避免频繁创建
      if (!this.canvas) {
        this.canvas = new OffscreenCanvas(640, 480);
        this.ctx = this.canvas.getContext('2d');
      }
      
      if (!this.ctx) {
        this.postMessage(null);
        return;
      }
      
      // 确保画布尺寸与 MediaPipe 兼容
      this.canvas.width = 640;
      this.canvas.height = 480;
      
      // 绘制图像数据
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // 处理序列化的 ImageData
      if (Array.isArray(imageData.data)) {
        // 从序列化数据创建 ImageData
        const newImageData = this.ctx.createImageData(imageData.width, imageData.height);
        newImageData.data.set(new Uint8ClampedArray(imageData.data));
        this.ctx.putImageData(newImageData, 0, 0);
      } else {
        // 直接使用 ImageData
        this.ctx.putImageData(imageData, 0, 0);
      }
      
      try {
        // 发送图像数据到 MediaPipe
        await this.hands.send({ image: this.canvas });
      } catch (error) {
        console.error('MediaPipeHandTrackingService.processFrame: 发送图像数据失败:', error);
        // 尝试重新初始化 MediaPipe
        try {
          await this.initialize();
        } catch (reinitError) {
          console.error('MediaPipeHandTrackingService.processFrame: 重新初始化失败:', reinitError);
        }
        this.postMessage(null);
        return;
      }
      
      // 减少等待时间，提高实时性
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // 检查是否有最新的手部关键点
      const landmarks = this.getLatestLandmarks();
      
      if (landmarks && landmarks.landmarks && landmarks.landmarks.length > 8) {
        // 确保 landmarks.landmarks[8] 存在且有效
        if (landmarks.landmarks[8] && typeof landmarks.landmarks[8].x === 'number' && typeof landmarks.landmarks[8].y === 'number') {
          // 返回食指指尖（关键点8）的坐标
          this.postMessage({
            position: landmarks.landmarks[8],
            landmarks: landmarks
          });
          return;
        }
      }
      
      this.postMessage(null);
    } catch (error) {
      console.error('MediaPipe处理失败:', error);
      // 尝试重新初始化 MediaPipe
      try {
        await this.initialize();
      } catch (reinitError) {
        console.error('MediaPipeHandTrackingService.processFrame: 重新初始化失败:', reinitError);
      }
      this.postMessage(null);
    } finally {
      this.isProcessing = false;
    }
  }
  
  private onResults(results: any) {
    if (!results) {
      // 不设置latestLandmarks为null，保留上次的关键点
      return;
    }
    
    if (!results.multiHandLandmarks) {
      // 不设置latestLandmarks为null，保留上次的关键点
      return;
    }
    
    if (results.multiHandLandmarks.length === 0) {
      // 不设置latestLandmarks为null，保留上次的关键点
      return;
    }
    
    const landmarks = results.multiHandLandmarks[0];
    
    if (!landmarks) {
      this.latestLandmarks = null;
      return;
    }
    
    if (landmarks.length < 21) {
      this.latestLandmarks = null;
      return;
    }
    
    // 存储所有关键点
    const normalizedLandmarks: FingerPosition[] = landmarks.map((landmark: any) => ({
      x: landmark.x * 640,
      y: landmark.y * 480,
      z: landmark.z
    }));
    
    // 平滑处理手部关键点
    const smoothedLandmarks = this.smoothLandmarks(normalizedLandmarks);
    
    // 检查是否有 multiHandedness 属性
    if (!results.multiHandedness || results.multiHandedness.length === 0) {
      this.latestLandmarks = {
        landmarks: smoothedLandmarks,
        handInViewConfidence: 0.5
      };
    } else {
      this.latestLandmarks = {
        landmarks: smoothedLandmarks,
        handInViewConfidence: results.multiHandedness[0].score
      };
    }
  }
  
  // 平滑处理手部关键点
  private smoothLandmarks(landmarks: FingerPosition[]): FingerPosition[] {
    // 添加到历史记录
    this.landmarksHistory.push(landmarks);
    
    // 限制历史记录长度
    if (this.landmarksHistory.length > this.MAX_LANDMARKS_HISTORY) {
      this.landmarksHistory.shift();
    }
    
    // 如果历史记录不足，直接返回当前关键点
    if (this.landmarksHistory.length < 2) {
      return landmarks;
    }
    
    // 平滑处理每个关键点
    const smoothedLandmarks: FingerPosition[] = landmarks.map((landmark, index) => {
      // 收集所有历史记录中对应索引的关键点
      const historyPoints = this.landmarksHistory.map(history => history[index])
        .filter(point => point !== undefined && point !== null);
      
      if (historyPoints.length < 2) {
        return landmark;
      }
      
      // 计算移动平均
      let sumX = 0;
      let sumY = 0;
      let sumZ = 0;
      
      for (const point of historyPoints) {
        sumX += point.x;
        sumY += point.y;
        sumZ += point.z || 0;
      }
      
      const avgX = sumX / historyPoints.length;
      const avgY = sumY / historyPoints.length;
      const avgZ = sumZ / historyPoints.length;
      
      // 混合当前位置和平滑位置
      return {
        x: landmark.x * (1 - this.LANDMARK_SMOOTHING_FACTOR) + avgX * this.LANDMARK_SMOOTHING_FACTOR,
        y: landmark.y * (1 - this.LANDMARK_SMOOTHING_FACTOR) + avgY * this.LANDMARK_SMOOTHING_FACTOR,
        z: (landmark.z || 0) * (1 - this.LANDMARK_SMOOTHING_FACTOR) + avgZ * this.LANDMARK_SMOOTHING_FACTOR
      };
    });
    
    return smoothedLandmarks;
  }
  
  // 获取最新的手部关键点
  private getLatestLandmarks(): HandLandmarks | null {
    return this.latestLandmarks;
  }
  
  // 平滑处理位置
  private smoothPosition(position: FingerPosition): FingerPosition {
    // 添加到历史记录
    this.positionHistory.push(position);
    
    // 限制历史记录长度
    if (this.positionHistory.length > this.MAX_HISTORY) {
      this.positionHistory.shift();
    }
    
    // 如果历史记录不足，直接返回当前位置
    if (this.positionHistory.length < 2) {
      return position;
    }
    
    // 计算移动平均
    let sumX = 0;
    let sumY = 0;
    
    for (const pos of this.positionHistory) {
      sumX += pos.x;
      sumY += pos.y;
    }
    
    const avgX = sumX / this.positionHistory.length;
    const avgY = sumY / this.positionHistory.length;
    
    // 混合当前位置和平滑位置
    return {
      x: position.x * (1 - this.SMOOTHING_FACTOR) + avgX * this.SMOOTHING_FACTOR,
      y: position.y * (1 - this.SMOOTHING_FACTOR) + avgY * this.SMOOTHING_FACTOR,
      z: position.z
    };
  }
  
  // 清除历史记录
  private clearHistory() {
    this.positionHistory = [];
    this.landmarksHistory = [];
  }
  
  // 销毁服务
  private async dispose() {
    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }
    
    this.isInitialized = false;
    this.positionHistory = [];
    this.landmarksHistory = [];
    this.latestLandmarks = null;
  }
  
  private postMessage(data: any) {
    self.postMessage(data);
  }
}

// 初始化WebWorker
const worker = new MediaPipeWorker();

// 监听消息
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  
  switch (message.type) {
    case 'initialize':
      worker.initialize();
      break;
    case 'processFrame':
      worker.processFrame(message.data);
      break;
    case 'clearHistory':
      worker.clearHistory();
      break;
    case 'dispose':
      worker.dispose();
      break;
  }
};

export {};
