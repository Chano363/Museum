<template>
  <div class="about-view-overlay" @click="$emit('close')">
    <div class="about-view" @click.stop>
      <button class="close-btn" @click="$emit('close')">
        ×
      </button>
      <div class="about-content">
        <div class="about-header">
          <div class="app-icon">🏛️</div>
          <h2 class="app-title">探古</h2>
          <p class="app-version">版本 1.0.0</p>
        </div>
        
        <div class="about-section">
          <h3>关于探古</h3>
          <p>探古是一款基于现代Web技术开发的文物3D交互展示系统，旨在通过沉浸式体验让用户感受历史文物的魅力。</p>
        </div>
        
        <div class="about-section">
          <h3>核心功能</h3>
          <ul class="feature-list">
            <li>• 3D文物模型交互展示</li>
            <li>• 手势识别控制</li>
            <li>• 多视角观察</li>
            <li>• 文物信息详情</li>
            <li>• 响应式设计，支持多设备</li>
          </ul>
        </div>
        
        <div class="about-section">
          <h3>技术栈</h3>
          <div class="tech-stack">
            <span class="tech-tag">Vue 3</span>
            <span class="tech-tag">Three.js</span>
            <span class="tech-tag">TensorFlow.js</span>
            <span class="tech-tag">Howler.js</span>
            <span class="tech-tag">ONNX Runtime</span>
          </div>
        </div>
        
        <div class="about-footer">
          <p>© 2026 探古团队</p>
          <p>保留所有权利</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutView',
  emits: ['close']
}
</script>

<style scoped>
.about-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.about-view {
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  background-color: #f2f2f2;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
  overflow-y: auto;
  position: relative;
  font-family: var(--font-family);
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  width: 30px;
  height: 30px;
  border: none;
  background-color: transparent;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: scale(1.2);
  color: var(--text-color);
}

.about-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(196, 146, 16, 0.2);
}

.app-icon {
  font-size: 60px;
  margin-bottom: 15px;
}

.app-title {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 10px;
}

.app-version {
  color: #666;
  font-size: 1rem;
}

.about-section {
  margin-bottom: 25px;
}

.about-section h3 {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 10px;
}

.about-section p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.feature-list {
  color: #666;
  line-height: 1.8;
  margin-left: 10px;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tech-tag {
  padding: 5px 12px;
  background-color: rgba(196, 146, 16, 0.1);
  color: var(--text-color);
  border-radius: 15px;
  font-size: 0.9rem;
  border: 1px solid rgba(196, 146, 16, 0.2);
}

.about-footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(196, 146, 16, 0.2);
  color: #666;
  font-size: 0.9rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 滚动条样式 */
.about-view::-webkit-scrollbar {
  width: 6px;
}

.about-view::-webkit-scrollbar-track {
  background: rgba(196, 146, 16, 0.1);
  border-radius: 3px;
}

.about-view::-webkit-scrollbar-thumb {
  background: rgba(196, 146, 16, 0.3);
  border-radius: 3px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .about-view {
    width: 95vw;
    padding: 20px;
  }
  
  .app-icon {
    font-size: 50px;
  }
  
  .app-title {
    font-size: 1.8rem;
  }
  
  .about-section {
    margin-bottom: 20px;
  }
}
</style>