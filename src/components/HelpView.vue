<template>
  <div class="help-view-overlay" @click="$emit('close')">
    <div class="help-view" @click.stop>
      <button class="close-btn" @click="$emit('close')">×</button>
      <h2 class="help-title">使用帮助</h2>
      
      <div class="help-section">
        <h3>基本操作</h3>
        <div class="operation-grid">
          <div class="operation-item">
            <span class="op-icon">🖱️</span>
            <div class="op-info">
              <strong>鼠标</strong>
              <p>拖拽旋转 / 滚轮缩放</p>
            </div>
          </div>
          <div class="operation-item">
            <span class="op-icon">👆</span>
            <div class="op-info">
              <strong>触摸</strong>
              <p>单指旋转 / 双指缩放</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="help-section">
        <h3>工具栏</h3>
        <div class="toolbar-grid">
          <div class="toolbar-item">
            <span>📷</span>
            <p>摄像头开关</p>
          </div>
          <div class="toolbar-item">
            <span>🔄</span>
            <p>切换展品</p>
          </div>
          <div class="toolbar-item">
            <span>⚙️</span>
            <p>系统设置</p>
          </div>
          <div class="toolbar-item">
            <span>🏠</span>
            <p>返回首页</p>
          </div>
        </div>
      </div>
      
      <div class="help-section">
        <h3>常见问题</h3>
        <div class="faq-list">
          <div class="faq-item">
            <strong>摄像头无法打开？</strong>
            <p>请检查浏览器摄像头权限设置</p>
          </div>
          <div class="faq-item">
            <strong>手势识别不灵敏？</strong>
            <p>确保光线充足，手部在画面中央</p>
          </div>
          <div class="faq-item">
            <strong>模型加载失败？</strong>
            <p>检查网络连接后刷新页面</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelpView',
  emits: ['close']
}
</script>

<style scoped>
.help-view-overlay {
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
}

.help-view {
  width: 550px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  background-color: #f2f2f2;
  border-radius: 15px;
  padding: 35px;
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
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-color);
}

.help-title {
  font-size: 2.8rem;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 35px;
}

.help-section {
  margin-bottom: 35px;
}

.help-section h3 {
  font-size: 1.7rem;
  color: var(--text-color);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(196, 146, 16, 0.2);
}

.operation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.operation-item {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px;
  background: rgba(196, 146, 16, 0.05);
  border-radius: 10px;
}

.op-icon {
  font-size: 40px;
}

.op-info strong {
  display: block;
  color: var(--text-color);
  font-size: 1.5rem;
}

.op-info p {
  color: #444;
  font-size: 1.3rem;
  margin: 0;
}

.toolbar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.toolbar-item {
  text-align: center;
  padding: 18px 12px;
  background: rgba(196, 146, 16, 0.05);
  border-radius: 10px;
}

.toolbar-item span {
  font-size: 40px;
  display: block;
  margin-bottom: 10px;
}

.toolbar-item p {
  font-size: 1.2rem;
  color: #444;
  margin: 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.faq-item {
  padding: 18px;
  background: rgba(196, 146, 16, 0.05);
  border-radius: 10px;
}

.faq-item strong {
  display: block;
  color: var(--text-color);
  font-size: 1.3rem;
  margin-bottom: 8px;
}

.faq-item p {
  color: #444;
  font-size: 1.25rem;
  margin: 0;
}

@media (max-width: 400px) {
  .operation-grid,
  .toolbar-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
