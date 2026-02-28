<template>
  <div class="generate-panel">
    <div class="panel-section">
      <label class="section-label">作品名称</label>
      <input 
        v-model="artworkName"
        class="name-input"
        placeholder="为您的作品命名..."
        maxlength="30"
      />
    </div>
    
    <div class="panel-section">
      <label class="section-label">选择基础模型</label>
      <div class="model-options">
        <button 
          v-for="model in baseModels" 
          :key="model.id"
          :class="['model-btn', { active: selectedModel === model.id }]"
          @click="selectedModel = model.id"
        >
          <img :src="model.iconPath" :alt="model.name" class="model-icon" />
          <span class="model-name">{{ model.name }}</span>
        </button>
      </div>
    </div>
    
    <div class="panel-section">
      <label class="section-label">选择图案风格</label>
      <div class="style-options">
        <button 
          v-for="style in promptTemplates" 
          :key="style.id"
          :class="['style-btn', { active: selectedStyle === style.id }]"
          @click="selectedStyle = style.id"
        >
          {{ style.name }}
        </button>
      </div>
    </div>
    
    <div v-if="selectedStyle === 'custom'" class="panel-section">
      <label class="section-label">自定义提示词</label>
      <textarea 
        v-model="customPrompt"
        class="custom-prompt-input"
        placeholder="输入您想要的图案描述..."
        rows="3"
      ></textarea>
    </div>
    
    <div class="panel-section prompt-preview">
      <label class="section-label">生成提示词</label>
      <div class="prompt-text">{{ previewPrompt }}</div>
    </div>
    
    <button 
      class="generate-btn"
      :disabled="isGenerating"
      @click="handleGenerate"
    >
      <svg v-if="isGenerating" class="spinner" viewBox="0 0 24 24" width="20" height="20">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </circle>
      </svg>
      <span>{{ isGenerating ? '生成中...' : '生成图案' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { BASE_MODELS, PROMPT_TEMPLATES, buildPrompt } from '@/constants/vaseConstants'
import type { GenerateConfig } from '@/services/sketchGenerator'

const selectedModel = defineModel<string>('selectedModel', { default: 'vase' })
const selectedStyle = ref('floral')
const customPrompt = ref('')
const artworkName = ref('')

const baseModels = BASE_MODELS
const promptTemplates = PROMPT_TEMPLATES

const isGenerating = defineModel<boolean>('generating')

const emit = defineEmits<{
  (e: 'generate', config: GenerateConfig & { name: string }): void
}>()

const previewPrompt = computed(() => {
  return buildPrompt(selectedStyle.value, customPrompt.value)
})

function handleGenerate() {
  emit('generate', {
    baseModel: selectedModel.value,
    style: selectedStyle.value,
    prompt: previewPrompt.value,
    customPrompt: customPrompt.value,
    name: artworkName.value || '未命名作品'
  })
}
</script>

<style scoped>
.generate-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(196, 146, 16, 0.2);
  border-radius: 12px;
  height: 100%;
  overflow-y: auto;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  color: var(--text-color, #C49210);
  font-size: 14px;
  font-weight: 500;
}

.name-input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(196, 146, 16, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-family: inherit;
}

.name-input:focus {
  outline: none;
  border-color: var(--text-color, #C49210);
}

.name-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.model-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(196, 146, 16, 0.3);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-color, #C49210);
  cursor: pointer;
  transition: all 0.2s;
}

.model-btn:hover {
  border-color: rgba(196, 146, 16, 0.6);
  background: rgba(196, 146, 16, 0.1);
}

.model-btn.active {
  border-color: var(--text-color, #C49210);
  background: rgba(196, 146, 16, 0.2);
}

.model-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.model-name {
  font-size: 14px;
  text-align: left;
}

.style-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.style-btn {
  padding: 8px 14px;
  border: 1px solid rgba(196, 146, 16, 0.3);
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-color, #C49210);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.style-btn:hover {
  border-color: rgba(196, 146, 16, 0.6);
  background: rgba(196, 146, 16, 0.1);
}

.style-btn.active {
  border-color: var(--text-color, #C49210);
  background: rgba(196, 146, 16, 0.2);
}

.custom-prompt-input {
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(196, 146, 16, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
  min-height: 60px;
}

.custom-prompt-input:focus {
  outline: none;
  border-color: var(--text-color, #C49210);
}

.custom-prompt-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.prompt-preview {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 8px;
}

.prompt-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  line-height: 1.6;
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #C49210 0%, #8B6914 100%);
  color: #1a1a1a;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
  margin-top: auto;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(196, 146, 16, 0.4);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
