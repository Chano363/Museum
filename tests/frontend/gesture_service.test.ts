import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackendGestureRecognitionService } from '../../src/services/backendGestureRecognition';

// 模拟 fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 创建模拟的 ImageData
function createMockImageData(width: number, height: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建画布上下文');
  }
  return ctx.createImageData(width, height);
}

describe('BackendGestureRecognitionService', () => {
  let gestureService: BackendGestureRecognitionService;
  
  beforeEach(() => {
    gestureService = new BackendGestureRecognitionService();
    mockFetch.mockClear();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('初始化测试', () => {
    it('应该能够成功初始化', async () => {
      // 模拟成功的响应
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ detections: [] })
      } as Response);
      
      await expect(gestureService.initialize()).resolves.not.toThrow();
      expect(gestureService.isReady()).toBe(true);
    });
    
    it('应该能够处理初始化失败', async () => {
      // 模拟失败的响应
      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('服务器错误')
      } as Response);
      
      await expect(gestureService.initialize()).rejects.toThrow();
      expect(gestureService.isReady()).toBe(false);
    });
    
    it('应该能够处理网络错误', async () => {
      // 模拟网络错误
      mockFetch.mockRejectedValue(new Error('网络错误'));
      
      await expect(gestureService.initialize()).rejects.toThrow();
      expect(gestureService.isReady()).toBe(false);
    });
  });
  
  describe('处理帧测试', () => {
    beforeEach(async () => {
      // 先初始化服务
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ detections: [] })
      } as Response);
      await gestureService.initialize();
      mockFetch.mockClear();
    });
    
    it('应该能够处理正常的帧', async () => {
      const mockImageData = createMockImageData(640, 480);
      
      // 模拟成功的响应
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ detections: [{ bbox: { x1: 100, y1: 100, x2: 200, y2: 200, confidence: 0.9 }, gesture: 1, gestureName: 'hand_right' }] })
      } as Response);
      
      const result = await gestureService.processFrame(mockImageData);
      expect(result).toBeInstanceOf(Array);
      expect(mockFetch).toHaveBeenCalledWith('/api/recognize', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.any(String)
      }));
    });
    
    it('应该能够处理未初始化的情况', async () => {
      // 创建一个新的未初始化的服务
      const uninitializedService = new BackendGestureRecognitionService();
      const mockImageData = createMockImageData(640, 480);
      
      const result = await uninitializedService.processFrame(mockImageData);
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
    
    it('应该能够处理处理中的情况', async () => {
      const mockImageData = createMockImageData(640, 480);
      
      // 模拟一个慢速的响应
      mockFetch.mockResolvedValue(new Promise(() => {}));
      
      // 开始第一个请求
      const firstRequest = gestureService.processFrame(mockImageData);
      
      // 立即发起第二个请求，应该被忽略
      const secondResult = await gestureService.processFrame(mockImageData);
      expect(secondResult).toEqual([]);
      
      // 清理
      vi.clearAllTimers();
    });
    
    it('应该能够处理API错误', async () => {
      const mockImageData = createMockImageData(640, 480);
      
      // 模拟失败的响应
      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('API错误')
      } as Response);
      
      const result = await gestureService.processFrame(mockImageData);
      expect(result).toEqual([]);
    });
    
    it('应该能够处理网络错误', async () => {
      const mockImageData = createMockImageData(640, 480);
      
      // 模拟网络错误
      mockFetch.mockRejectedValue(new Error('网络错误'));
      
      const result = await gestureService.processFrame(mockImageData);
      expect(result).toEqual([]);
    });
  });
  
  describe('性能监控测试', () => {
    beforeEach(async () => {
      // 先初始化服务
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ detections: [] })
      } as Response);
      await gestureService.initialize();
      mockFetch.mockClear();
    });
    
    it('应该能够获取FPS', async () => {
      const mockImageData = createMockImageData(640, 480);
      
      // 模拟成功的响应
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ detections: [] })
      } as Response);
      
      await gestureService.processFrame(mockImageData);
      const fps = gestureService.getFPS();
      expect(typeof fps).toBe('number');
      expect(fps >= 0).toBe(true);
    });
  });
  
  describe('销毁测试', () => {
    it('应该能够成功销毁', async () => {
      // 先初始化服务
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ detections: [] })
      } as Response);
      await gestureService.initialize();
      
      expect(gestureService.isReady()).toBe(true);
      await gestureService.destroy();
      expect(gestureService.isReady()).toBe(false);
    });
  });
});
