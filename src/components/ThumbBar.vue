<template>
  <div class="thumb-bar">
    <div class="thumb-container">
      <div v-for="(artifact, index) in artifacts" :key="artifact.id" class="thumb-item"
        :class="{ 'selected': index === selectedIndex }" @click="$emit('select', index)">
        <div v-if="artifact.iconPath" class="thumb-icon">
          <img :src="artifact.iconPath" :alt="artifact.name">
        </div>
        <div v-else class="thumb-color" :style="{ backgroundColor: artifact.color }"></div>
        <div class="thumb-info">
          <h3>{{ artifact.name }}</h3>
          <p>{{ artifact.dynasty }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ThumbBar',
  props: {
    artifacts: {
      type: Array,
      required: true
    },
    selectedIndex: {
      type: Number,
      default: 0
    }
  },
  emits: ['select']
}
</script>

<style scoped>
.thumb-bar {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  height: 120px;
  background-color: rgba(196, 146, 16, 0.1);
  border-radius: 10px;
  padding: 10px;
  z-index: 100;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thumb-container {
  display: flex;
  gap: 15px;
  height: 100%;
  overflow-x: auto;
  padding-bottom: 10px;
  align-items: center;
}

.thumb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
  padding: 10px;
  background-color: rgba(60, 60, 60, 0.8);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thumb-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.thumb-item.selected {
  border-color: #8b0000;
  /* 朱砂红 */
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(139, 0, 0, 0.3);
}

.thumb-color {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.thumb-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.thumb-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-info {
  flex: 1;
  min-width: 0;
}

.thumb-info h3 {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text-color);
  margin: 0 0 5px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-family);
}

.thumb-info p {
  font-size: 0.8rem;
  color: var(--text-color);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-family);
}

/* 滚动条样式 */
.thumb-container::-webkit-scrollbar {
  height: 6px;
}

.thumb-container::-webkit-scrollbar-track {
  background: rgba(196, 146, 16, 0.1);
  border-radius: 3px;
}

.thumb-container::-webkit-scrollbar-thumb {
  background: rgba(196, 146, 16, 0.3);
  border-radius: 3px;
}

.thumb-container::-webkit-scrollbar-thumb:hover {
  background: rgba(196, 146, 16, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .thumb-bar {
    top: 15px;
    left: 15px;
    right: 15px;
    height: 100px;
    padding: 8px;
  }

  .thumb-item {
    min-width: 160px;
    padding: 8px;
    gap: 8px;
  }

  .thumb-color {
    width: 48px;
    height: 48px;
  }
  
  .thumb-icon {
    width: 48px;
    height: 48px;
  }

  .thumb-info h3 {
    font-size: 0.9rem;
  }

  .thumb-info p {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .thumb-bar {
    top: 10px;
    left: 10px;
    right: 10px;
    height: 90px;
    padding: 6px;
  }

  .thumb-item {
    min-width: 140px;
    padding: 6px;
    gap: 6px;
  }

  .thumb-color {
    width: 40px;
    height: 40px;
  }
  
  .thumb-icon {
    width: 40px;
    height: 40px;
  }

  .thumb-info h3 {
    font-size: 0.8rem;
  }

  .thumb-info p {
    font-size: 0.6rem;
  }
}
</style>
