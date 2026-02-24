<template>
  <div class="gesture-guide-overlay" @click="$emit('close')">
    <div class="gesture-guide-content" @click.stop>
      <button class="close-btn" @click="$emit('close')">×</button>
      <h2 class="guide-title">手势操作指南</h2>
      
      <div class="gesture-grid">
        <div class="gesture-card">
          <div class="gesture-icon">👍</div>
          <h4>点赞</h4>
          <p>放大模型</p>
        </div>
        <div class="gesture-card">
          <div class="gesture-icon">👎</div>
          <h4>点踩</h4>
          <p>缩小模型</p>
        </div>
        <div class="gesture-card">
          <div class="gesture-icon">🖐️</div>
          <h4>手掌</h4>
          <p>旋转模型</p>
        </div>
        <div class="gesture-card">
          <div class="gesture-icon">👉</div>
          <h4>指向</h4>
          <p>旋转模型</p>
        </div>
      </div>
      
      <div class="tips-section">
        <h3>使用提示</h3>
        <ul>
          <li>确保光线充足，手部在摄像头视野中央</li>
          <li>放大/缩小手势需保持稳定约1秒触发</li>
          <li>旋转手势响应快，移动手掌即可控制</li>
        </ul>
      </div>
      
      <button class="start-btn" @click="$emit('close')">开始体验</button>
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
}

.gesture-guide-content {
  width: 600px;
  max-width: 90vw;
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

.guide-title {
  font-size: 2.8rem;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 35px;
}

.gesture-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 35px;
}

.gesture-card {
  background: rgba(196, 146, 16, 0.08);
  border-radius: 12px;
  padding: 30px 15px;
  text-align: center;
}

.gesture-icon {
  font-size: 56px;
  margin-bottom: 18px;
}

.gesture-card h4 {
  font-size: 1.6rem;
  color: var(--text-color);
  margin-bottom: 10px;
}

.gesture-card p {
  font-size: 1.3rem;
  color: #555;
  margin: 0;
}

.tips-section {
  background: rgba(196, 146, 16, 0.05);
  border-radius: 12px;
  padding: 25px 30px;
  margin-bottom: 30px;
}

.tips-section h3 {
  font-size: 1.6rem;
  color: var(--text-color);
  margin-bottom: 18px;
}

.tips-section ul {
  margin: 0;
  padding-left: 30px;
  color: #444;
  font-size: 1.3rem;
  line-height: 2.2;
}

.start-btn {
  display: block;
  width: 100%;
  padding: 18px;
  background: var(--text-color);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 1.5rem;
  cursor: pointer;
  font-family: var(--font-family);
}

.start-btn:hover {
  opacity: 0.9;
}

@media (max-width: 500px) {
  .gesture-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
