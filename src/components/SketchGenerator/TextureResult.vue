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
      
      <div class="result-actions">
        <button class="action-btn primary" @click="$emit('download')">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          下载图片
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
defineProps({
  textureUrl: { type: String, default: '' },
  isFallback: { type: Boolean, default: false }
})

defineEmits<{
  (e: 'download'): void
  (e: 'regenerate'): void
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
