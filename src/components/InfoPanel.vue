<template>
  <div class="info-panel-overlay" @click="$emit('close')">
    <div class="info-panel" @click.stop>
      <button class="close-btn" @click="$emit('close')">
        ×
      </button>
      <h2 class="artifact-name">{{ artifact.name }}</h2>
      <p class="artifact-dynasty">{{ artifact.dynasty }}</p>
      <div class="artifact-description">
        {{ artifact.description }}
      </div>
      <a href="/3Dmodels/模型相关信息.docx" class="info-link" target="_blank">
        📄 查看详细信息
      </a>
      <button class="play-btn" @click="playAudio">
        🔊 播放讲解
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InfoPanel',
  props: {
    artifact: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  methods: {
    playAudio() {
      // 播放语音讲解
      alert(`正在播放 ${this.artifact.name} 的语音讲解`);
    }
  }
}
</script>

<style scoped>
.info-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.info-panel {
  width: 350px;
  max-width: 90vw;
  height: 80vh;
  background-color: #f5f1e8; /* 宣纸米白 */
  border-radius: 10px 0 0 10px;
  padding: 30px;
  box-shadow: -5px 0 20px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
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

.artifact-name {
  font-size: 1.8rem;
  font-weight: bold;
  color: #3c2a1e;
  margin-bottom: 10px;
}

.artifact-dynasty {
  font-size: 1.2rem;
  color: #6b5645;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(60, 42, 30, 0.2);
}

.artifact-description {
  font-size: 1rem;
  line-height: 1.6;
  color: #3c2a1e;
  margin-bottom: 20px;
  flex: 1;
  overflow-y: auto;
}

.info-link {
  display: block;
  width: 100%;
  padding: 12px;
  background-color: rgba(60, 42, 30, 0.1);
  color: #3c2a1e;
  border: 1px solid rgba(60, 42, 30, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  text-align: center;
  text-decoration: none;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.info-link:hover {
  background-color: rgba(60, 42, 30, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.play-btn {
  width: 100%;
  padding: 12px;
  background-color: #8b0000; /* 朱砂红 */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 0, 0, 0.3);
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
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* 滚动条样式 */
.artifact-description::-webkit-scrollbar {
  width: 6px;
}

.artifact-description::-webkit-scrollbar-track {
  background: rgba(60, 42, 30, 0.1);
  border-radius: 3px;
}

.artifact-description::-webkit-scrollbar-thumb {
  background: rgba(60, 42, 30, 0.3);
  border-radius: 3px;
}

.artifact-description::-webkit-scrollbar-thumb:hover {
  background: rgba(60, 42, 30, 0.5);
}
</style>
