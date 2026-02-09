<template>
  <div class="help-view-overlay" @click="$emit('close')">
    <div class="help-view" @click.stop>
      <button class="close-btn" @click="$emit('close')">
        ×
      </button>
      <div class="help-content">
        <div class="help-header">
          <div class="help-icon">❓</div>
          <h2 class="help-title">使用帮助</h2>
        </div>
        
        <div class="help-section">
          <h3>基本操作</h3>
          <div class="help-item">
            <div class="help-icon-small">🖱️</div>
            <div class="help-text">
              <strong>鼠标操作</strong>
              <p>• 拖拽：旋转模型</p>
              <p>• 滚轮：缩放模型</p>
              <p>• 点击：选择功能</p>
            </div>
          </div>
          
          <div class="help-item">
            <div class="help-icon-small">👆</div>
            <div class="help-text">
              <strong>触摸操作</strong>
              <p>• 单指拖拽：旋转模型</p>
              <p>• 双指捏合：缩放模型</p>
              <p>• 点击：选择功能</p>
            </div>
          </div>
        </div>
        
        <div class="help-section">
          <h3>手势控制</h3>
          <div class="gesture-guide">
            <div class="gesture-item">
              <div class="gesture-icon">✊</div>
              <div class="gesture-info">
                <strong>拳头</strong>
                <p>锁定/解锁模型旋转</p>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon">🖐️</div>
              <div class="gesture-info">
                <strong>张开手</strong>
                <p>重置模型视角</p>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon">👍</div>
              <div class="gesture-info">
                <strong>点赞</strong>
                <p>放大模型</p>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon">👎</div>
              <div class="gesture-info">
                <strong>拇指向下</strong>
                <p>缩小模型</p>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon">✌️</div>
              <div class="gesture-info">
                <strong>剪刀手</strong>
                <p>切换到下一个模型</p>
              </div>
            </div>
            <div class="gesture-item">
              <div class="gesture-icon">👌</div>
              <div class="gesture-info">
                <strong>OK手势</strong>
                <p>显示模型信息</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="help-section">
          <h3>工具栏功能</h3>
          <div class="toolbar-guide">
            <div class="toolbar-item">
              <div class="toolbar-icon">🔒/🔄</div>
              <div class="toolbar-info">
                <strong>旋转锁定</strong>
                <p>锁定或解锁模型自动旋转</p>
              </div>
            </div>
            <div class="toolbar-item">
              <div class="toolbar-icon">🔍+</div>
              <div class="toolbar-info">
                <strong>放大</strong>
                <p>放大模型视图</p>
              </div>
            </div>
            <div class="toolbar-item">
              <div class="toolbar-icon">🔍-</div>
              <div class="toolbar-info">
                <strong>缩小</strong>
                <p>缩小模型视图</p>
              </div>
            </div>
            <div class="toolbar-item">
              <div class="toolbar-icon">🔄</div>
              <div class="toolbar-info">
                <strong>重置</strong>
                <p>重置模型视角</p>
              </div>
            </div>
            <div class="toolbar-item">
              <div class="toolbar-icon">📷/📵</div>
              <div class="toolbar-info">
                <strong>摄像头</strong>
                <p>开启或关闭摄像头</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="help-section">
          <h3>常见问题</h3>
          <div class="faq">
            <div class="faq-item">
              <strong>Q: 为什么摄像头无法打开？</strong>
              <p>A: 请检查是否已授予摄像头权限，确保浏览器支持摄像头访问。</p>
            </div>
            <div class="faq-item">
              <strong>Q: 手势控制不工作怎么办？</strong>
              <p>A: 请确保光线充足，手部在摄像头视野内，并且已开启摄像头。</p>
            </div>
            <div class="faq-item">
              <strong>Q: 模型加载失败怎么解决？</strong>
              <p>A: 请检查网络连接，刷新页面后重试。</p>
            </div>
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.help-view {
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  background-color: #f5f1e8; /* 宣纸米白 */
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
  overflow-y: auto;
  position: relative;
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
  color: #3c2a1e;
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: scale(1.2);
  color: #8b0000; /* 朱砂红 */
}

.help-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(60, 42, 30, 0.2);
}

.help-icon {
  font-size: 60px;
  margin-bottom: 15px;
}

.help-title {
  font-size: 2rem;
  font-weight: bold;
  color: #3c2a1e;
}

.help-section {
  margin-bottom: 30px;
}

.help-section h3 {
  font-size: 1.2rem;
  font-weight: bold;
  color: #3c2a1e;
  margin-bottom: 15px;
}

.help-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 15px;
  background-color: rgba(60, 42, 30, 0.05);
  border-radius: 8px;
}

.help-icon-small {
  font-size: 24px;
  margin-right: 15px;
  min-width: 30px;
}

.help-text {
  flex: 1;
}

.help-text strong {
  display: block;
  color: #3c2a1e;
  margin-bottom: 5px;
}

.help-text p {
  color: #6b5645;
  margin-bottom: 3px;
  font-size: 0.95rem;
}

.gesture-guide {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.gesture-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: rgba(60, 42, 30, 0.05);
  border-radius: 8px;
}

.gesture-icon {
  font-size: 32px;
  margin-right: 15px;
  min-width: 40px;
}

.gesture-info strong {
  display: block;
  color: #3c2a1e;
  margin-bottom: 3px;
}

.gesture-info p {
  color: #6b5645;
  font-size: 0.9rem;
  margin: 0;
}

.toolbar-guide {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}

.toolbar-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: rgba(60, 42, 30, 0.05);
  border-radius: 8px;
}

.toolbar-icon {
  font-size: 20px;
  margin-right: 12px;
  min-width: 35px;
  text-align: center;
}

.toolbar-info strong {
  display: block;
  color: #3c2a1e;
  margin-bottom: 2px;
  font-size: 0.95rem;
}

.toolbar-info p {
  color: #6b5645;
  font-size: 0.85rem;
  margin: 0;
}

.faq {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.faq-item {
  padding: 15px;
  background-color: rgba(60, 42, 30, 0.05);
  border-radius: 8px;
}

.faq-item strong {
  display: block;
  color: #3c2a1e;
  margin-bottom: 5px;
}

.faq-item p {
  color: #6b5645;
  margin: 0;
  font-size: 0.95rem;
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
.help-view::-webkit-scrollbar {
  width: 6px;
}

.help-view::-webkit-scrollbar-track {
  background: rgba(60, 42, 30, 0.1);
  border-radius: 3px;
}

.help-view::-webkit-scrollbar-thumb {
  background: rgba(60, 42, 30, 0.3);
  border-radius: 3px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .help-view {
    width: 95vw;
    padding: 20px;
  }
  
  .help-icon {
    font-size: 50px;
  }
  
  .help-title {
    font-size: 1.8rem;
  }
  
  .gesture-guide,
  .toolbar-guide {
    grid-template-columns: 1fr;
  }
  
  .help-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .help-icon-small {
    margin-bottom: 10px;
  }
}
</style>