<template>
  <div class="texture-result">
    <div v-if="!textureUrl" class="placeholder">
      <svg viewBox="0 0 24 24" width="48" height="48">
        <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
      <p>生成的纹理将显示在这里</p>
    </div>
    
    <div v-else class="result-container">
      <img :src="textureUrl" alt="Generated Texture" class="texture-image" />
      
      <div v-if="isFallback" class="fallback-badge">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        预选纹理匹配
      </div>
      
      <div v-if="showDevInfo && (generationTime || prompt)" class="dev-info-panel">
        <div class="dev-info-header">
          <span class="dev-badge">DEV</span>
          <span class="dev-info-title">调试信息</span>
        </div>
        <div v-if="generationTime" class="dev-info-row">
          <span class="dev-info-label">生图耗时:</span>
          <span class="dev-info-value">{{ generationTime }}ms</span>
        </div>
        <div v-if="prompt" class="dev-info-row">
          <span class="dev-info-label">提示词:</span>
          <span class="dev-info-value dev-prompt">{{ prompt }}</span>
        </div>
      </div>
      
      <div class="result-actions">
        <button class="action-btn primary" @click="$emit('save')">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
          </svg>
          保存作品
        </button>
        <button class="action-btn" @click="$emit('download')">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          下载
        </button>
        <button class="action-btn" @click="$emit('regenerate')">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          重新生成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const showDevInfo = import.meta.env.DEV
console.log('[TextureResult] showDevInfo:', showDevInfo)

const props = defineProps({
  textureUrl: { type: String, default: '' },
  isFallback: { type: Boolean, default: false },
  generationTime: { type: Number, default: null },
  prompt: { type: String, default: '' }
})

watch(() => props.textureUrl, (newVal) => {
  console.log('[TextureResult] textureUrl changed:', newVal ? 'has image' : 'no image')
  console.log('[TextureResult] generationTime:', props.generationTime)
  console.log('[TextureResult] prompt:', props.prompt)
})

watch(() => props.generationTime, (newVal) => {
  console.log('[TextureResult] generationTime changed:', newVal)
})

defineEmits<{
  (e: 'download'): void
  (e: 'regenerate'): void
  (e: 'save'): void
}>()
</script>

<style scoped>
.texture-result {
  width: 100%;
  min-height: 200px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(196, 146, 16, 0.3);
  border-radius: 10px;
  overflow: hidden;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(196, 146, 16, 0.5);
  gap: 16px;
}

.placeholder p {
  font-size: 15px;
}

.result-container {
  position: relative;
}

.texture-image {
  width: 100%;
  display: block;
}

.fallback-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 5px;
  color: #4CAF50;
  font-size: 13px;
}

.dev-info-panel {
  padding: 10px 12px;
  background: rgba(196, 146, 16, 0.1);
  border-top: 1px dashed rgba(196, 146, 16, 0.5);
}

.dev-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.dev-info-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
}

.dev-info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
}

.dev-info-label {
  color: rgba(196, 146, 16, 0.8);
  white-space: nowrap;
  flex-shrink: 0;
}

.dev-info-value {
  color: rgba(255, 255, 255, 0.7);
}

.dev-prompt {
  word-break: break-all;
  line-height: 1.5;
}

.dev-badge {
  padding: 2px 6px;
  background: #C49210;
  border-radius: 3px;
  color: #1a1a1a;
  font-size: 11px;
  font-weight: 600;
}

.result-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.5);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
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
  background: rgba(196, 146, 16, 0.2);
  border-color: var(--text-color, #C49210);
}

.action-btn.primary:hover {
  background: rgba(196, 146, 16, 0.3);
}

.action-btn.secondary {
  border-color: rgba(196, 146, 16, 0.5);
  color: rgba(196, 146, 16, 0.8);
}
</style>
