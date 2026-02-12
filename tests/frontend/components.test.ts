import { mount } from '@vue/test-utils'
import GestureControl from '../../src/components/GestureControl.vue'
import MainView from '../../src/components/MainView.vue'

// 模拟 model-viewer 元素
global.customElements.define('model-viewer', class extends HTMLElement {
  get cameraOrbit() {
    return this.getAttribute('camera-orbit') || '0deg 75deg 0.5m'
  }
  set cameraOrbit(value) {
    this.setAttribute('camera-orbit', value)
  }
  get cameraControls() {
    return true
  }
  setAttribute(name: string, value: string) {
    super.setAttribute(name, value)
  }
})

// 测试 GestureControl 组件
describe('GestureControl Component', () => {
  test('should mount successfully', async () => {
    const wrapper = mount(GestureControl, {
      props: {
        videoElement: document.createElement('video'),
        canvasElement: document.createElement('canvas')
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })

  test('should emit action event when gesture is recognized', async () => {
    const wrapper = mount(GestureControl, {
      props: {
        videoElement: document.createElement('video'),
        canvasElement: document.createElement('canvas')
      }
    })
    
    // 模拟手势识别结果
    const mockDetections = [{
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
    
    // 触发手势识别
    await wrapper.vm.onDetectionsUpdate(mockDetections)
    
    // 检查是否触发了 action 事件
    expect(wrapper.emitted('action')).toBeTruthy()
  })

  test('should emit finger-move event when finger moves', async () => {
    const wrapper = mount(GestureControl, {
      props: {
        videoElement: document.createElement('video'),
        canvasElement: document.createElement('canvas')
      }
    })
    
    // 模拟手指移动
    const mockFingerData = {
      deltaX: 10,
      deltaY: 5,
      position: { x: 320, y: 240 }
    }
    
    // 触发手指移动
    await wrapper.vm.onFingerMove(mockFingerData)
    
    // 检查是否触发了 finger-move 事件
    expect(wrapper.emitted('finger-move')).toBeTruthy()
  })
})

// 测试 MainView 组件
describe('MainView Component', () => {
  test('should mount successfully', () => {
    const wrapper = mount(MainView)
    expect(wrapper.exists()).toBe(true)
  })

  test('should handle action event and start tracking for rotate', async () => {
    const wrapper = mount(MainView)
    
    // 触发 action 事件
    await wrapper.vm.handleAction('rotate')
    
    // 检查是否开始跟踪
    expect(wrapper.vm.isFingerTracking).toBe(true)
  })

  test('should handle finger move event and update camera orbit', async () => {
    const wrapper = mount(MainView)
    
    // 触发 finger-move 事件
    const mockFingerData = {
      deltaX: 10,
      deltaY: 5,
      position: { x: 320, y: 240 }
    }
    
    await wrapper.vm.onFingerMove(mockFingerData)
    
    // 检查是否更新了手指位置
    expect(wrapper.vm.modelFingerPosition).toEqual({
      x: 50,
      y: 50
    })
  })

  test('should handle zoom in action', async () => {
    const wrapper = mount(MainView)
    
    // 触发 zoom_in 动作
    await wrapper.vm.handleAction('zoom_in')
    
    // 检查是否调用了缩放方法
    expect(wrapper.vm.zoomLevel).toBeGreaterThan(0)
  })

  test('should handle zoom out action', async () => {
    const wrapper = mount(MainView)
    
    // 先设置一个初始缩放级别
    wrapper.vm.zoomLevel = 1.0
    
    // 触发 zoom_out 动作
    await wrapper.vm.handleAction('zoom_out')
    
    // 检查是否调用了缩放方法
    expect(wrapper.vm.zoomLevel).toBeLessThan(1.0)
  })
})
