<template>
  <div class="main-view">
    <!-- 3D 渲染容器 -->
    <div class="model-container" ref="modelContainer"></div>
    
    <!-- 加载动画 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载模型中...</div>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
          </div>
          <div class="progress-text">{{ Math.round(loadingProgress) }}%</div>
        </div>
      </div>
    </div>
    
    <!-- 手势控制容器 -->
    <div class="camera-container" v-if="showCamera">
      <GestureControl
        ref="gestureControlRef"
        :width="videoWidth"
        :height="videoHeight"
        :show-overlay="isDev"
        :show-guide="false"
        @action="onGestureAction"
        @gesture="onGestureDetected"
      />
    </div>
    
    <!-- 底部工具栏 -->
    <div class="toolbar">
      <button class="tool-btn" @click="toggleRotation">
        {{ isRotationLocked ? '🔒' : '🔄' }}
      </button>
      <button class="tool-btn" @click="zoomIn">
        🔍+
      </button>
      <button class="tool-btn" @click="zoomOut">
        🔍-
      </button>
      <button class="tool-btn" @click="resetView">
        🔄
      </button>
      <button class="tool-btn" @click="toggleCamera">
        {{ showCamera ? '📷' : '📵' }}
      </button>
      <button class="info-btn" @click="$emit('showInfo')">
        ℹ️
      </button>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'
import { Howl } from 'howler'
import GestureControl from './GestureControl.vue'

export default {
  name: 'MainView',
  components: {
    GestureControl
  },
  props: {
    selectedArtifact: {
      type: Object,
      required: true
    }
  },
  emits: ['showInfo', 'showGestureHint', 'nextModel'],
  data() {
    return {
      isRotationLocked: false,
      autoRotationSpeed: 0.005,
      showCamera: false,
      videoWidth: 640,
      videoHeight: 480,
      isLoading: false,
      loadingProgress: 0,
      sounds: {
        gesture: null,
        modelChange: null,
        zoom: null,
        info: null
      }
    }
  },
  computed: {
    isDev() {
      return import.meta.env.DEV
    }
  },
  mounted() {
    // 定义非响应式的Three.js对象
    Object.defineProperty(this, 'scene', { value: null, writable: true })
    Object.defineProperty(this, 'camera', { value: null, writable: true })
    Object.defineProperty(this, 'renderer', { value: null, writable: true })
    Object.defineProperty(this, 'controls', { value: null, writable: true })
    Object.defineProperty(this, 'currentModel', { value: null, writable: true })
    Object.defineProperty(this, 'gestureControlRef', { value: null, writable: true })
    
    try {
      console.log('MainView mounted, selectedArtifact:', this.selectedArtifact)
      console.log('Model container ref:', this.$refs.modelContainer)
      if (this.$refs.modelContainer) {
        console.log('Model container size:', this.$refs.modelContainer.clientWidth, 'x', this.$refs.modelContainer.clientHeight)
      }
      this.initThreeJS()
      this.createModel()
      this.animate()
      console.log('Three.js初始化成功')
      
      // 初始化音效
      this.initSounds()
    } catch (error) {
      console.error('初始化失败:', error)
    }
  },
  methods: {
    initSounds() {
      // 初始化音效对象
      try {
        this.sounds.gesture = new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/204/204-preview.mp3'],
          volume: 0.5
        })
        
        this.sounds.modelChange = new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'],
          volume: 0.5
        })
        
        this.sounds.zoom = new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/3/3-preview.mp3'],
          volume: 0.5
        })
        
        this.sounds.info = new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3'],
          volume: 0.5
        })
        
        console.log('音效初始化成功')
      } catch (error) {
        console.error('音效初始化失败:', error)
      }
    },
    playSound(soundName) {
      // 播放指定音效
      if (this.sounds[soundName] && typeof this.sounds[soundName].play === 'function') {
        this.sounds[soundName].play()
      }
    },
    onGestureAction(action) {
      console.log('检测到动作:', action)
      
      // 播放手势检测音效
      this.playSound('gesture')
      
      // 处理不同的动作
      switch (action) {
        case 'swipe_left':
          // 向左滑动：上一个展品
          this.$emit('nextModel')
          this.playSound('modelChange')
          this.$emit('showGestureHint', '上一个展品')
          break
        case 'swipe_right':
          // 向右滑动：下一个展品
          this.$emit('nextModel')
          this.playSound('modelChange')
          this.$emit('showGestureHint', '下一个展品')
          break
        case 'swipe_up':
          // 向上滑动：放大模型
          this.zoomIn()
          this.playSound('zoom')
          this.$emit('showGestureHint', '放大模型')
          break
        case 'swipe_down':
          // 向下滑动：缩小模型
          this.zoomOut()
          this.playSound('zoom')
          this.$emit('showGestureHint', '缩小模型')
          break
        case 'tap':
          // 点击：显示模型信息
          this.$emit('showInfo')
          this.playSound('info')
          this.$emit('showGestureHint', '显示信息')
          break
        case 'zoom_in':
          // 放大动作
          this.zoomIn()
          this.playSound('zoom')
          this.$emit('showGestureHint', '放大模型')
          break
        case 'zoom_out':
          // 缩小动作
          this.zoomOut()
          this.playSound('zoom')
          this.$emit('showGestureHint', '缩小模型')
          break
        case 'drop':
          // 张开手：重置模型视角
          this.resetView()
          this.playSound('info')
          this.$emit('showGestureHint', '重置模型视角')
          break
        default:
          console.log('未处理的动作:', action)
      }
    },
    onGestureDetected(gesture) {
      console.log('检测到手势:', gesture)
    },
    toggleCamera() {
      console.log('切换摄像头状态:', this.showCamera)
      this.showCamera = !this.showCamera
      console.log('摄像头状态已切换:', this.showCamera)
    },
    initThreeJS() {
      const container = this.$refs.modelContainer
      
      // 创建场景
      this.scene = new THREE.Scene()
      this.scene.background = new THREE.Color(0xf5f1e8) // 宣纸米白
      
      // 创建相机
      this.camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      )
      this.camera.position.z = 5
      
      // 创建渲染器并优化设置
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      })
      this.renderer.setSize(container.clientWidth, container.clientHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 限制像素比，提高性能
      this.renderer.setAnimationLoop(this.animate.bind(this)) // 使用setAnimationLoop替代requestAnimationFrame，性能更好
      container.appendChild(this.renderer.domElement)
      
      // 创建控制器
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableDamping = true
      this.controls.dampingFactor = 0.05
      this.controls.autoRotate = true
      this.controls.autoRotateSpeed = this.autoRotationSpeed
      this.controls.enablePan = false // 禁用平移，提高性能
      
      // 添加灯光
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      this.scene.add(ambientLight)
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(5, 5, 5)
      this.scene.add(directionalLight)
      
      // 响应窗口大小变化
      window.addEventListener('resize', this.handleResize)
    },
    createModel() {
      if (this.currentModel) {
        this.scene.remove(this.currentModel)
      }
      
      // 尝试加载外部GLTF模型
      if (this.selectedArtifact.model === 'external') {
        this.loadExternalModel()
        return
      }
      
      // 根据文物类型创建简单几何体
      let geometry
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.selectedArtifact.color)
      })
      
      switch (this.selectedArtifact.model) {
        case 'cube':
          geometry = new THREE.BoxGeometry(2, 3, 2) // 花瓶
          break
        case 'sphere':
          geometry = new THREE.SphereGeometry(1.5, 32, 32) // 雕像
          break
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(1, 1, 0.5, 32) // 钱币
          break
        default:
          geometry = new THREE.BoxGeometry(2, 2, 2)
      }
      
      this.currentModel = new THREE.Mesh(geometry, material)
      this.scene.add(this.currentModel)
    },
    
    loadExternalModel() {
      const modelPath = this.selectedArtifact.modelPath || '/3Dmodels/dragon_with_pearl/scene.gltf'
      
      // 设置加载状态
      this.isLoading = true
      this.loadingProgress = 0
      
      // 根据文件扩展名选择加载器
      if (modelPath.endsWith('.gltf') || modelPath.endsWith('.glb')) {
        this.loadGLTFModel(modelPath)
      } else if (modelPath.endsWith('.obj')) {
        this.loadOBJModel(modelPath)
      } else {
        console.error('不支持的模型格式:', modelPath)
        this.isLoading = false
        this.createDefaultModel()
      }
    },
    
    loadGLTFModel(modelPath) {
      const loader = new GLTFLoader()
      
      loader.load(modelPath, (gltf) => {
        console.log('GLTF模型加载成功:', modelPath)
        
        // 移除旧模型
        if (this.currentModel) {
          this.scene.remove(this.currentModel)
          console.log('旧模型已移除')
        }
        
        this.currentModel = gltf.scene
        
        // 调整模型大小和位置
        this.adjustModel(this.currentModel)
        
        this.scene.add(this.currentModel)
        console.log('GLTF模型已添加到场景')
        
        // 加载完成
        this.isLoading = false
      }, (progress) => {
        const progressValue = (progress.loaded / progress.total * 100)
        this.loadingProgress = progressValue
        console.log('模型加载进度:', progressValue.toFixed(2) + '%')
      }, (error) => {
        console.error('GLTF模型加载失败:', error)
        this.isLoading = false
        this.createDefaultModel()
      })
    },
    
    loadOBJModel(modelPath) {
      // 计算MTL文件路径
      const mtlPath = modelPath.replace('.obj', '.mtl')
      
      const mtlLoader = new MTLLoader()
      
      mtlLoader.load(mtlPath, (materials) => {
        materials.preload()
        
        const objLoader = new OBJLoader()
        objLoader.setMaterials(materials)
        
        objLoader.load(modelPath, (object) => {
          console.log('OBJ模型加载成功:', modelPath)
          
          // 移除旧模型
          if (this.currentModel) {
            this.scene.remove(this.currentModel)
            console.log('旧模型已移除')
          }
          
          this.currentModel = object
          
          // 调整模型大小和位置
          this.adjustModel(this.currentModel)
          
          this.scene.add(this.currentModel)
          console.log('OBJ模型已添加到场景')
          
          // 加载完成
          this.isLoading = false
        }, (progress) => {
          const progressValue = (progress.loaded / progress.total * 100)
          this.loadingProgress = progressValue
          console.log('模型加载进度:', progressValue.toFixed(2) + '%')
        }, (error) => {
          console.error('OBJ模型加载失败:', error)
          // 尝试不使用材质加载OBJ模型
          this.loadOBJModelWithoutMaterial(modelPath)
        })
      }, (progress) => {
        const progressValue = (progress.loaded / progress.total * 100)
        this.loadingProgress = progressValue * 0.3 // 材质加载占30%
        console.log('材质加载进度:', progressValue.toFixed(2) + '%')
      }, (error) => {
        console.error('材质文件加载失败:', error)
        // 尝试不使用材质加载OBJ模型
        this.loadOBJModelWithoutMaterial(modelPath)
      })
    },
    
    loadOBJModelWithoutMaterial(modelPath) {
      const objLoader = new OBJLoader()
      
      objLoader.load(modelPath, (object) => {
        console.log('OBJ模型（无材质）加载成功:', modelPath)
        
        // 移除旧模型
        if (this.currentModel) {
          this.scene.remove(this.currentModel)
          console.log('旧模型已移除')
        }
        
        this.currentModel = object
        
        // 为模型添加默认材质
        this.currentModel.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(this.selectedArtifact.color || 0x8b0000),
              metalness: 0.5,
              roughness: 0.5
            })
          }
        })
        
        // 调整模型大小和位置
        this.adjustModel(this.currentModel)
        
        this.scene.add(this.currentModel)
        console.log('OBJ模型（无材质）已添加到场景')
        
        // 加载完成
        this.isLoading = false
      }, (progress) => {
        const progressValue = (progress.loaded / progress.total * 100)
        this.loadingProgress = progressValue
        console.log('模型加载进度:', progressValue.toFixed(2) + '%')
      }, (error) => {
        console.error('OBJ模型加载失败:', error)
        this.isLoading = false
        this.createDefaultModel()
      })
    },
    
    adjustModel(model) {
      // 计算模型边界框以设置合适的相机位置
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = this.camera.fov * (Math.PI / 180)
      let cameraZ = (maxDim / 2) / Math.tan(fov / 2)
      cameraZ *= 1.2 // 减少额外空间，使模型看起来更大
      
      // 调整模型大小
      const scale = 3 / maxDim // 增加模型默认大小
      model.scale.set(scale, scale, scale)
      
      // 调整模型位置到原点
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center.clone().multiplyScalar(scale))
      model.position.y -= 0.5 // 减少向下偏移
      
      // 调整相机位置
      this.camera.position.z = cameraZ
      this.controls.target.copy(new THREE.Vector3(0, 0, 0))
      this.controls.update()
    },
    
    createDefaultModel() {
      const geometry = new THREE.BoxGeometry(2, 2, 2)
      const material = new THREE.MeshStandardMaterial({
        color: 0x8b0000
      })
      this.currentModel = new THREE.Mesh(geometry, material)
      this.scene.add(this.currentModel)
      console.log('已创建默认模型')
    },
    updateModel() {
      try {
        console.log('更新模型:', this.selectedArtifact)
        this.createModel()
        console.log('模型更新成功')
      } catch (error) {
        console.error('模型更新失败:', error)
      }
    },
    animate() {
      if (this.controls) {
        this.controls.update()
      }
      
      if (this.currentModel && !this.isRotationLocked) {
        this.currentModel.rotation.y += this.autoRotationSpeed
      }
      
      if (this.renderer) {
        this.renderer.render(this.scene, this.camera)
      }
    },
    toggleRotation() {
      this.isRotationLocked = !this.isRotationLocked
      if (this.controls) {
        this.controls.autoRotate = !this.isRotationLocked
      }
    },
    zoomIn() {
      this.camera.position.z -= 0.5
    },
    zoomOut() {
      this.camera.position.z += 0.5
    },
    resetView() {
      this.camera.position.set(0, 0, 5)
      this.camera.lookAt(0, 0, 0)
      this.isRotationLocked = false
      if (this.controls) {
        this.controls.autoRotate = true
      }
    },
    handleResize() {
      if (!this.camera || !this.renderer || !this.$refs.modelContainer) return
      
      const container = this.$refs.modelContainer
      this.camera.aspect = container.clientWidth / container.clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(container.clientWidth, container.clientHeight)
    }
  },
  watch: {
    selectedArtifact: {
      handler() {
        this.updateModel()
      },
      deep: true
    }
  },
  beforeUnmount() {
    // 清理 Three.js 资源
    if (this.renderer) {
      this.renderer.dispose()
    }
    if (this.currentModel) {
      this.scene.remove(this.currentModel)
    }
  }
}
</script>

<style scoped>
.main-view {
  position: absolute;
  top: 140px; /* 与缩略图栏底部对齐 */
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(245, 241, 232, 0.95); /* 淡宣纸纹理 */
  overflow: hidden;
}

.model-container {
  width: 100%;
  height: calc(100% - 60px); /* 留出工具栏空间 */
  position: relative;
  z-index: 1;
}

/* 摄像头容器样式 */
.camera-container {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 200px;
  height: 150px;
  z-index: 10;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  background-color: rgba(60, 42, 30, 0.1);
  transition: all 0.3s ease;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.camera-canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  pointer-events: none;
}

.toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: rgba(60, 42, 30, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  backdrop-filter: blur(5px);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.tool-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: rgba(245, 241, 232, 0.8);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.tool-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.info-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: #8b0000; /* 朱砂红 */
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(139, 0, 0, 0.2);
}

.info-btn:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(139, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .camera-container {
    width: 180px;
    height: 135px;
  }
}

@media (max-width: 768px) {
  .main-view {
    top: 120px; /* 调整与缩略图栏的间距 */
  }
  
  .model-container {
    height: calc(100% - 50px); /* 调整工具栏高度 */
  }
  
  .camera-container {
    width: 150px;
    height: 112px;
    top: 15px;
    right: 15px;
  }
  
  .toolbar {
    height: 50px;
    gap: 12px;
  }
  
  .tool-btn {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  
  .info-btn {
    right: 15px;
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .main-view {
    top: 100px; /* 进一步调整与缩略图栏的间距 */
  }
  
  .model-container {
    height: calc(100% - 45px); /* 进一步调整工具栏高度 */
  }
  
  .camera-container {
    width: 120px;
    height: 90px;
    top: 10px;
    right: 10px;
  }
  
  .toolbar {
    height: 45px;
    gap: 10px;
  }
  
  .tool-btn {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
  
  .info-btn {
    right: 10px;
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
}

/* 加载动画样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.loading-content {
  background-color: rgba(245, 241, 232, 0.95);
  border-radius: 15px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(139, 0, 0, 0.2);
  border-top: 5px solid #8b0000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  font-weight: bold;
  color: #3c2a1e;
  margin-bottom: 20px;
}

.loading-progress {
  width: 100%;
  margin-top: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(60, 42, 30, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #8b0000;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #6b5645;
  font-weight: 500;
}

/* 横屏模式优化 */
@media (orientation: landscape) and (max-height: 500px) {
  .camera-container {
    position: absolute;
    bottom: 70px;
    right: 20px;
    width: 120px;
    height: 90px;
  }
}
</style>
