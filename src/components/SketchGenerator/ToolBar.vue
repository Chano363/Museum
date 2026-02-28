<template>
  <div class="toolbar">
    <div class="tool-group">
      <button 
        :class="['tool-btn', { active: currentTool === 'brush' }]"
        @click="$emit('tool-change', 'brush')"
        title="画笔"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M20.71 4.04c-.39-.39-1.02-.39-1.41 0l-1.84 1.83 3.41 3.41 1.84-1.83c.39-.39.39-1.02 0-1.41l-2-2zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
        </svg>
      </button>
      <button 
        :class="['tool-btn', { active: currentTool === 'eraser' }]"
        @click="$emit('tool-change', 'eraser')"
        title="橡皮"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-4.95-4.95-4.95 4.95z"/>
        </svg>
      </button>
    </div>
    
    <div class="separator"></div>
    
    <div class="size-group">
      <label>大小</label>
      <input 
        type="range" 
        min="1" 
        max="20" 
        :value="brushSize"
        @input="$emit('size-change', Number(($event.target as HTMLInputElement).value))"
      />
      <span>{{ brushSize }}</span>
    </div>
    
    <div class="separator"></div>
    
    <div class="color-group">
      <label>颜色</label>
      <div class="color-options">
        <button 
          v-for="color in colors" 
          :key="color"
          :class="['color-btn', { active: brushColor === color }]"
          :style="{ backgroundColor: color }"
          @click="$emit('color-change', color)"
        />
      </div>
    </div>
    
    <div class="separator"></div>
    
    <div class="action-group">
      <button class="action-btn" @click="$emit('clear')" title="清除">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
        </svg>
        清除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  currentTool: { type: String, default: 'brush' },
  brushSize: { type: Number, default: 4 },
  brushColor: { type: String, default: '#ffffff' }
})

defineEmits<{
  (e: 'tool-change', tool: string): void
  (e: 'size-change', size: number): void
  (e: 'color-change', color: string): void
  (e: 'clear'): void
}>()

const colors = [
  '#ffffff',
  '#C49210',
  '#f0d695',
  '#8B4513',
  '#2F4F4F',
  '#8B0000'
]
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(196, 146, 16, 0.2);
  border-radius: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.tool-group {
  display: flex;
  gap: 6px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-color, #C49210);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tool-btn.active {
  border-color: var(--text-color, #C49210);
  background: rgba(196, 146, 16, 0.2);
}

.separator {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
}

.size-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-group label {
  color: var(--text-color, #C49210);
  font-size: 12px;
}

.size-group input[type="range"] {
  width: 70px;
  accent-color: var(--text-color, #C49210);
}

.size-group span {
  color: var(--text-color, #C49210);
  font-size: 12px;
  min-width: 18px;
}

.color-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-group label {
  color: var(--text-color, #C49210);
  font-size: 12px;
}

.color-options {
  display: flex;
  gap: 5px;
}

.color-btn {
  width: 24px;
  height: 24px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #fff;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
}

.action-group {
  margin-left: auto;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid var(--text-color, #C49210);
  border-radius: 6px;
  background: transparent;
  color: var(--text-color, #C49210);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(196, 146, 16, 0.2);
}
</style>
