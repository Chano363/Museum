<template>
  <div class="particle-effect">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script>
export default {
  name: 'ParticleEffect',
  props: {
    // 粒子数量
    particleCount: {
      type: Number,
      default: 80
    },
    // 粒子大小范围
    particleSize: {
      type: Object,
      default: () => ({ min: 0.5, max: 2 })
    },
    // 粒子速度范围
    particleSpeed: {
      type: Object,
      default: () => ({ min: 0.05, max: 0.3 })
    },
    // 粒子颜色
    particleColor: {
      type: String,
      default: '#C49210'
    },
    // 粒子透明度范围
    opacityRange: {
      type: Object,
      default: () => ({ min: 0.2, max: 0.7 })
    },
    // 粒子闪烁频率
    flickerFrequency: {
      type: Number,
      default: 0.03
    },
    // 是否响应窗口大小变化
    responsive: {
      type: Boolean,
      default: true
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
      canvas: null,
      ctx: null,
      particles: [],
      burstParticles: [], // 迸发粒子
      trailParticles: [], // 轨迹粒子
      animationId: null,
      isRunning: false,
      lastRotationState: 0,
      isRotationStarting: false,
      rotationStartTime: 0
    }
  },
  mounted() {
    this.initCanvas()
    this.createParticles()
    this.startAnimation()
    
    if (this.responsive) {
      window.addEventListener('resize', this.handleResize)
    }
  },
  beforeUnmount() {
    this.stopAnimation()
    
    if (this.responsive) {
      window.removeEventListener('resize', this.handleResize)
    }
  },
  methods: {
    initCanvas() {
      this.canvas = this.$refs.canvasRef
      this.ctx = this.canvas.getContext('2d')
      this.resizeCanvas()
    },
    resizeCanvas() {
      const container = this.$el
      this.canvas.width = container.clientWidth
      this.canvas.height = container.clientHeight
    },
    createParticles() {
      this.particles = []
      const centerX = this.canvas.width / 2
      const centerY = this.canvas.height / 2
      
      for (let i = 0; i < this.particleCount; i++) {
        // 围绕中心创建粒子
        const radius = this.getRandomValue(50, Math.min(this.canvas.width, this.canvas.height) * 0.4)
        const angle = Math.random() * Math.PI * 2
        const distance = radius
        
        this.particles.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          size: this.getRandomValue(this.particleSize.min, this.particleSize.max),
          speed: this.getRandomValue(this.particleSpeed.min, this.particleSpeed.max),
          opacity: this.getRandomValue(this.opacityRange.min, this.opacityRange.max),
          flickerSpeed: this.getRandomValue(0.01, 0.03),
          baseOpacity: this.getRandomValue(this.opacityRange.min, this.opacityRange.max),
          angle: angle,
          distance: distance,
          orbitSpeed: this.getRandomValue(0.001, 0.003),
          centerX: centerX,
          centerY: centerY
        })
      }
    },
    startAnimation() {
      if (this.isRunning) return
      
      this.isRunning = true
      this.animate()
    },
    stopAnimation() {
      if (!this.isRunning) return
      
      this.isRunning = false
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }
    },
    animate() {
      if (!this.isRunning) return
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      
      // 检测旋转状态变化
      this.detectRotationState()
      
      // 更新和绘制基础粒子
      this.particles.forEach(particle => {
        this.updateParticle(particle)
        this.drawParticle(particle)
      })
      
      // 更新和绘制迸发粒子
      this.updateBurstParticles()
      this.drawBurstParticles()
      
      // 更新和绘制轨迹粒子
      this.updateTrailParticles()
      this.drawTrailParticles()
      
      this.animationId = requestAnimationFrame(this.animate)
    },
    
    // 检测旋转状态变化
    detectRotationState() {
      // 检测旋转开始
      if (this.isRotating && !this.isRotationStarting) {
        this.isRotationStarting = true
        this.rotationStartTime = performance.now()
        this.createBurstParticles()
      }
      
      // 检测旋转停止
      if (!this.isRotating && this.isRotationStarting) {
        this.isRotationStarting = false
      }
      
      // 记录最后旋转状态
      this.lastRotationState = this.modelRotation
    },
    
    // 创建迸发粒子
    createBurstParticles() {
      const centerX = this.canvas.width / 2
      const centerY = this.canvas.height / 2
      const burstCount = Math.min(30, Math.max(10, Math.floor(this.rotationSpeed * 50)))
      
      for (let i = 0; i < burstCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = this.getRandomValue(2, 5)
        const size = this.getRandomValue(0.5, 1.5)
        
        this.burstParticles.push({
          x: centerX,
          y: centerY,
          size: size,
          speedX: Math.cos(angle) * speed,
          speedY: Math.sin(angle) * speed,
          opacity: this.getRandomValue(0.6, 1),
          fadeSpeed: this.getRandomValue(0.01, 0.03),
          color: this.particleColor
        })
      }
    },
    
    // 更新迸发粒子
    updateBurstParticles() {
      this.burstParticles = this.burstParticles.filter(particle => {
        // 更新位置
        particle.x += particle.speedX
        particle.y += particle.speedY
        
        // 应用重力
        particle.speedY += 0.1
        
        // 衰减速度
        particle.speedX *= 0.95
        particle.speedY *= 0.95
        
        // 衰减透明度
        particle.opacity -= particle.fadeSpeed
        
        // 只保留透明度大于0的粒子
        return particle.opacity > 0
      })
    },
    
    // 绘制迸发粒子
    drawBurstParticles() {
      this.burstParticles.forEach(particle => {
        this.ctx.save()
        this.ctx.globalAlpha = particle.opacity
        this.ctx.fillStyle = particle.color
        this.ctx.beginPath()
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        this.ctx.fill()
        
        // 添加发光效果
        this.ctx.shadowBlur = 8
        this.ctx.shadowColor = particle.color
        this.ctx.fill()
        this.ctx.restore()
      })
    },
    
    // 创建轨迹粒子
    createTrailParticle() {
      if (!this.isRotating) return
      
      const centerX = this.canvas.width / 2
      const centerY = this.canvas.height / 2
      const radius = this.getRandomValue(50, Math.min(this.canvas.width, this.canvas.height) * 0.4)
      const angle = this.modelRotation * 10 // 将旋转状态映射到角度
      
      this.trailParticles.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        size: this.getRandomValue(0.3, 1),
        opacity: this.getRandomValue(0.3, 0.7),
        fadeSpeed: this.getRandomValue(0.005, 0.01),
        color: this.particleColor
      })
    },
    
    // 更新轨迹粒子
    updateTrailParticles() {
      // 定期创建轨迹粒子
      if (this.isRotating && Math.random() < 0.3) {
        this.createTrailParticle()
      }
      
      // 更新现有轨迹粒子
      this.trailParticles = this.trailParticles.filter(particle => {
        // 衰减透明度
        particle.opacity -= particle.fadeSpeed
        
        // 只保留透明度大于0的粒子
        return particle.opacity > 0
      })
      
      // 限制轨迹粒子数量
      if (this.trailParticles.length > 100) {
        this.trailParticles = this.trailParticles.slice(-100)
      }
    },
    
    // 绘制轨迹粒子
    drawTrailParticles() {
      this.trailParticles.forEach(particle => {
        this.ctx.save()
        this.ctx.globalAlpha = particle.opacity
        this.ctx.fillStyle = particle.color
        this.ctx.beginPath()
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.restore()
      })
    },
    updateParticle(particle) {
      // 响应模型旋转，调整粒子角度
      const modelRotationInfluence = this.modelRotation * 0.01
      
      // 根据旋转速度调整粒子轨道速度
      const speedMultiplier = this.isRotating ? (1 + this.rotationSpeed * 10) : 1
      
      // 更新粒子轨道角度
      particle.angle += (particle.orbitSpeed + modelRotationInfluence * 0.5) * speedMultiplier
      
      // 计算新位置（围绕中心旋转）
      particle.x = particle.centerX + Math.cos(particle.angle) * particle.distance
      particle.y = particle.centerY + Math.sin(particle.angle) * particle.distance
      
      // 旋转时的粒子动态效果
      if (this.isRotating) {
        // 根据旋转速度调整粒子距离
        const distanceVariation = Math.sin(Date.now() * 0.01) * 2 * this.rotationSpeed
        particle.distance += distanceVariation
        // 限制距离范围
        particle.distance = Math.max(30, Math.min(Math.min(this.canvas.width, this.canvas.height) * 0.4, particle.distance))
      } else {
        // 旋转停止时的轻微随机偏移
        if (Math.random() < 0.1) {
          particle.distance += this.getRandomValue(-2, 2)
          // 限制距离范围
          particle.distance = Math.max(30, Math.min(Math.min(this.canvas.width, this.canvas.height) * 0.4, particle.distance))
        }
      }
      
      // 闪烁效果，旋转时增强
      const flickerMultiplier = this.isRotating ? (1 + this.rotationSpeed * 5) : 1
      particle.opacity = particle.baseOpacity + Math.sin(Date.now() * particle.flickerSpeed * flickerMultiplier) * 0.3
      particle.opacity = Math.max(this.opacityRange.min, Math.min(this.opacityRange.max, particle.opacity))
    },
    drawParticle(particle) {
      this.ctx.save()
      this.ctx.globalAlpha = particle.opacity
      this.ctx.fillStyle = this.particleColor
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      this.ctx.fill()
      
      // 添加发光效果
      this.ctx.shadowBlur = 10
      this.ctx.shadowColor = this.particleColor
      this.ctx.fill()
      this.ctx.restore()
    },
    getRandomValue(min, max) {
      return Math.random() * (max - min) + min
    },
    handleResize() {
      this.resizeCanvas()
      // 重新创建粒子以适应新的画布大小
      this.createParticles()
    }
  }
}
</script>

<style scoped>
.particle-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>