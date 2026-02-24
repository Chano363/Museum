<template>
  <div class="sketch-view">
    <div class="sketch-header">
      <button class="back-btn" @click="$emit('back')">
        <span class="back-icon">←</span>
        <span>返回首页</span>
      </button>
      
      <div class="header-title">
        <h1>青铜绘境</h1>
        <p>绘制草图，AI生成青铜器纹理</p>
      </div>
      
      <div class="header-actions">
        <button class="help-btn" @click="showHelp = true">
          <span>❓</span>
          <span>使用帮助</span>
        </button>
        <button class="museum-btn" @click="$emit('enter-museum')">
          <span>🏛️</span>
          <span>进入博物馆</span>
        </button>
      </div>
    </div>
    
    <div class="sketch-content">
      <div class="left-panel">
        <div class="panel-header">
          <h3>绘制区域</h3>
          <div class="quick-tips">
            <span class="tip">💡 在画布上绘制青铜器轮廓</span>
          </div>
        </div>
        
        <ToolBar
          :current-tool="currentTool"
          :brush-size="brushSize"
          :brush-color="brushColor"
          @tool-change="handleToolChange"
          @size-change="brushSize = $event"
          @color-change="handleColorChange"
          @clear="handleClear"
        />
        
        <div class="canvas-wrapper">
          <SketchPad
            ref="sketchPadRef"
            :width="canvasSize"
            :height="canvasSize"
            :brush-size="brushSize"
            :brush-color="currentTool === 'eraser' ? '#1a1a1a' : brushColor"
            @stroke="handleStroke"
            @clear="handleCanvasClear"
          />
        </div>
      </div>
      
      <div class="right-panel">
        <div class="panel-section">
          <div class="panel-header">
            <h3>青铜器类型</h3>
          </div>
          <GeneratePanel
            v-model:generating="isGenerating"
            @generate="handleGenerate"
          />
        </div>
        
        <div class="panel-section prompt-section">
          <div class="panel-header">
            <h3>自定义描述</h3>
            <span class="optional-tag">选填</span>
          </div>
          <textarea 
            v-model="customPrompt"
            class="prompt-input"
            placeholder="输入额外的描述文字，如：带有云雷纹底纹、三足设计..."
            rows="3"
          ></textarea>
        </div>
        
        <div class="panel-section result-section">
          <div class="panel-header">
            <h3>生成结果</h3>
            <span v-if="generatedTextureUrl" class="result-status success">✓ 已生成</span>
          </div>
          
          <TextureResult
            :texture-url="generatedTextureUrl"
            :is-fallback="isFallback"
            @download="handleDownload"
            @regenerate="handleRegenerate"
          />
        </div>
      </div>
    </div>
    
    <div v-if="showHelp" class="help-overlay" @click.self="showHelp = false">
      <div class="help-modal">
        <div class="modal-header">
          <h2>使用帮助</h2>
          <button class="close-btn" @click="showHelp = false">×</button>
        </div>
        <div class="modal-body">
          <p class="help-intro">
            本功能旨在让用户通过简单的草图绘制，借助AI生成具有青铜器质感的纹理图像。
            绘制青铜器的大致轮廓，选择类型与风格，AI将为您创作独特的青铜器纹理。
          </p>
          <div class="guide-steps">
            <div class="guide-step" :class="{ active: hasDrawn }">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>绘制草图</h4>
                <p>在左侧画布上绘制青铜器轮廓</p>
              </div>
            </div>
            <div class="guide-step" :class="{ active: hasSelectedType }">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>选择类型</h4>
                <p>选择青铜器类型和纹饰风格</p>
              </div>
            </div>
            <div class="guide-step" :class="{ active: !!generatedTextureUrl }">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>生成纹理</h4>
                <p>点击生成按钮，AI将生成青铜器纹理</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="error" class="error-toast">
      <span class="error-icon">⚠️</span>
      {{ error }}
      <button class="error-close" @click="error = ''">×</button>
    </div>
    
    <div v-if="isGenerating" class="generating-overlay">
      <div class="generating-content">
        <div class="generating-spinner"></div>
        <p>AI正在生成青铜器纹理...</p>
        <p class="generating-tip">请稍候，这可能需要几秒钟</p>
      </div>
    </div>
  </div>
</template>

<script>
import SketchPad from './SketchGenerator/SketchPad.vue'
import ToolBar from './SketchGenerator/ToolBar.vue'
import GeneratePanel from './SketchGenerator/GeneratePanel.vue'
import TextureResult from './SketchGenerator/TextureResult.vue'
import { sketchGenerator } from '@/services/sketchGenerator'

export default {
  name: 'SketchView',
  components: {
    SketchPad,
    ToolBar,
    GeneratePanel,
    TextureResult
  },
  emits: ['back', 'enter-museum'],
  data() {
    return {
      currentTool: 'brush',
      brushSize: 4,
      brushColor: '#ffffff',
      canvasSize: 598,
      isGenerating: false,
      generatedTextureUrl: '',
      isFallback: false,
      error: '',
      lastConfig: null,
      hasDrawn: false,
      hasSelectedType: false,
      customPrompt: '',
      showHelp: false
    }
  },
  methods: {
    handleToolChange(tool) {
      this.currentTool = tool
    },
    handleColorChange(color) {
      this.currentTool = 'brush'
      this.brushColor = color
    },
    handleClear() {
      this.$refs.sketchPadRef?.clear()
      this.generatedTextureUrl = ''
      this.isFallback = false
      this.error = ''
      this.hasDrawn = false
    },
    handleStroke() {
      this.hasDrawn = true
    },
    handleCanvasClear() {
      this.hasDrawn = false
    },
    async handleGenerate(config) {
      const sketchData = this.$refs.sketchPadRef?.getImageData()
      
      if (!sketchData) {
        this.error = '请先绘制草图'
        return
      }
      
      const configWithPrompt = {
        ...config,
        prompt: this.customPrompt || config.prompt
      }
      
      this.lastConfig = configWithPrompt
      this.hasSelectedType = true
      this.error = ''
      this.isGenerating = true
      
      try {
        const result = await sketchGenerator.generateFromSketch(sketchData, configWithPrompt)
        
        if (result.success) {
          this.generatedTextureUrl = result.textureUrl
          this.isFallback = result.fallback
        } else {
          this.error = result.error || '生成失败，请重试'
        }
      } catch (e) {
        this.error = e instanceof Error ? e.message : '生成失败，请重试'
      } finally {
        this.isGenerating = false
      }
    },
    async handleRegenerate() {
      if (this.lastConfig) {
        await this.handleGenerate(this.lastConfig)
      }
    },
    handleDownload() {
      if (!this.generatedTextureUrl) return
      
      const baseUrl = import.meta.env.VITE_API_BASE || ''
      const fullUrl = baseUrl + this.generatedTextureUrl
      
      fetch(fullUrl)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `bronze_texture_${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        })
        .catch(err => {
          console.error('Download failed:', err)
          const link = document.createElement('a')
          link.href = fullUrl
          link.download = `bronze_texture_${Date.now()}.png`
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        })
    }
  }
}
</script>

<style scoped>
.sketch-view {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sketch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(196, 146, 16, 0.2);
}

.back-btn, .museum-btn, .help-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(196, 146, 16, 0.3);
  border-radius: 10px;
  color: var(--text-color, #C49210);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: var(--font-family);
}

.back-btn:hover, .museum-btn:hover, .help-btn:hover {
  background: rgba(196, 146, 16, 0.1);
  border-color: rgba(196, 146, 16, 0.5);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.back-icon {
  font-size: 22px;
}

.header-title {
  text-align: center;
}

.header-title h1 {
  font-size: 28px;
  color: var(--text-color, #C49210);
  margin: 0;
  font-family: 'HanChan', serif;
}

.header-title p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 6px 0 0;
}

.sketch-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  padding: 30px;
  overflow: hidden;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-header h3 {
  font-size: 22px;
  color: var(--text-color, #C49210);
  margin: 0;
}

.quick-tips {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

.tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 24px;
}

.panel-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(196, 146, 16, 0.1);
  border-radius: 16px;
  padding: 20px;
}

.result-status {
  font-size: 16px;
  padding: 6px 14px;
  border-radius: 14px;
}

.result-status.success {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.help-intro {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0;
  padding: 12px 16px;
  background: rgba(196, 146, 16, 0.05);
  border-radius: 10px;
  border-left: 3px solid rgba(196, 146, 16, 0.4);
}

.optional-tag {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.prompt-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(196, 146, 16, 0.2);
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  font-family: var(--font-family);
  resize: vertical;
  min-height: 80px;
  transition: all 0.3s;
}

.prompt-input:focus {
  outline: none;
  border-color: rgba(196, 146, 16, 0.5);
  background: rgba(0, 0, 0, 0.4);
}

.prompt-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.guide-step.active {
  border-color: rgba(196, 146, 16, 0.3);
  background: rgba(196, 146, 16, 0.05);
}

.step-number {
  width: 36px;
  height: 36px;
  background: rgba(196, 146, 16, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--text-color, #C49210);
  flex-shrink: 0;
}

.guide-step.active .step-number {
  background: var(--text-color, #C49210);
  color: #1a1a1a;
}

.step-content h4 {
  font-size: 18px;
  color: #fff;
  margin: 0 0 6px;
}

.step-content p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.error-toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
  background: rgba(183, 28, 28, 0.9);
  border-radius: 10px;
  color: #fff;
  font-size: 18px;
  z-index: 100;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.error-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  padding: 0 6px;
}

.generating-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.generating-content {
  text-align: center;
}

.generating-spinner {
  width: 80px;
  height: 80px;
  border: 4px solid rgba(196, 146, 16, 0.2);
  border-top-color: var(--text-color, #C49210);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.generating-content p {
  color: #fff;
  font-size: 18px;
  margin: 0;
}

.generating-tip {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-top: 10px !important;
}

.help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.help-modal {
  background: #1a1a1a;
  border: 1px solid rgba(196, 146, 16, 0.3);
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(196, 146, 16, 0.2);
}

.modal-header h2 {
  font-size: 24px;
  color: var(--text-color, #C49210);
  margin: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(196, 146, 16, 0.2);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(196, 146, 16, 0.1);
  color: var(--text-color, #C49210);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: 60vh;
}

@media (max-width: 1024px) {
  .sketch-content {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  
  .left-panel {
    max-height: none;
  }
  
  .canvas-wrapper {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .sketch-header {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .header-title {
    order: -1;
    width: 100%;
  }
  
  .back-btn, .museum-btn {
    flex: 1;
    justify-content: center;
  }
  
  .sketch-content {
    padding: 16px;
  }
}
</style>
