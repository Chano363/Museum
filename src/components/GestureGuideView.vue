<template>
  <div class="gesture-guide-overlay" @click="$emit('close')">
    <div class="gesture-guide-content" @click.stop>
      <button class="close-btn" @click="$emit('close')">
        ×
      </button>
      <h2 class="guide-title">手势操作指南</h2>
      
      <div class="guide-section">
        <h3>基本手势</h3>
        <div class="gesture-grid">
          <div class="gesture-card">
            <div class="gesture-icon">✊</div>
            <h4>拳头</h4>
            <p>锁定或解锁模型旋转</p>
          </div>
          <div class="gesture-card">
            <div class="gesture-icon">🖐️</div>
            <h4>张开手</h4>
            <p>重置模型视角到初始状态</p>
          </div>
          <div class="gesture-card">
            <div class="gesture-icon">👍</div>
            <h4>点赞</h4>
            <p>放大模型视图</p>
          </div>
          <div class="gesture-card">
            <div class="gesture-icon">👎</div>
            <h4>拇指向下</h4>
            <p>缩小模型视图</p>
          </div>
          <div class="gesture-card">
            <div class="gesture-icon">✌️</div>
            <h4>剪刀手</h4>
            <p>切换到下一个文物模型</p>
          </div>
          <div class="gesture-card">
            <div class="gesture-icon">👌</div>
            <h4>OK手势</h4>
            <p>显示当前文物的详细信息</p>
          </div>
        </div>
      </div>
      
      <div class="guide-section">
        <h3>使用提示</h3>
        <ul class="tips-list">
          <li>确保光线充足，让摄像头能够清晰捕捉手部</li>
          <li>保持手部在摄像头视野中央</li>
          <li>手势需要保持1-2秒以确保被识别</li>
          <li>如遇识别困难，可尝试调整摄像头角度</li>
          <li>点击工具栏的摄像头图标可开启/关闭手势控制</li>
        </ul>
      </div>
      
      <div class="guide-section">
        <h3>工具栏功能</h3>
        <div class="toolbar-guide">
          <div class="toolbar-item">
            <span class="toolbar-icon">🔒/🔄</span>
            <span class="toolbar-name">旋转锁定</span>
          </div>
          <div class="toolbar-item">
            <span class="toolbar-icon">🔍+</span>
            <span class="toolbar-name">放大</span>
          </div>
          <div class="toolbar-item">
            <span class="toolbar-icon">🔍-</span>
            <span class="toolbar-name">缩小</span>
          </div>
          <div class="toolbar-item">
            <span class="toolbar-icon">🔄</span>
            <span class="toolbar-name">重置</span>
          </div>
          <div class="toolbar-item">
            <span class="toolbar-icon">📷/📵</span>
            <span class="toolbar-name">摄像头</span>
          </div>
        </div>
      </div>
      
      <div class="guide-footer">
        <button class="start-btn" @click="$emit('close')">
          开始体验
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GestureGuideView',
  emits: ['close']
}
</script>

<style scoped>
.gesture-guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.gesture-guide-content {
  width: 800px;
  max-width: 95vw;
  max-height: 90vh;
  background-color: #f5f1e8;
  border-radius: 15px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.4s ease;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 25px;
  width: 35px;
  height: 35px;
  border: none;
  background-color: transparent;
  font-size: 28px;
  cursor: pointer;
  color: #3c2a1e;
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: scale(1.2);
  color: #8b0000;
}

.guide-title {
  font-size: 2.2rem;
  font-weight: bold;
  color: #3c2a1e;
  text-align: center;
  margin-bottom: 30px;
  font-family: 'PingFang SC', 'Microsoft YaHei', serif;
}

.guide-section {
  margin-bottom: 35px;
}

.guide-section h3 {
  font-size: 1.4rem;
  font-weight: bold;
  color: #3c2a1e;
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(139, 0, 0, 0.2);
  padding-bottom: 10px;
}

.gesture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.gesture-card {
  background-color: rgba(60, 42, 30, 0.05);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(60, 42, 30, 0.1);
}

.gesture-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  background-color: rgba(60, 42, 30, 0.1);
}

.gesture-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.gesture-card h4 {
  font-size: 1.1rem;
  font-weight: bold;
  color: #3c2a1e;
  margin-bottom: 10px;
}

.gesture-card p {
  color: #6b5645;
  font-size: 0.95rem;
  line-height: 1.4;
}

.tips-list {
  color: #6b5645;
  line-height: 1.8;
  margin-left: 20px;
}

.tips-list li {
  margin-bottom: 8px;
  font-size: 1rem;
}

.toolbar-guide {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

.toolbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 20px;
  background-color: rgba(60, 42, 30, 0.05);
  border-radius: 10px;
  min-width: 100px;
  border: 1px solid rgba(60, 42, 30, 0.1);
}

.toolbar-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.toolbar-name {
  color: #3c2a1e;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}

.guide-footer {
  text-align: center;
  margin-top: 40px;
}

.start-btn {
  width: 200px;
  height: 55px;
  font-size: 1.2rem;
  font-weight: bold;
  color: #f5f1e8;
  background-color: #8b0000;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 0, 0, 0.2);
}

.start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(139, 0, 0, 0.3);
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
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 滚动条样式 */
.gesture-guide-content::-webkit-scrollbar {
  width: 8px;
}

.gesture-guide-content::-webkit-scrollbar-track {
  background: rgba(60, 42, 30, 0.1);
  border-radius: 4px;
}

.gesture-guide-content::-webkit-scrollbar-thumb {
  background: rgba(60, 42, 30, 0.3);
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gesture-guide-content {
    padding: 30px 20px;
  }
  
  .guide-title {
    font-size: 1.8rem;
  }
  
  .gesture-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .gesture-card {
    padding: 20px;
  }
  
  .gesture-icon {
    font-size: 40px;
  }
  
  .gesture-card h4 {
    font-size: 1rem;
  }
  
  .gesture-card p {
    font-size: 0.85rem;
  }
  
  .toolbar-item {
    min-width: 80px;
    padding: 12px 15px;
  }
  
  .start-btn {
    width: 180px;
    height: 50px;
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .gesture-guide-content {
    padding: 25px 15px;
  }
  
  .guide-title {
    font-size: 1.6rem;
  }
  
  .gesture-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbar-guide {
    flex-direction: column;
    align-items: center;
  }
  
  .toolbar-item {
    width: 100%;
    max-width: 200px;
  }
}
</style>