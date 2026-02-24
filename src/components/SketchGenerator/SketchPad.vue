<template>
  <div class="sketch-pad">
    <canvas 
      ref="canvasRef"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="stopDrawing"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let isDrawing = false
let lastX = 0
let lastY = 0

const props = defineProps({
  width: { type: Number, default: 400 },
  height: { type: Number, default: 400 },
  brushSize: { type: Number, default: 4 },
  brushColor: { type: String, default: '#ffffff' }
})

const emit = defineEmits<{
  (e: 'stroke', imageData: string): void
  (e: 'clear'): void
}>()

onMounted(() => {
  initCanvas()
})

watch(() => props.brushSize, (newSize) => {
  if (ctx) {
    ctx.lineWidth = newSize
  }
})

watch(() => props.brushColor, (newColor) => {
  if (ctx) {
    ctx.strokeStyle = newColor
  }
})

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  canvas.width = props.width
  canvas.height = props.height
  ctx = canvas.getContext('2d')
  
  if (ctx) {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, props.width, props.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = props.brushColor
    ctx.lineWidth = props.brushSize
  }
}

function getCoordinates(e: MouseEvent | TouchEvent): { x: number; y: number } {
  const rect = canvasRef.value!.getBoundingClientRect()
  if ('touches' in e) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    }
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

function startDrawing(e: MouseEvent) {
  isDrawing = true
  const coords = getCoordinates(e)
  lastX = coords.x
  lastY = coords.y
}

function draw(e: MouseEvent) {
  if (!isDrawing || !ctx) return
  
  const coords = getCoordinates(e)
  
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(coords.x, coords.y)
  ctx.stroke()
  
  lastX = coords.x
  lastY = coords.y
}

function stopDrawing() {
  if (isDrawing) {
    isDrawing = false
    emit('stroke', getImageData())
  }
}

function handleTouchStart(e: TouchEvent) {
  e.preventDefault()
  isDrawing = true
  const coords = getCoordinates(e)
  lastX = coords.x
  lastY = coords.y
}

function handleTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (!isDrawing || !ctx) return
  
  const coords = getCoordinates(e)
  
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(coords.x, coords.y)
  ctx.stroke()
  
  lastX = coords.x
  lastY = coords.y
}

function getImageData(): string {
  return canvasRef.value?.toDataURL('image/png') || ''
}

function clear() {
  if (!ctx) return
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, props.width, props.height)
  emit('clear')
}

function undo() {
  if (!ctx) return
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, props.width, props.height)
}

defineExpose({ clear, getImageData, undo })
</script>

<style scoped>
.sketch-pad {
  border: 2px solid var(--text-color, #C49210);
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a1a;
}

canvas {
  display: block;
  cursor: crosshair;
  touch-action: none;
}
</style>
