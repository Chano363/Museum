<template>
  <div class="welcome-view">
    <div class="welcome-bg"></div>
    <div class="welcome-content">
      <h1 class="app-title">探古</h1>
      <p class="app-subtitle">文物3D交互展示系统</p>
      <button class="enter-btn" @click="$emit('enter')">
        进入博物馆
      </button>
      <button class="gesture-btn" @click="showGestureGuide = true">
        手势教学
      </button>
    </div>
    
    <!-- 手势教学弹窗 -->
    <GestureGuideView v-if="showGestureGuide" @close="showGestureGuide = false" />
  </div>
</template>

<script>
import GestureGuideView from './GestureGuideView.vue'

export default {
  name: 'WelcomeView',
  components: {
    GestureGuideView
  },
  emits: ['enter'],
  data() {
    return {
      showGestureGuide: false
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
  background-color: #000000;
}

.welcome-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #000000;
  z-index: 1;
}

.welcome-content {
  text-align: center;
  animation: fadeIn 1.5s ease-in-out;
  position: relative;
  z-index: 10;
  max-width: 600px;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.app-title {
  font-size: 7rem;
  font-weight: normal;
  color: #C49210;
  margin-bottom: 1.5rem;
  font-family: 'HanChan', var(--font-family);
}

.app-subtitle {
  font-size: 2rem;
  color: #FFFFFF;
  margin-bottom: 5rem;
  font-weight: normal;
  font-family: 'ChillHuoKai', var(--font-family);
}

.enter-btn {
  font-size: 2rem;
  font-weight: normal;
  color: #FFFFFF;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 2.5rem;
  font-family: 'ChillHuoKai', var(--font-family);
  padding: 0;
}

.enter-btn:hover {
  transform: scale(1.05);
}

.gesture-btn {
  font-size: 1.5rem;
  color: #C49210;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'ChillHuoKai', var(--font-family);
  padding: 0;
}

.gesture-btn:hover {
  transform: scale(1.05);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .app-title {
    font-size: 5rem;
  }
  
  .app-subtitle {
    font-size: 1.5rem;
    margin-bottom: 4rem;
  }
  
  .enter-btn {
    font-size: 1.5rem;
  }
  
  .gesture-btn {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 3.5rem;
  }
  
  .app-subtitle {
    font-size: 1.2rem;
    margin-bottom: 3rem;
  }
  
  .enter-btn {
    font-size: 1.3rem;
  }
  
  .gesture-btn {
    font-size: 1rem;
  }
}
</style>
