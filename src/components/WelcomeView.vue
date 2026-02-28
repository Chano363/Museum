<template>
  <div class="welcome-view">
    <div class="welcome-bg">
      <div class="particles">
        <div v-for="n in 20" :key="n" class="particle" :style="getParticleStyle(n)"></div>
      </div>
    </div>
    
    <div class="welcome-content">
      <div class="logo-section">
        <h1 class="app-title">探古</h1>
        <p class="app-subtitle">博物馆文物3D交互展示系统</p>
      </div>
      
      <div class="feature-cards">
        <div class="feature-card museum-card" @click="$emit('enter-museum')">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <div class="card-content">
            <h3>进入博物馆</h3>
            <p>浏览青铜器藏品，手势交互体验</p>
          </div>
          <div class="card-arrow">→</div>
        </div>
        
        <div class="feature-card sketch-card" @click="$emit('enter-sketch')">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/>
            </svg>
          </div>
          <div class="card-content">
            <h3>青铜绘境</h3>
            <p>绘制草图，AI生成青铜器纹理</p>
          </div>
          <div class="card-arrow">→</div>
        </div>
        
        <div class="feature-card gallery-card" @click="$emit('enter-user-gallery')">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/>
            </svg>
          </div>
          <div class="card-content">
            <h3>我的作品</h3>
            <p>查看已创作的纹理作品</p>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>
      
      <div class="bottom-actions">
        <button class="gesture-btn" @click="showGestureGuide = true">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M10.5 2C8.5 2 7 3.5 7 5.5v7.41l-2.09-2.09c-.78-.78-2.05-.78-2.82 0-.78.78-.78 2.05 0 2.83l5.5 5.5c.78.78 2.05.78 2.83 0l5.5-5.5c.78-.78.78-2.05 0-2.83-.78-.78-2.05-.78-2.83 0L11 12.91V5.5c0-1.1-.9-2-2-2-.55 0-1.05.22-1.41.59-.36.36-.59.86-.59 1.41v7.41l-2.09-2.09c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l5.5 5.5c.39.39 1.02.39 1.41 0l5.5-5.5c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L11 12.91V5.5c0-.55-.22-1.05-.59-1.41C10.05 3.72 9.55 3.5 9 3.5s-1.05.22-1.41.59C7.22 4.45 7 4.95 7 5.5"/>
          </svg>
          手势教学
        </button>
        <button class="help-btn" @click="showHelp = true">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
          </svg>
          使用帮助
        </button>
      </div>
    </div>
    
    <GestureGuideView v-if="showGestureGuide" @close="showGestureGuide = false" />
    <HelpView v-if="showHelp" @close="showHelp = false" />
  </div>
</template>

<script>
import GestureGuideView from './GestureGuideView.vue'
import HelpView from './HelpView.vue'

export default {
  name: 'WelcomeView',
  components: {
    GestureGuideView,
    HelpView
  },
  emits: ['enter-museum', 'enter-sketch', 'enter-user-gallery'],
  data() {
    return {
      showGestureGuide: false,
      showHelp: false
    }
  },
  methods: {
    getParticleStyle(n) {
      const size = Math.random() * 4 + 2
      const left = Math.random() * 100
      const delay = Math.random() * 5
      const duration = Math.random() * 10 + 10
      
      return {
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }
    }
  }
}
</script>

<style scoped>
.welcome-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
}

.welcome-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  bottom: -10px;
  background: radial-gradient(circle, rgba(196, 146, 16, 0.6) 0%, transparent 70%);
  border-radius: 50%;
  animation: floatUp linear infinite;
}

@keyframes floatUp {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(720deg);
    opacity: 0;
  }
}

.welcome-content {
  text-align: center;
  position: relative;
  z-index: 10;
  max-width: 800px;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 1s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-section {
  margin-bottom: 60px;
}

.logo-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #C49210 0%, #8B6914 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #1a1a1a;
  font-family: 'HanChan', serif;
  box-shadow: 0 10px 40px rgba(196, 146, 16, 0.3);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 10px 40px rgba(196, 146, 16, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 15px 50px rgba(196, 146, 16, 0.5);
  }
}

.app-title {
  font-size: 5rem;
  font-weight: normal;
  color: #C49210;
  margin-bottom: 10px;
  font-family: 'HanChan', var(--font-family);
  text-shadow: 0 0 40px rgba(196, 146, 16, 0.3);
}

.app-subtitle {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: normal;
  font-family: 'ChillHuoKai', var(--font-family);
}

.feature-cards {
  display: flex;
  gap: 24px;
  margin-bottom: 50px;
  width: 100%;
  justify-content: center;
}

.feature-card {
  flex: 1;
  max-width: 320px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(196, 146, 16, 0.2);
  border-radius: 16px;
  padding: 30px 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(196, 146, 16, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.4s;
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: rgba(196, 146, 16, 0.5);
  box-shadow: 0 20px 60px rgba(196, 146, 16, 0.2);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-card:active {
  transform: translateY(-4px);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--text-color, #C49210);
}

.card-icon svg {
  width: 48px;
  height: 48px;
}

.card-content h3 {
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 8px;
  font-family: 'ChillHuoKai', var(--font-family);
}

.card-content p {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

.card-arrow {
  position: absolute;
  right: 20px;
  bottom: 20px;
  font-size: 24px;
  color: rgba(196, 146, 16, 0.5);
  transition: all 0.3s;
}

.feature-card:hover .card-arrow {
  color: #C49210;
  transform: translateX(5px);
}

.new-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: linear-gradient(135deg, #C49210 0%, #f0d695 100%);
  color: #1a1a1a;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: bold;
}

.sketch-card {
  border-color: rgba(196, 146, 16, 0.3);
}

.bottom-actions {
  display: flex;
  gap: 20px;
}

.gesture-btn, .help-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'ChillHuoKai', var(--font-family);
}

.gesture-btn:hover, .help-btn:hover {
  color: #C49210;
  border-color: rgba(196, 146, 16, 0.3);
  background: rgba(196, 146, 16, 0.05);
}

.btn-icon {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .app-title {
    font-size: 3.5rem;
  }
  
  .app-subtitle {
    font-size: 1.2rem;
  }
  
  .feature-cards {
    flex-direction: column;
    align-items: center;
  }
  
  .feature-card {
    max-width: 100%;
    width: 100%;
    max-width: 320px;
  }
  
  .logo-icon {
    width: 80px;
    height: 80px;
    font-size: 36px;
  }
  
  .logo-section {
    margin-bottom: 40px;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 2.8rem;
  }
  
  .app-subtitle {
    font-size: 1rem;
  }
  
  .feature-card {
    padding: 24px 20px;
  }
  
  .card-content h3 {
    font-size: 1.3rem;
  }
  
  .bottom-actions {
    flex-direction: column;
    width: 100%;
    max-width: 280px;
  }
  
  .gesture-btn, .help-btn {
    justify-content: center;
  }
}
</style>
