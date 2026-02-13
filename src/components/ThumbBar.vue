<template>
  <div v-if="visible" class="thumb-bar-overlay" @click.self="$emit('close')">
    <div class="thumb-bar-container">
      <div 
        class="thumb-items-wrapper"
        :style="{ transform: `translateX(${translateX}px)` }"
      >
        <div 
          v-for="(artifact, index) in allArtifacts" 
          :key="artifact.id" 
          class="thumb-item"
          :class="{ 'selected': index === tempSelectedIndex }"
          :style="getThumbStyle(index)"
          @click="selectArtifact(index)"
        >
          <div v-if="artifact.iconPath" class="thumb-icon">
            <img :src="artifact.iconPath" :alt="artifact.name" loading="lazy">
          </div>
          <div v-else class="thumb-color" :style="{ backgroundColor: artifact.color }"></div>
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
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select', 'close'],
  data() {
    return {
      tempSelectedIndex: 0,
      translateX: 0,
      isAnimating: false,
      cardWidth: 220,
      gap: 15
    }
  },
  computed: {
    allArtifacts() {
      return this.artifacts || []
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.tempSelectedIndex = this.selectedIndex
        this.$nextTick(() => {
          this.updateTranslateX(false)
          this.preloadImages()
          this.setupWheelListeners()
        })
      } else {
        this.removeWheelListeners()
      }
    }
  },
  mounted() {
    this.tempSelectedIndex = this.selectedIndex
    if (this.visible) {
      this.$nextTick(() => {
        this.updateTranslateX(false)
        this.setupWheelListeners()
      })
    }
  },
  beforeUnmount() {
    this.removeWheelListeners()
  },
  methods: {
    preloadImages() {
      this.artifacts.forEach(artifact => {
        if (artifact.iconPath) {
          const img = new Image()
          img.src = artifact.iconPath
        }
      })
    },
    setupWheelListeners() {
      if (this.$el) {
        this.$el.addEventListener('wheel', this.handleWheel, { passive: false })
      }
    },
    removeWheelListeners() {
      if (this.$el) {
        this.$el.removeEventListener('wheel', this.handleWheel)
      }
    },
    handleWheel(event) {
      event.preventDefault()
      
      if (this.isAnimating) return
      
      if (event.deltaY > 0) {
        this.selectNextArtifact()
      } else {
        this.selectPrevArtifact()
      }
    },
    updateTranslateX(animate = true) {
      const centerX = window.innerWidth / 2
      const cardCenter = this.tempSelectedIndex * (this.cardWidth + this.gap) + this.cardWidth / 2
      this.translateX = centerX - cardCenter
    },
    selectNextArtifact() {
      if (this.isAnimating) return
      this.isAnimating = true
      this.tempSelectedIndex = (this.tempSelectedIndex + 1) % this.artifacts.length
      this.updateTranslateX(true)
      setTimeout(() => {
        this.isAnimating = false
      }, 300)
    },
    selectPrevArtifact() {
      if (this.isAnimating) return
      this.isAnimating = true
      this.tempSelectedIndex = (this.tempSelectedIndex - 1 + this.artifacts.length) % this.artifacts.length
      this.updateTranslateX(true)
      setTimeout(() => {
        this.isAnimating = false
      }, 300)
    },
    getThumbStyle(index) {
      const distance = Math.abs(index - this.tempSelectedIndex)
      const scale = Math.max(0.55, 1 - distance * 0.15)
      const opacity = Math.max(0.35, 1 - distance * 0.2)
      const brightness = Math.max(0.5, 1 - distance * 0.15)
      const isSelected = index === this.tempSelectedIndex
      
      return {
        transform: `scale(${scale})`,
        opacity,
        filter: `brightness(${brightness})`,
        zIndex: 100 - distance,
        backgroundColor: isSelected ? 'rgba(245, 222, 179, 0.95)' : 'rgba(218, 165, 32, 0.85)'
      }
    },
    selectArtifact(index) {
      this.$emit('select', index)
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.thumb-bar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.25s ease-out;
}

.thumb-bar-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent 5%, black 20%, black 80%, transparent 95%);
  -webkit-mask-image: linear-gradient(to right, transparent 5%, black 20%, black 80%, transparent 95%);
}

.thumb-items-wrapper {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 0 50vw;
  transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  will-change: transform;
}

.thumb-item {
  flex-shrink: 0;
  width: 220px;
  aspect-ratio: 3/4;
  background-color: rgba(218, 165, 32, 0.85);
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
              opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
              filter 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
              background-color 0.3s ease;
  will-change: transform, opacity, filter;
}

.thumb-item:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.thumb-item.selected {
  box-shadow: 0 12px 40px rgba(196, 146, 16, 0.5);
}

.thumb-color {
  width: 92%;
  height: 92%;
  border-radius: 4px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
}

.thumb-icon {
  width: 92%;
  height: 92%;
  border-radius: 4px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.thumb-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .thumb-item {
    width: 160px;
  }
  
  .thumb-items-wrapper {
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .thumb-item {
    width: 120px;
  }
  
  .thumb-items-wrapper {
    gap: 10px;
  }
}
</style>
