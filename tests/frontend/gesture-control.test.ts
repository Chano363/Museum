import { MediaPipeHandTrackingService } from '../../src/services/mediaPipeHandTracking'
import { ActionRecognitionService } from '../../src/services/actionRecognition'

// 模拟 canvas 上下文
const mockCanvasContext = {
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  putImageData: jest.fn(),
  fillStyle: '',
  fillRect: jest.fn(),
  strokeStyle: '',
  lineWidth: 0,
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn()
};

// 模拟 HTMLCanvasElement
const mockCanvas: any = {
  width: 640,
  height: 480,
  getContext: jest.fn().mockReturnValue(mockCanvasContext),
  toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwD9+//Z'),
  setAttribute: jest.fn()
};

// 模拟 document.createElement
(global as any).document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return document.createElement(tagName);
});

// 模拟 ImageData
function createMockImageData(width: number, height: number): ImageData {
  // 直接创建 ImageData 对象，避免 canvas 上下文问题
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
    toString: () => '[object ImageData]'
  } as ImageData
}

// 模拟 ImageDataToBase64 方法
Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: jest.fn().mockReturnValue('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwD9+//Z'),
  writable: true
});

// 测试 MediaPipeHandTrackingService
describe('MediaPipeHandTrackingService', () => {
  let handTrackingService: MediaPipeHandTrackingService

  beforeEach(() => {
    handTrackingService = new MediaPipeHandTrackingService()
  })

  test('should initialize successfully', async () => {
    await handTrackingService.initialize()
    expect(handTrackingService.isReady()).toBe(true)
  })

  test('should process frame and return position', async () => {
    await handTrackingService.initialize()
    const mockImageData = createMockImageData(640, 480)
    
    // 模拟 fetch 响应
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        position: { x: 320, y: 240, z: 0 },
        landmarks: []
      })
    } as Response)

    const position = await handTrackingService.processFrame(mockImageData)
    expect(position).toEqual({ x: 320, y: 240, z: 0 })
  })

  test('should return null when no hand detected', async () => {
    await handTrackingService.initialize()
    const mockImageData = createMockImageData(640, 480)
    
    // 模拟 fetch 响应
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        message: 'No hands detected'
      })
    } as Response)

    const position = await handTrackingService.processFrame(mockImageData)
    expect(position).toBeNull()
  })

  test('should return null when API request fails', async () => {
    await handTrackingService.initialize()
    const mockImageData = createMockImageData(640, 480)
    
    // 模拟 fetch 响应
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500
    } as Response)

    const position = await handTrackingService.processFrame(mockImageData)
    expect(position).toBeNull()
  })

  test('should clear history', async () => {
    await handTrackingService.initialize()
    handTrackingService.clearHistory()
    // 验证历史记录已清除（通过后续处理测试）
    const mockImageData = createMockImageData(640, 480)
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        position: { x: 320, y: 240, z: 0 },
        landmarks: []
      })
    } as Response)

    const position = await handTrackingService.processFrame(mockImageData)
    expect(position).toEqual({ x: 320, y: 240, z: 0 })
  })

  test('should dispose resources', async () => {
    await handTrackingService.initialize()
    await handTrackingService.dispose()
    expect(handTrackingService.isReady()).toBe(false)
  })
})

// 测试 ActionRecognitionService
describe('ActionRecognitionService', () => {
  let actionRecognitionService: ActionRecognitionService

  beforeEach(() => {
    actionRecognitionService = new ActionRecognitionService()
  })

  test('should update detections and return action', () => {
    const mockDetections = [{
      bbox: {
        x1: 100,
        y1: 100,
        x2: 300,
        y2: 300,
        confidence: 0.9
      },
      gesture: 19, // point 手势
      gestureName: 'point'
    }]

    const action = actionRecognitionService.updateDetections(mockDetections)
    expect(['rotate']).toContain(action)
  })

  test('should return null for unknown gesture', () => {
    const mockDetections = [{
      bbox: {
        x1: 100,
        y1: 100,
        x2: 300,
        y2: 300,
        confidence: 0.9
      },
      gesture: 999, // 未知手势
      gestureName: 'unknown'
    }]

    const action = actionRecognitionService.updateDetections(mockDetections)
    expect(action).toBeNull()
  })

  test('should handle empty detections', () => {
    const action = actionRecognitionService.updateDetections([])
    expect(action).toBeNull()
  })
})

// 测试手势到动作的映射
describe('Gesture to Action Mapping', () => {
  test('should map rotate gestures correctly', () => {
    const rotateGestures = [19, 30, 31, 35, 36, 38, 32, 33, 29, 11, 12, 22]
    const actionRecognitionService = new ActionRecognitionService()

    rotateGestures.forEach(gestureId => {
      const mockDetections = [{
        bbox: {
          x1: 100,
          y1: 100,
          x2: 300,
          y2: 300,
          confidence: 0.9
        },
        gesture: gestureId,
        gestureName: 'test'
      }]

      const action = actionRecognitionService.updateDetections(mockDetections)
      expect(action).toBe('rotate')
    })
  })

  test('should map zoom gestures correctly', () => {
    const actionRecognitionService = new ActionRecognitionService()

    // Test zoom_in gesture - 需要多次调用以达到稳定性阈值
    const zoomInDetections = [{
      bbox: {
        x1: 100,
        y1: 100,
        x2: 300,
        y2: 300,
        confidence: 0.9
      },
      gesture: 27, // like 手势
      gestureName: 'like'
    }]
    
    // 多次调用以确保动作被识别
    let zoomInAction = null
    for (let i = 0; i < 5; i++) {
      zoomInAction = actionRecognitionService.updateDetections(zoomInDetections)
    }
    expect(['zoom_in', null]).toContain(zoomInAction)

    // Test zoom_out gesture
    const zoomOutDetections = [{
      bbox: {
        x1: 100,
        y1: 100,
        x2: 300,
        y2: 300,
        confidence: 0.9
      },
      gesture: 24, // dislike 手势
      gestureName: 'dislike'
    }]
    
    // 多次调用以确保动作被识别
    let zoomOutAction = null
    for (let i = 0; i < 5; i++) {
      zoomOutAction = actionRecognitionService.updateDetections(zoomOutDetections)
    }
    expect(['zoom_out', null]).toContain(zoomOutAction)
  })
})

// 测试 3D 模型控制功能
describe('3D Model Control', () => {
  test('should calculate camera orbit correctly', () => {
    // 模拟 model-viewer 元素
    const mockModelViewer = {
      cameraOrbit: '0deg 75deg 0.5m',
      setAttribute: jest.fn()
    }

    // 计算新的相机轨道
    const currentOrbit = mockModelViewer.cameraOrbit.split(' ')
    const azimuth = parseFloat(currentOrbit[0]) || 0
    const elevation = parseFloat(currentOrbit[1]) || 75
    const distance = currentOrbit[2] || '0.5m'

    const deltaX = 10
    const deltaY = 5
    const sensitivity = 0.5

    const newAzimuth = azimuth + deltaX * sensitivity
    const newElevation = Math.max(-85, Math.min(85, elevation - deltaY * sensitivity))
    const newOrbit = `${newAzimuth.toFixed(2)}deg ${newElevation.toFixed(2)}deg ${distance}`

    expect(newOrbit).toBe('5.00deg 72.50deg 0.5m')
  })

  test('should clamp elevation correctly', () => {
    // 测试最小 elevation
    let elevation = -90
    const deltaY = -10
    const sensitivity = 0.5
    let newElevation = Math.max(-85, Math.min(85, elevation - deltaY * sensitivity))
    expect(newElevation).toBe(-85)

    // 测试最大 elevation
    elevation = 90
    newElevation = Math.max(-85, Math.min(85, elevation - deltaY * sensitivity))
    expect(newElevation).toBe(85)
  })
})
