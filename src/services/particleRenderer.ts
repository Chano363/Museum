import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ModelLocalStorage } from './modelLocalStorage'
import { ModelFileStorage } from './modelFileStorage'

export interface ParticleConfig {
  particleSize: number
  maxParticles: number
  animationSpeed: number
  breathingIntensity: number
}

export interface ModelCacheData {
  positions: Float32Array
  colors: Float32Array
  particleCount: number
  center: THREE.Vector3
  scale: number
}

const DEFAULT_CONFIG: ParticleConfig = {
  particleSize: 0.008,
  maxParticles: 200000,
  animationSpeed: 1.0,
  breathingIntensity: 0.02
}

class ModelCache {
  private static cache = new Map<string, ModelCacheData>()
  private static loadingPromises = new Map<string, Promise<ModelCacheData>>()
  
  static get(key: string): ModelCacheData | null {
    return this.cache.get(key) || null
  }
  
  static set(key: string, data: ModelCacheData): void {
    this.cache.set(key, data)
  }
  
  static has(key: string): boolean {
    return this.cache.has(key)
  }
  
  static getLoadingPromise(key: string): Promise<ModelCacheData> | null {
    return this.loadingPromises.get(key) || null
  }
  
  static setLoadingPromise(key: string, promise: Promise<ModelCacheData>): void {
    this.loadingPromises.set(key, promise)
  }
  
  static deleteLoadingPromise(key: string): void {
    this.loadingPromises.delete(key)
  }
  
  static clear(): void {
    this.cache.clear()
    this.loadingPromises.clear()
  }
}

export class ParticleRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private particles: THREE.Points | null = null
  private originalPositions: Float32Array | null = null
  private animationId: number | null = null
  private config: ParticleConfig
  private container: HTMLElement
  private isAnimating: boolean = false
  private breathingPhase: number = 0

  constructor(container: HTMLElement, config: Partial<ParticleConfig> = {}) {
    this.container = container
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    this.scene = new THREE.Scene()
    this.scene.background = null
    
    const aspect = container.clientWidth / container.clientHeight
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 100)
    this.camera.position.set(0, 0, 0.8)
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.enableZoom = true
    this.controls.enablePan = false
    this.controls.minDistance = 0.2
    this.controls.maxDistance = 2
    this.controls.target.set(0, 0, 0)
    
    this.addLights()
    this.animate = this.animate.bind(this)
  }

  private addLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    this.scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    this.scene.add(directionalLight)
    
    const pointLight = new THREE.PointLight(0xffd700, 1.0, 10)
    pointLight.position.set(0, 0, 2)
    this.scene.add(pointLight)
    
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0)
    hemisphereLight.position.set(0, 20, 0)
    this.scene.add(hemisphereLight)
  }

  async loadModel(modelPath: string): Promise<void> {
    // console.log('Loading model:', modelPath)
    
    if (ModelCache.has(modelPath)) {
      // console.log('✅ Model found in memory cache')
      this.createParticlesFromCache(modelPath)
      return
    }
    
    const existingPromise = ModelCache.getLoadingPromise(modelPath)
    if (existingPromise) {
      // console.log('⏳ Model is already loading, waiting...')
      await existingPromise
      this.createParticlesFromCache(modelPath)
      return
    }
    
    const loader = new GLTFLoader()
    
    const loadingPromise = new Promise<ModelCacheData>(async (resolve, reject) => {
      try {
        console.log('🔍 检查缓存:', modelPath)
        
        let localData = await ModelFileStorage.get(modelPath)
        if (localData) {
          console.log('✅ 从localStorage加载')
        } else {
          localData = await ModelLocalStorage.get(modelPath)
          if (localData) {
            console.log('✅ 从IndexedDB加载')
          }
        }
        
        if (localData) {
          ModelCache.set(modelPath, localData)
          ModelCache.deleteLoadingPromise(modelPath)
          resolve(localData)
          this.createParticlesFromCache(modelPath)
          return
        }
        
        console.log('❌ 缓存未找到，从网络加载...')
        loader.load(
          modelPath,
          async (gltf) => {
            const cacheData = await this.extractModelData(gltf.scene, modelPath)
            ModelCache.set(modelPath, cacheData)
            
            try {
              await ModelLocalStorage.set(modelPath, cacheData)
              console.log('💾 已保存到IndexedDB')
            } catch (error) {
              console.error('⚠️ IndexedDB保存失败:', error)
            }
            
            ModelCache.deleteLoadingPromise(modelPath)
            resolve(cacheData)
            
            this.createParticlesFromCache(modelPath)
          },
          (progress) => {
          },
          (error) => {
            console.error('Error loading model:', error)
            ModelCache.deleteLoadingPromise(modelPath)
            reject(error)
          }
        )
      } catch (error) {
        console.error('Error in loading promise:', error)
        ModelCache.deleteLoadingPromise(modelPath)
        reject(error)
      }
    })
    
    ModelCache.setLoadingPromise(modelPath, loadingPromise)
    
    try {
      await loadingPromise
    } catch (error) {
      console.error('Error loading model:', error)
    }
  }

  private async extractModelData(model: THREE.Group, modelPath: string): Promise<ModelCacheData> {
    const boundingBox = new THREE.Box3().setFromObject(model)
    const center = boundingBox.getCenter(new THREE.Vector3())
    const size = boundingBox.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const baseScale = 0.5 / maxDim
    const scale = modelPath.includes('黄金面具') ? baseScale * 0.9 : baseScale
    
    const tempVertex = new THREE.Vector3()
    const tempColor = new THREE.Color()
    const tempUV = new THREE.Vector2()
    
    let totalVertices = 0
    const maxParticles = this.config.maxParticles
    const targetParticles = Math.floor(maxParticles / 5)
    
    const positions: number[] = []
    const colors: number[] = []
    
    const textureCache = new Map<THREE.Texture, { data: Uint8ClampedArray, width: number, height: number } | null>()
    
    const getTextureData = (texture: THREE.Texture): { data: Uint8ClampedArray, width: number, height: number } | null => {
      if (textureCache.has(texture)) {
        return textureCache.get(texture) || null
      }
      
      const image = texture.image
      if (!image || !('width' in image) || !('height' in image)) {
        textureCache.set(texture, null)
        return null
      }
      
      if (!(image instanceof ImageBitmap) && !('complete' in image && image.complete)) {
        textureCache.set(texture, null)
        return null
      }
      
      const width = Math.min(image.width, 512)
      const height = Math.min(image.height, 512)
      
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          textureCache.set(texture, null)
          return null
        }
        
        ctx.drawImage(image, 0, 0, width, height)
        const data = ctx.getImageData(0, 0, width, height).data
        const result = { data, width, height }
        textureCache.set(texture, result)
        return result
      } catch {
        textureCache.set(texture, null)
        return null
      }
    }
    
    const processObject = (object: THREE.Object3D) => {
      if (!(object instanceof THREE.Mesh) || !object.geometry) {
        for (const child of object.children) {
          processObject(child)
        }
        return
      }
      
      const geometry = object.geometry
      const worldMatrix = object.matrixWorld
      
      const positionAttr = geometry.attributes.position
      const colorAttr = geometry.attributes.color
      const uvAttr = geometry.attributes.uv
      
      if (!positionAttr) {
        for (const child of object.children) {
          processObject(child)
        }
        return
      }
      
      const vertexCount = positionAttr.count
      totalVertices += vertexCount
      
      let baseColor = new THREE.Color(0xFFFFFF)
      let textureData: { data: Uint8ClampedArray, width: number, height: number } | null = null
      
      if (object.material) {
        const mat = Array.isArray(object.material) ? object.material[0] : object.material
        if (mat && mat.color) {
          baseColor.copy(mat.color)
        }
        
        if (mat && 'map' in mat && mat.map) {
          textureData = getTextureData(mat.map)
        }
      }
      
      const isGoldMask = modelPath.includes('黄金面具')
      const modelTargetParticles = isGoldMask ? targetParticles * 5 : targetParticles
      const sampleRate = Math.max(1, Math.floor(vertexCount / modelTargetParticles))
      
      for (let i = 0; i < vertexCount; i += sampleRate) {
        tempVertex.fromBufferAttribute(positionAttr, i)
        tempVertex.applyMatrix4(worldMatrix)
        tempVertex.sub(center)
        tempVertex.multiplyScalar(scale)
        
        positions.push(tempVertex.x, tempVertex.y, tempVertex.z)
        
        if (colorAttr) {
          tempColor.fromBufferAttribute(colorAttr, i)
        } else if (textureData && uvAttr) {
          tempUV.fromBufferAttribute(uvAttr, i)
          const u = Math.max(0, Math.min(1, tempUV.x))
          const v = Math.max(0, Math.min(1, tempUV.y))
          const x = Math.floor(u * (textureData.width - 1))
          const y = Math.floor((1 - v) * (textureData.height - 1))
          const idx = (y * textureData.width + x) * 4
          tempColor.setRGB(
            textureData.data[idx] / 255,
            textureData.data[idx + 1] / 255,
            textureData.data[idx + 2] / 255
          )
        } else {
          tempColor.copy(baseColor)
        }
        
        colors.push(tempColor.r, tempColor.g, tempColor.b)
      }
      
      for (const child of object.children) {
        processObject(child)
      }
    }
    
    processObject(model)

    if (positions.length === 0) {
      throw new Error('No particles extracted from model')
    }

    const particleCount = Math.min(positions.length / 3, maxParticles)
    const finalPositions = new Float32Array(positions.slice(0, particleCount * 3))
    const finalColors = new Float32Array(colors.slice(0, particleCount * 3))
    
    return {
      positions: finalPositions,
      colors: finalColors,
      particleCount,
      center,
      scale
    }
  }

  private createParticlesFromCache(modelPath: string): void {
    const cacheData = ModelCache.get(modelPath)
    if (!cacheData) {
      console.error('Model not found in cache:', modelPath)
      return
    }
    
    if (this.particles) {
      this.scene.remove(this.particles)
      this.particles.geometry.dispose()
      ;(this.particles.material as THREE.Material).dispose()
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(cacheData.positions.slice(), 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(cacheData.colors, 3))
    
    this.originalPositions = cacheData.positions
    
    const material = new THREE.PointsMaterial({
      size: this.config.particleSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true
    })
    
    this.particles = new THREE.Points(geometry, material)
    this.particles.position.set(0, 0, 0)
    this.scene.add(this.particles)
    
    this.isAnimating = true
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate)
    
    if (this.particles && this.isAnimating && this.originalPositions) {
      this.breathingPhase += 0.015 * this.config.animationSpeed
      
      const positions = this.particles.geometry.attributes.position.array as Float32Array
      const particleCount = positions.length / 3
      
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3
        const originalX = this.originalPositions[idx]
        const originalY = this.originalPositions[idx + 1]
        const originalZ = this.originalPositions[idx + 2]
        
        const distance = Math.sqrt(originalX * originalX + originalY * originalY + originalZ * originalZ)
        const phase = this.breathingPhase + distance * 3
        const breathingOffset = Math.sin(phase) * this.config.breathingIntensity * (0.5 + distance)
        
        positions[idx] = originalX * (1 + breathingOffset)
        positions[idx + 1] = originalY * (1 + breathingOffset)
        positions[idx + 2] = originalZ * (1 + breathingOffset)
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true
    }
    
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  start(): void {
    if (!this.animationId) {
      this.animate()
    }
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  zoomIn(): void {
    const distance = this.camera.position.length()
    const newDistance = Math.max(this.controls.minDistance, distance - 0.05)
    this.camera.position.normalize().multiplyScalar(newDistance)
    this.controls.update()
  }

  zoomOut(): void {
    const distance = this.camera.position.length()
    const newDistance = Math.min(this.controls.maxDistance, distance + 0.05)
    this.camera.position.normalize().multiplyScalar(newDistance)
    this.controls.update()
  }

  rotate(deltaX: number, deltaY: number): void {
    const spherical = new THREE.Spherical()
    spherical.setFromVector3(this.camera.position)
    
    spherical.theta += deltaX * 0.01
    spherical.phi += deltaY * 0.01
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))
    
    this.camera.position.setFromSpherical(spherical)
    this.camera.lookAt(0, 0, 0)
    this.controls.update()
  }

  reset(): void {
    this.camera.position.set(0, 0, 0.8)
    this.camera.lookAt(0, 0, 0)
    this.controls.target.set(0, 0, 0)
    this.controls.reset()
  }

  resize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  dispose(): void {
    this.stop()
    
    if (this.particles) {
      this.scene.remove(this.particles)
      this.particles.geometry.dispose()
      ;(this.particles.material as THREE.Material).dispose()
    }
    
    this.controls.dispose()
    this.renderer.dispose()
  }
}

export { ModelCache }
