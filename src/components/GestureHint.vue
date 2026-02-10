<template>
  <div class="gesture-hint">
    <div class="hint-content">
      {{ hint }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'GestureHint',
  props: {
    hint: {
      type: String,
      required: true
    }
  }
}
</script>

<style scoped>
.gesture-hint {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  animation: fadeInOut 0.8s ease-in-out;
}

.hint-content {
  background-color: rgba(0, 0, 0, 0.7);
  color: var(--text-color);
  padding: 15px 25px;
  border-radius: 25px;
  font-size: 1rem;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-family: var(--font-family);
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  80% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
}
</style>
