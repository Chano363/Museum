<template>
  <div class="three-particle-effect">
    <div ref="containerRef" class="particle-container"></div>
  </div>
</template>

<script>
import * as THREE from 'three'

export default {
  name: 'ThreeParticleEffect',
  props: {
    // 粒子数量
    particleCount: {
      type: Number,
      default: 1000
    },
    // 粒子大小范围
    particleSize: {
      type: Number,
      default: 0.02
    },
    // 粒子颜色
    particleColor: {
      type: String,
      default: '#C49210'
    },
    // 粒子透明度
    particleOpacity: {
      type: Number,
      default: 0.8
    },
    // 模型旋转状态
    modelRotation: {
      type: Number,
      default: 0
    },
    // 模型旋转速度
    rotationSpeed: {
      type: Number,
      default: 0
    },
    // 是否正在旋转
    isRotating: {
      type: Boolean,
      default: false
    },
    // 是否启用历史轨迹模式
    enableTrailMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      container: null,
      burstParticles: [],
      trailParticles: [],
      animationId: null,
      isRunning: false,
      lastRotationState: 0,
      isRotationStarting: false,
      rotationStartTime: 0,
      particlePositions: null,
      particleVelocities: null,
      particleOpacities: null,
      particleSizes: null
    }
  },
  
  // 使用实例属性存储Three.js对象，避免Vue 3的响应式代理
  scene: null,
  camera: null,
  renderer: null,
  particleSystem: null,
  modelCenter: null,
  mounted() {
    this.initThreeJS()
    this.createParticleSystem()
    this.startAnimation()
    
    // 响应窗口大小变化
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    this.stopAnimation()
    window.removeEventListener('resize', this.handleResize)
    
    // 清理Three.js资源
    if (this.renderer) {
      this.renderer.dispose()
    }
    if (this.particleSystem) {
      this.particleSystem.geometry.dispose()
      this.particleSystem.material.dispose()
    }
  },
  watch: {
    // 监听模型旋转状态变化
    modelRotation(newValue, oldValue) {
      this.updateParticleRotation(newValue - oldValue)
    },
    // 监听旋转状态变化
    isRotating(newValue) {
      if (newValue && !this.isRotationStarting) {
        this.isRotationStarting = true
        this.rotationStartTime = performance.now()
        this.createBurstParticles()
      } else if (!newValue && this.isRotationStarting) {
        this.isRotationStarting = false
      }
    }
  },
  methods: {
    // 初始化Three.js
    initThreeJS() {
      this.container = this.$refs.containerRef
      
      // 初始化模型中心
      this.modelCenter = new THREE.Vector3(0, 0, 0)
      
      // 创建场景
      this.scene = new THREE.Scene()
      
      // 创建相机
      this.camera = new THREE.PerspectiveCamera(
        75,
        this.container.clientWidth / this.container.clientHeight,
        0.1,
        1000
      )
      this.camera.position.z = 5
      
      // 创建渲染器
      this.renderer = new THREE.WebGLRenderer({ alpha: true })
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
      this.renderer.setClearColor(0x000000, 0)
      this.container.appendChild(this.renderer.domElement)
    },
    
    // 创建粒子系统
    createParticleSystem() {
      // 创建粒子几何体
      const geometry = new THREE.BufferGeometry()
      
      // 初始化粒子位置
      const positions = new Float32Array(this.particleCount * 3)
      const velocities = new Float32Array(this.particleCount * 3)
      const opacities = new Float32Array(this.particleCount)
      const sizes = new Float32Array(this.particleCount)
      
      for (let i = 0; i < this.particleCount; i++) {
        // 创建围绕模型中心的球形分布粒子
        const radius = Math.random() * 2 + 0.5
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)
        
        const x = this.modelCenter.x + radius * Math.sin(phi) * Math.cos(theta)
        const y = this.modelCenter.y + radius * Math.sin(phi) * Math.sin(theta)
        const z = this.modelCenter.z + radius * Math.cos(phi)
        
        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z
        
        // 初始化速度
        velocities[i * 3] = (Math.random() - 0.5) * 0.01
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01
        
        // 初始化透明度
        opacities[i] = Math.random() * 0.5 + 0.3
        
        // 初始化大小
        sizes[i] = Math.random() * this.particleSize + this.particleSize * 0.5
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
      
      // 创建粒子材质
      const material = new THREE.PointsMaterial({
        color: new THREE.Color(this.particleColor),
        size: this.particleSize,
        transparent: true,
        opacity: this.particleOpacity,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      })
      
      // 创建粒子系统
      this.particleSystem = new THREE.Points(geometry, material)
      this.scene.add(this.particleSystem)
      
      // 保存粒子数据
      this.particlePositions = positions
      this.particleVelocities = velocities
      this.particleOpacities = opacities
      this.particleSizes = sizes
    },
    
    // 开始动画
    startAnimation() {
      if (this.isRunning) return
      
      this.isRunning = true
      this.animate()
    },
    
    // 停止动画
    stopAnimation() {
      if (!this.isRunning) return
      
      this.isRunning = false
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }
    },
    
    // 动画循环
    animate() {
      if (!this.isRunning) return
      
      this.updateParticles()
      this.updateBurstParticles()
      this.updateTrailParticles()
      this.render()
      
      this.animationId = requestAnimationFrame(this.animate)
    },
    
    // 更新粒子
    updateParticles() {
      const positions = this.particleSystem.geometry.attributes.position.array
      const velocities = this.particleVelocities
      const opacities = this.particleSystem.geometry.attributes.opacity.array
      const sizes = this.particleSystem.geometry.attributes.size.array
      
      for (let i = 0; i < this.particleCount; i++) {
        // 更新位置
        positions[i * 3] += velocities[i * 3]
        positions[i * 3 + 1] += velocities[i * 3 + 1]
        positions[i * 3 + 2] += velocities[i * 3 + 2]
        
        // 围绕模型中心旋转
        const particlePos = new THREE.Vector3(
          positions[i * 3],
          positions[i * 3 + 1],
          positions[i * 3 + 2]
        )
        
        // 计算粒子到模型中心的距离
        const distance = particlePos.distanceTo(this.modelCenter)
        
        // 保持粒子在球形区域内
        if (distance > 2.5) {
          particlePos.normalize().multiplyScalar(2.5)
          positions[i * 3] = particlePos.x
          positions[i * 3 + 1] = particlePos.y
          positions[i * 3 + 2] = particlePos.z
        }
        
        // 旋转时的动态效果
        if (this.isRotating) {
          // 根据旋转速度调整粒子速度
          const speedMultiplier = 1 + this.rotationSpeed * 5
          velocities[i * 3] *= speedMultiplier
          velocities[i * 3 + 1] *= speedMultiplier
          velocities[i * 3 + 2] *= speedMultiplier
          
          // 旋转时增强粒子大小
          sizes[i] = Math.min(
            this.particleSize * 2,
            sizes[i] * (1 + this.rotationSpeed * 2)
          )
          
          // 旋转时增强粒子透明度
          opacities[i] = Math.min(1, opacities[i] * (1 + this.rotationSpeed))
        } else {
          // 旋转停止时恢复粒子状态
          sizes[i] = Math.max(
            this.particleSize * 0.5,
            sizes[i] * 0.99
          )
          
          opacities[i] = Math.max(0.3, opacities[i] * 0.995)
        }
        
        // 粒子速度衰减
        velocities[i * 3] *= 0.99
        velocities[i * 3 + 1] *= 0.99
        velocities[i * 3 + 2] *= 0.99
        
        // 粒子闪烁效果
        opacities[i] += (Math.random() - 0.5) * 0.01
        opacities[i] = Math.max(0.1, Math.min(1, opacities[i]))
      }
      
      // 更新几何体属性
      this.particleSystem.geometry.attributes.position.needsUpdate = true
      this.particleSystem.geometry.attributes.opacity.needsUpdate = true
      this.particleSystem.geometry.attributes.size.needsUpdate = true
    },
    
    // 更新粒子旋转
    updateParticleRotation(rotationDelta) {
      if (!this.particleSystem) return
      
      // 旋转粒子系统
      this.particleSystem.rotation.y += rotationDelta * 0.5
    },
    
    // 创建迸发粒子
    createBurstParticles() {
      const burstCount = Math.min(200, Math.max(50, Math.floor(this.rotationSpeed * 100)))
      
      for (let i = 0; i < burstCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        const speed = Math.random() * 0.1 + 0.05
        
        const direction = new THREE.Vector3(
          Math.sin(phi) * Math.cos(angle),
          Math.sin(phi) * Math.sin(angle),
          Math.cos(phi)
        )
        
        const position = this.modelCenter.clone().add(direction.clone().multiplyScalar(0.5))
        const velocity = direction.clone().multiplyScalar(speed)
        
        this.burstParticles.push({
          position: position,
          velocity: velocity,
          size: Math.random() * this.particleSize * 2 + this.particleSize,
          opacity: Math.random() * 0.5 + 0.5,
          fadeSpeed: Math.random() * 0.02 + 0.01,
          age: 0,
          maxAge: Math.random() * 2 + 1
        })
      }
    },
    
    // 更新迸发粒子
    updateBurstParticles() {
      this.burstParticles = this.burstParticles.filter(particle => {
        // 更新位置
        particle.position.add(particle.velocity)
        
        // 更新速度
        particle.velocity.multiplyScalar(0.95)
        
        // 更新透明度
        particle.opacity -= particle.fadeSpeed
        
        // 更新年龄
        particle.age += 0.016
        
        // 只保留有效的粒子
        return particle.opacity > 0 && particle.age < particle.maxAge
      })
    },
    
    // 更新轨迹粒子
    updateTrailParticles() {
      if (!this.isRotating || !this.enableTrailMode) return
      
      // 定期创建轨迹粒子
      if (Math.random() < 0.1) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 2 + 0.5
        
        const position = new THREE.Vector3(
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 2,
          Math.sin(angle) * radius
        )
        
        this.trailParticles.push({
          position: position,
          opacity: Math.random() * 0.3 + 0.2,
          fadeSpeed: Math.random() * 0.005 + 0.002,
          age: 0,
          maxAge: Math.random() * 3 + 2
        })
      }
      
      // 更新轨迹粒子
      this.trailParticles = this.trailParticles.filter(particle => {
        // 更新透明度
        particle.opacity -= particle.fadeSpeed
        
        // 更新年龄
        particle.age += 0.016
        
        // 只保留有效的粒子
        return particle.opacity > 0 && particle.age < particle.maxAge
      })
    },
    
    // 渲染
    render() {
      if (!this.renderer || !this.scene || !this.camera) return
      
      // 渲染场景
      this.renderer.render(this.scene, this.camera)
      
      // 渲染迸发粒子
      this.renderBurstParticles()
      
      // 渲染轨迹粒子
      this.renderTrailParticles()
    },
    
    // 渲染迸发粒子
    renderBurstParticles() {
      // 这里可以使用Canvas 2D或Three.js的Points来渲染迸发粒子
      // 为了简单起见，我们暂时只使用Three.js的粒子系统
    },
    
    // 渲染轨迹粒子
    renderTrailParticles() {
      // 这里可以使用Canvas 2D或Three.js的Line来渲染轨迹粒子
      // 为了简单起见，我们暂时只使用Three.js的粒子系统
    },
    
    // 处理窗口大小变化
    handleResize() {
      if (!this.camera || !this.renderer || !this.container) return
      
      const width = this.container.clientWidth
      const height = this.container.clientHeight
      
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
      
      this.renderer.setSize(width, height)
    }
  }
}
</script>

<style scoped>
.three-particle-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.particle-container {
  width: 100%;
  height: 100%;
}
</style>