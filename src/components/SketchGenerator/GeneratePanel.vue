<template>
  <div class="generate-panel">
    <div class="panel-section">
      <label class="section-label">青铜器类型</label>
      <div class="type-options">
        <button 
          v-for="type in bronzeTypes" 
          :key="type.id"
          :class="['type-btn', { active: bronzeType === type.id }]"
          @click="bronzeType = type.id"
        >
          <span class="type-icon">{{ type.icon }}</span>
          <span class="type-name">{{ type.name }}</span>
        </button>
      </div>
    </div>
    
    <div class="panel-section">
      <label class="section-label">纹饰风格</label>
      <div class="style-options">
        <button 
          v-for="style in bronzeStyles" 
          :key="style.id"
          :class="['style-btn', { active: selectedStyle === style.id }]"
          @click="selectedStyle = style.id"
        >
          {{ style.name }}
        </button>
      </div>
    </div>
    
    <div class="panel-section prompt-preview">
      <label class="section-label">生成提示词</label>
      <div class="prompt-text">{{ promptTemplate }}</div>
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
      <span>{{ isGenerating ? '生成中...' : '生成青铜器纹理' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const bronzeType = ref('ding')
const selectedStyle = ref('taotie')

const bronzeTypes = [
  { id: 'ding', name: '鼎', icon: '🏛️' },
  { id: 'zun', name: '尊', icon: '🏺' },
  { id: 'jue', name: '爵', icon: '🥃' },
  { id: 'gu', name: '觚', icon: '🏺' },
  { id: 'pan', name: '盘', icon: '💿' },
  { id: 'you', name: '卣', icon: '🫙' }
]

const bronzeStyles = [
  { id: 'taotie', name: '饕餮纹' },
  { id: 'yunlei', name: '云雷纹' },
  { id: 'kui', name: '夔龙纹' },
  { id: 'fengniao', name: '凤鸟纹' },
  { id: 'liuli', name: '蟠螭纹' }
]

const isGenerating = defineModel<boolean>('generating')

const emit = defineEmits<{
  (e: 'generate', config: GenerateConfig): void
}>()

interface GenerateConfig {
  bronzeType: string
  style: string
  prompt: string
}

const typeNames: Record<string, string> = {
  ding: '青铜鼎',
  zun: '青铜尊',
  jue: '青铜爵',
  gu: '青铜觚',
  pan: '青铜盘',
  you: '青铜卣'
}

const styleNames: Record<string, string> = {
  taotie: '饕餮纹',
  yunlei: '云雷纹',
  kui: '夔龙纹',
  fengniao: '凤鸟纹',
  liuli: '蟠螭纹'
}

const promptTemplate = computed(() => {
  const typeName = typeNames[bronzeType.value] || '青铜器'
  const styleName = styleNames[selectedStyle.value] || ''
  
  return `中国古代${typeName}，${styleName}装饰，商周时期风格，青铜质感，古朴厚重，博物馆藏品，高清纹理`
})

function handleGenerate() {
  emit('generate', {
    bronzeType: bronzeType.value,
    style: selectedStyle.value,
    prompt: promptTemplate.value
  })
}
</script>

<style scoped>
.generate-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  color: var(--text-color, #C49210);
  font-size: 18px;
  font-weight: 500;
}

.type-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  border: 2px solid rgba(196, 146, 16, 0.3);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-color, #C49210);
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  border-color: rgba(196, 146, 16, 0.6);
  background: rgba(196, 146, 16, 0.1);
}

.type-btn.active {
  border-color: var(--text-color, #C49210);
  background: rgba(196, 146, 16, 0.2);
}

.type-icon {
  font-size: 28px;
}

.type-name {
  font-size: 16px;
}

.style-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.style-btn {
  padding: 10px 18px;
  border: 1px solid rgba(196, 146, 16, 0.3);
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-color, #C49210);
  cursor: pointer;
  font-size: 16px;
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

.prompt-preview {
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 8px;
}

.prompt-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  line-height: 1.6;
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #C49210 0%, #8B6914 100%);
  color: #1a1a1a;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
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
