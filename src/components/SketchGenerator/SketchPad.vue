<template>
  <div class="sketch-pad" ref="containerRef">
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
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let isDrawing = false
let lastX = 0
let lastY = 0
let resizeObserver: ResizeObserver | null = null

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
  setupResizeObserver()
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
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

function setupResizeObserver() {
  if (!containerRef.value) return
  
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) {
        resizeCanvas(width, height)
      }
    }
  })
  
  resizeObserver.observe(containerRef.value)
}

function resizeCanvas(width: number, height: number) {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  const tempCtx = tempCanvas.getContext('2d')
  if (tempCtx) {
    tempCtx.drawImage(canvas, 0, 0)
  }
  
  canvas.width = width
  canvas.height = height
  
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, width, height)
  
  if (tempCtx) {
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, width, height)
  }
  
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = props.brushColor
  ctx.lineWidth = props.brushSize
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const container = containerRef.value
  const width = container?.clientWidth || props.width
  const height = container?.clientHeight || props.height
  
  canvas.width = width
  canvas.height = height
  ctx = canvas.getContext('2d')
  
  if (ctx) {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = props.brushColor
    ctx.lineWidth = props.brushSize
  }
}

function getCoordinates(e: MouseEvent | TouchEvent): { x: number; y: number } {
  const rect = canvasRef.value!.getBoundingClientRect()
  const scaleX = canvasRef.value!.width / rect.width
  const scaleY = canvasRef.value!.height / rect.height
  
  if ('touches' in e) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    }
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
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
  if (!ctx || !canvasRef.value) return
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  emit('clear')
}

function undo() {
  if (!ctx || !canvasRef.value) return
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
}

defineExpose({ clear, getImageData, undo })
</script>

<style scoped>
.sketch-pad {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(196, 146, 16, 0.3);
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
}

canvas {
  display: block;
  cursor: crosshair;
  touch-action: none;
  width: 100%;
  height: 100%;
}
</style>
