<template>
  <div class="welcome-view">
    <div class="welcome-bg"></div>
    <div class="welcome-content">
      <h1 class="app-title">探古</h1>
      <p class="app-subtitle">文物3D交互展示系统</p>
      <div class="welcome-description">
        <p>通过手势交互，探索文物的历史与美学</p>
        <p>感受传统文化的魅力与智慧</p>
      </div>
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
}

.welcome-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f5f1e8 0%, #e8dfd0 100%);
  z-index: 1;
}

.welcome-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none" stroke="%23d1c4b0" stroke-width="0.5" stroke-opacity="0.3"/></svg>');
  opacity: 0.3;
  z-index: 2;
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
}

.app-title {
  font-size: 5rem;
  font-weight: bold;
  color: #3c2a1e;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'PingFang SC', 'Microsoft YaHei', serif;
}

.app-subtitle {
  font-size: 1.5rem;
  color: #6b5645;
  margin-bottom: 2rem;
  font-weight: 500;
}

.welcome-description {
  margin-bottom: 3rem;
  line-height: 1.6;
  color: #5a4535;
}

.welcome-description p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.enter-btn {
  width: 220px;
  height: 65px;
  font-size: 1.3rem;
  font-weight: bold;
  color: #f5f1e8;
  background-color: #8b0000; /* 朱砂红 */
  border: none;
  border-radius: 35px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(139, 0, 0, 0.2);
}

.enter-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(139, 0, 0, 0.3);
}

.gesture-btn {
  width: 160px;
  height: 45px;
  font-size: 1.1rem;
  color: #3c2a1e;
  background-color: transparent;
  border: 2px solid #3c2a1e;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.gesture-btn:hover {
  background-color: rgba(60, 42, 30, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
    font-size: 3.5rem;
  }
  
  .app-subtitle {
    font-size: 1.2rem;
  }
  
  .welcome-description p {
    font-size: 1rem;
  }
  
  .enter-btn {
    width: 180px;
    height: 55px;
    font-size: 1.1rem;
  }
  
  .gesture-btn {
    width: 140px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>
