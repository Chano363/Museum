<template>
  <div class="sketch-generator-overlay">
    <div class="sketch-generator">
      <button class="close-btn" @click="$emit('close')">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      
      <div class="header">
        <h2>纹理创作</h2>
        <p class="subtitle">绘制草图，AI生成模型纹理</p>
      </div>
      
      <div class="tab-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="tab-icon" />
          {{ tab.label }}
        </button>
      </div>
      
      <div class="main-content">
        <div v-show="activeTab === 'create'" class="create-panel">
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
              />
            </div>
          </div>
          
          <div class="center-panel">
            <VasePreview
              ref="vasePreviewRef"
              :model-id="selectedModel"
              :texture-url="generatedTextureUrl"
              :is-generating="isGenerating"
            />
          </div>
          
          <div class="right-panel">
            <GeneratePanel
              v-model:generating="isGenerating"
              v-model:selected-model="selectedModel"
              @generate="handleGenerate"
            />
            
            <div class="result-actions" v-if="generatedTextureUrl">
              <button class="action-btn primary" @click="handleSave">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                </svg>
                上传至排行榜
              </button>
              <button class="action-btn" @click="handleDownload">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                下载纹理
              </button>
              <button class="action-btn" @click="handleRegenerate">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                重新生成
              </button>
            </div>
          </div>
        </div>
        
        <div v-show="activeTab === 'gallery'" class="gallery-container">
          <GalleryPanel ref="galleryPanelRef" @delete="handleDelete" />
        </div>
        
        <div v-show="activeTab === 'leaderboard'" class="leaderboard-container">
          <LeaderboardPanel ref="leaderboardPanelRef" />
        </div>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
    
    <div v-if="showSuccessModal" class="success-modal-overlay" @click.self="closeSuccessModal">
      <div class="success-modal">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" width="48" height="48">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h3>上传成功</h3>
        <p class="success-main">作品已保存至作品集</p>
        <p class="success-hint">前往"我的作品"查看</p>
        <button class="modal-btn" @click="closeSuccessModal">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import SketchPad from './SketchPad.vue'
import ToolBar from './ToolBar.vue'
import GeneratePanel from './GeneratePanel.vue'
import VasePreview from './VasePreview.vue'
import GalleryPanel from './GalleryPanel.vue'
import LeaderboardPanel from './LeaderboardPanel.vue'
import { sketchGenerator, type GenerateConfig } from '@/services/sketchGenerator'

const CreateIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', width: 18, height: 18 }, [
      h('path', { fill: 'currentColor', d: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' })
    ])
  }
}

const GalleryIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', width: 18, height: 18 }, [
      h('path', { fill: 'currentColor', d: 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z' })
    ])
  }
}

const TrophyIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', width: 18, height: 18 }, [
      h('path', { fill: 'currentColor', d: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z' })
    ])
  }
}

const sketchPadRef = ref<InstanceType<typeof SketchPad> | null>(null)
const vasePreviewRef = ref<InstanceType<typeof VasePreview> | null>(null)
const galleryPanelRef = ref<InstanceType<typeof GalleryPanel> | null>(null)
const leaderboardPanelRef = ref<InstanceType<typeof LeaderboardPanel> | null>(null)
const currentTool = ref('brush')
const brushSize = ref(4)
const brushColor = ref('#ffffff')
const canvasSize = ref(400)
const isGenerating = ref(false)
const generatedTextureUrl = ref('')
const selectedModel = ref('vase')
const error = ref('')
const lastConfig = ref<GenerateConfig | null>(null)
const activeTab = ref('create')
const showSuccessModal = ref(false)

const tabs = [
  { id: 'create', label: '创作', icon: CreateIcon },
  { id: 'gallery', label: '作品集', icon: GalleryIcon },
  { id: 'leaderboard', label: '排行榜', icon: TrophyIcon }
]

const emit = defineEmits<{
  (e: 'save-to-gallery', data: any): void
  (e: 'close'): void
  (e: 'delete-artwork', artworkId: number): void
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
  error.value = ''
}

async function handleGenerate(config: GenerateConfig) {
  const sketchData = sketchPadRef.value?.getImageData()
  
  if (!sketchData) {
    error.value = '请先绘制草图'
    return
  }
  
  lastConfig.value = config
  selectedModel.value = config.baseModel
  error.value = ''
  isGenerating.value = true
  
  try {
    const result = await sketchGenerator.generateFromSketch(sketchData, config)
    
    if (result.success) {
      generatedTextureUrl.value = result.textureUrl
      console.log('[SketchGenerator] 生成成功:', result)
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

function closeSuccessModal() {
  showSuccessModal.value = false
}

function handleDelete(artworkId: number) {
  emit('delete-artwork', artworkId)
  if (galleryPanelRef.value) {
    galleryPanelRef.value.loadArtworks()
  }
  if (leaderboardPanelRef.value) {
    leaderboardPanelRef.value.loadLeaderboard()
  }
}

function handleDownload() {
  if (!generatedTextureUrl.value) return
  
  const link = document.createElement('a')
  link.href = generatedTextureUrl.value
  link.download = `texture_${lastConfig.value?.baseModel || 'unknown'}_${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function handleSave() {
  if (!generatedTextureUrl.value) {
    error.value = '没有可上传的作品'
    return
  }
  
  const modelId = lastConfig.value?.baseModel || selectedModel.value
  const artworkName = lastConfig.value?.name || '未命名作品'
  
  try {
    const response = await fetch('/api/gallery/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: generatedTextureUrl.value,
        texture_url: generatedTextureUrl.value,
        prompt: lastConfig.value?.prompt || '',
        base_model: modelId,
        style: lastConfig.value?.style || 'floral',
        custom_prompt: lastConfig.value?.customPrompt || '',
        name: artworkName
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      showSuccessModal.value = true
      error.value = ''
      
      emit('save-to-gallery', {
        textureUrl: generatedTextureUrl.value,
        modelId: modelId,
        id: data.id,
        imageUrl: generatedTextureUrl.value,
        name: artworkName
      })
      
      if (galleryPanelRef.value) {
        galleryPanelRef.value.loadArtworks()
      }
      if (leaderboardPanelRef.value) {
        leaderboardPanelRef.value.loadLeaderboard()
      }
    } else {
      error.value = data.error || '上传失败'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '上传失败'
  }
}
</script>

<style scoped>
.sketch-generator-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.sketch-generator {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: rgba(26, 26, 26, 0.98);
  position: relative;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-color, #C49210);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.header {
  text-align: center;
  padding: 20px 60px 16px;
  flex-shrink: 0;
}

.header h2 {
  color: var(--text-color, #C49210);
  font-size: 28px;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin: 0;
}

.tab-nav {
  display: flex;
  gap: 12px;
  padding: 0 24px 16px;
  border-bottom: 1px solid rgba(196, 146, 16, 0.2);
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  max-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid rgba(196, 146, 16, 0.3);
  border-radius: 8px;
  background: transparent;
  color: rgba(196, 146, 16, 0.7);
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(196, 146, 16, 0.1);
}

.tab-btn.active {
  background: rgba(196, 146, 16, 0.2);
  border-color: var(--text-color, #C49210);
  color: var(--text-color, #C49210);
}

.tab-icon {
  width: 18px;
  height: 18px;
}

.main-content {
  flex: 1;
  overflow: hidden;
  padding: 20px 24px;
}

.create-panel {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(350px, 1.2fr) minmax(280px, 0.8fr);
  gap: 24px;
  height: 100%;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.center-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(196, 146, 16, 0.2);
  overflow: hidden;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border: 1px solid var(--text-color, #C49210);
  border-radius: 8px;
  background: transparent;
  color: var(--text-color, #C49210);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(196, 146, 16, 0.2);
}

.action-btn.primary {
  background: rgba(196, 146, 16, 0.25);
  border-color: var(--text-color, #C49210);
}

.action-btn.primary:hover {
  background: rgba(196, 146, 16, 0.35);
}

.gallery-container,
.leaderboard-container {
  height: 100%;
  overflow-y: auto;
}

.error-message {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: rgba(139, 0, 0, 0.9);
  border-radius: 8px;
  color: #ff6b6b;
  text-align: center;
  z-index: 10;
}

.success-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.success-modal {
  background: rgba(26, 26, 26, 0.98);
  border: 2px solid var(--text-color, #C49210);
  border-radius: 16px;
  padding: 32px 40px;
  text-align: center;
  max-width: 360px;
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.success-icon {
  margin-bottom: 16px;
  color: #4CAF50;
}

.success-modal h3 {
  color: var(--text-color, #C49210);
  font-size: 20px;
  margin: 0 0 12px 0;
}

.success-modal p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0 0 8px 0;
  line-height: 1.6;
}

.success-main {
  font-size: 15px;
  margin-bottom: 4px;
}

.success-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 24px;
}

.modal-btn {
  padding: 12px 40px;
  background: rgba(196, 146, 16, 0.2);
  border: 1px solid var(--text-color, #C49210);
  border-radius: 8px;
  color: var(--text-color, #C49210);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn:hover {
  background: rgba(196, 146, 16, 0.3);
}

@media (max-width: 1200px) {
  .create-panel {
    grid-template-columns: minmax(280px, 1fr) minmax(300px, 1fr);
    grid-template-rows: auto auto;
  }
  
  .center-panel {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
  }
  
  .left-panel {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
  
  .right-panel {
    grid-column: 1 / 3;
    grid-row: 2 / 3;
    max-height: 200px;
  }
}

@media (max-width: 768px) {
  .create-panel {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
  
  .center-panel {
    grid-column: 1;
    grid-row: 1;
    max-height: 300px;
  }
  
  .left-panel {
    grid-column: 1;
    grid-row: 2;
    max-height: 300px;
  }
  
  .right-panel {
    grid-column: 1;
    grid-row: 3;
    max-height: 250px;
  }
}
</style>
