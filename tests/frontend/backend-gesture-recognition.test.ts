import { BackendGestureRecognitionService } from '../../src/services/backendGestureRecognition'

// 模拟 canvas 上下文
const mockCanvasContext = {
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  putImageData: jest.fn(),
  fillStyle: '',
  fillRect: jest.fn()
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

// 测试 BackendGestureRecognitionService
describe('BackendGestureRecognitionService', () => {
  let backendService: BackendGestureRecognitionService

  beforeEach(() => {
    backendService = new BackendGestureRecognitionService()
  })

  test('should initialize successfully', async () => {
    await backendService.initialize()
    expect(backendService.isReady()).toBe(true)
  })

  test('should process frame and return detections', async () => {
    await backendService.initialize()
    const mockImageData = createMockImageData(640, 480)
    
    // 模拟 fetch 响应
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        detections: [{
          bbox: {
            x1: 100,
            y1: 100,
            x2: 300,
            y2: 300,
            confidence: 0.9
          },
          gesture: 19,
          gestureName: 'point'
        }]
      })
    } as Response)

    const result = await backendService.processFrame(mockImageData)
    expect(result).toEqual([{
      bbox: {
        x1: 100,
        y1: 100,
        x2: 300,
        y2: 300,
        confidence: 0.9
      },
      gesture: 19,
      gestureName: 'point'
    }])
  })

  test('should return empty array when recognition fails', async () => {
    await backendService.initialize()
    const mockImageData = createMockImageData(640, 480)
    
    // 模拟 fetch 响应
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Recognition failed'
      })
    } as Response)

    const result = await backendService.processFrame(mockImageData)
    expect(result).toEqual([])
  })

  test('should return empty array when API request fails', async () => {
    await backendService.initialize()
    const mockImageData = createMockImageData(640, 480)
    
    // 模拟 fetch 响应
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500
    } as Response)

    const result = await backendService.processFrame(mockImageData)
    expect(result).toEqual([])
  })

  test('should handle network errors gracefully', async () => {
    await backendService.initialize()
    const mockImageData = createMockImageData(640, 480)
    
    // 模拟网络错误
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    const result = await backendService.processFrame(mockImageData)
    expect(result).toEqual([])
  })

  test('should dispose resources', async () => {
    await backendService.initialize()
    await backendService.dispose()
    expect(backendService.isReady()).toBe(false)
  })
})
