<template>
  <div class="sketch-generator-overlay">
    <div class="sketch-generator">
      <button class="close-btn" @click="$emit('close')">×</button>
      
      <div class="header">
        <h2>青铜器纹理创作</h2>
        <p class="subtitle">绘制草图，AI生成青铜器纹理</p>
      </div>
      
      <div class="main-content">
        <div class="left-panel">
          <ToolBar
            :current-tool="currentTool"
            :brush-size="brushSize"
            :brush-color="brushColor"
            @tool-change="handleToolChange"
            @size-change="brushSize = $event"
            @color-change="handleColorChange"
            @clear="handleClear"
          />
          
          <div class="canvas-container">
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
          <GeneratePanel
            v-model:generating="isGenerating"
            @generate="handleGenerate"
          />
          
          <TextureResult
            :texture-url="generatedTextureUrl"
            :is-fallback="isFallback"
            @apply="handleApplyTexture"
            @download="handleDownload"
            @regenerate="handleRegenerate"
          />
        </div>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SketchPad from './SketchPad.vue'
import ToolBar from './ToolBar.vue'
import GeneratePanel from './GeneratePanel.vue'
import TextureResult from './TextureResult.vue'
import { sketchGenerator, type GenerateConfig } from '@/services/sketchGenerator'

const sketchPadRef = ref<InstanceType<typeof SketchPad> | null>(null)
const currentTool = ref('brush')
const brushSize = ref(4)
const brushColor = ref('#ffffff')
const canvasSize = ref(400)
const isGenerating = ref(false)
const generatedTextureUrl = ref('')
const isFallback = ref(false)
const error = ref('')
const lastConfig = ref<GenerateConfig | null>(null)

const emit = defineEmits<{
  (e: 'apply-texture', url: string): void
  (e: 'close'): void
}>()

function handleToolChange(tool: string) {
  currentTool.value = tool
}

function handleColorChange(color: string) {
  currentTool.value = 'brush'
  brushColor.value = color
}

function handleClear() {
  sketchPadRef.value?.clear()
  generatedTextureUrl.value = ''
  isFallback.value = false
  error.value = ''
}

function handleStroke(imageData: string) {
  // 可以在这里保存历史记录用于撤销
}

function handleCanvasClear() {
  // Canvas已清空
}

async function handleGenerate(config: GenerateConfig) {
  const sketchData = sketchPadRef.value?.getImageData()
  
  if (!sketchData) {
    error.value = '请先绘制草图'
    return
  }
  
  lastConfig.value = config
  error.value = ''
  isGenerating.value = true
  
  try {
    const result = await sketchGenerator.generateFromSketch(sketchData, config)
    
    if (result.success) {
      generatedTextureUrl.value = result.textureUrl
      isFallback.value = result.fallback
    } else {
      error.value = result.error || '生成失败，请重试'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '生成失败，请重试'
  } finally {
    isGenerating.value = false
  }
}

async function handleRegenerate() {
  if (lastConfig.value) {
    await handleGenerate(lastConfig.value)
  }
}

function handleApplyTexture() {
  if (generatedTextureUrl.value) {
    emit('apply-texture', generatedTextureUrl.value)
  }
}

function handleDownload() {
  if (!generatedTextureUrl.value) return
  
  const link = document.createElement('a')
  link.href = generatedTextureUrl.value
  link.download = `bronze_texture_${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.sketch-generator-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.sketch-generator {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  max-width: 900px;
  width: 100%;
  background: rgba(26, 26, 26, 0.95);
  border-radius: 16px;
  border: 2px solid var(--text-color, #C49210);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-color, #C49210);
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.header {
  text-align: center;
}

.header h2 {
  color: var(--text-color, #C49210);
  font-size: 24px;
  margin: 0 0 8px 0;
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin: 0;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.canvas-container {
  display: flex;
  justify-content: center;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-message {
  padding: 12px;
  background: rgba(139, 0, 0, 0.3);
  border: 1px solid #8B0000;
  border-radius: 8px;
  color: #ff6b6b;
  text-align: center;
}
</style>
