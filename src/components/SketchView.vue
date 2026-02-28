<template>
  <div class="sketch-view">
    <SketchGenerator
      @close="$emit('back')"
      @save-to-gallery="handleSaveToGallery"
    />
  </div>
</template>

<script>
import SketchGenerator from './SketchGenerator/SketchGenerator.vue'

export default {
  name: 'SketchView',
  components: {
    SketchGenerator
  },
  emits: ['back', 'enter-museum', 'save-to-gallery'],
  methods: {
    handleSaveToGallery(data) {
      this.$emit('save-to-gallery', data)
    }
  }
}
</script>

<style scoped>
.sketch-view {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  overflow: hidden;
}
</style>
