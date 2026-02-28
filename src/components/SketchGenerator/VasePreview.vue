<template>
  <div class="vase-preview">
    <div class="preview-header">
      <span class="preview-title">{{ modelName }}</span>
      <span class="preview-hint">可拖动旋转查看</span>
    </div>
    
    <div class="preview-content">
      <div class="vase-container">
        <model-viewer
          ref="modelViewerRef"
          :src="modelPath"
          :style="modelStyle"
          camera-controls
          disable-zoom
          interaction-prompt="none"
          auto-rotate
          :auto-rotate-delay="3000"
          shadow-intensity="0"
          exposure="1.2"
          reveal="auto"
          loading="eager"
          @load="onModelLoad"
          @error="onModelError"
        />
        
        <div v-if="isLoading" class="loading-overlay">
          <div class="spinner"></div>
          <span>加载模型中...</span>
        </div>
        
        <div v-if="isGenerating" class="generating-overlay">
          <div class="spinner"></div>
          <span>生成中...</span>
        </div>
        
        <div v-if="textureUrl && !isGenerating" class="texture-applied-badge">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          图案已应用
        </div>
      </div>
      
      <div v-if="textureUrl && !isGenerating" class="texture-preview">
        <div class="texture-preview-header">
          <span>生成的纹理图案</span>
        </div>
        <div class="texture-image-container">
          <img :src="textureUrl" alt="生成的纹理" class="texture-image" />
        </div>
      </div>
    </div>
    
    <div class="vase-controls">
      <button class="control-btn" @click="resetView" title="重置视角">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getBaseModelById, MODEL_PREVIEW_CONFIG } from '@/constants/vaseConstants'

const props = defineProps({
  modelId: { type: String, default: 'vase' },
  textureUrl: { type: String, default: '' },
  isGenerating: { type: Boolean, default: false }
})

const emit = defineEmits<{
  (e: 'model-loaded'): void
  (e: 'model-error', error: any): void
}>()

const modelViewerRef = ref<any>(null)
const isLoading = ref(true)
const cachedTexture = ref<any>(null)
const lastTextureUrl = ref('')

const modelInfo = computed(() => getBaseModelById(props.modelId))
const modelPath = computed(() => modelInfo.value?.modelPath || '')
const modelName = computed(() => modelInfo.value?.name || '3D模型')

const modelStyle = computed(() => ({
  width: '100%',
  height: '100%',
  backgroundColor: 'transparent'
}))

async function onModelLoad() {
  isLoading.value = false
  await setWhiteMaterial()
  emit('model-loaded')
}

async function setWhiteMaterial() {
  if (!modelViewerRef.value) return
  
  try {
    const modelViewer = modelViewerRef.value
    await modelViewer.updateComplete
    
    const model = modelViewer.model
    if (!model) {
      console.warn('[VasePreview] No model loaded')
      return
    }
    
    const materials = model.materials
    console.log('[VasePreview] Setting white material, materials count:', materials?.length)
    
    if (materials && materials.length > 0) {
      const whiteTexture = await createWhiteTexture(modelViewer)
      
      for (const material of materials) {
        console.log('[VasePreview] Processing material:', material.name)
        
        material.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1])
        material.pbrMetallicRoughness.setMetallicFactor(0)
        material.pbrMetallicRoughness.setRoughnessFactor(0.8)
        
        if (whiteTexture && material.pbrMetallicRoughness.baseColorTexture) {
          material.pbrMetallicRoughness.baseColorTexture.setTexture(whiteTexture)
        }
        
        if (material.normalTexture) {
          material.normalTexture.setTexture(null)
        }
        
        if (material.occlusionTexture) {
          material.occlusionTexture.setTexture(null)
        }
      }
      
      await modelViewer.updateComplete
      console.log('[VasePreview] White material applied successfully')
    } else {
      console.warn('[VasePreview] No materials found on model')
    }
  } catch (error) {
    console.error('Failed to set white material:', error)
  }
}

async function createWhiteTexture(modelViewer: any): Promise<any> {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 64, 64)
    }
    const whiteDataUrl = canvas.toDataURL('image/png')
    return await modelViewer.createTexture(whiteDataUrl)
  } catch (error) {
    console.error('Failed to create white texture:', error)
    return null
  }
}

function onModelError(event: any) {
  isLoading.value = false
  emit('model-error', event)
}

function resetView() {
  if (modelViewerRef.value) {
    modelViewerRef.value.cameraOrbit = MODEL_PREVIEW_CONFIG.cameraOrbit
    modelViewerRef.value.fieldOfView = MODEL_PREVIEW_CONFIG.fieldOfView
  }
}

async function applyTexture(textureUrl: string) {
  if (!modelViewerRef.value || !textureUrl) return
  
  const startTime = performance.now()
  
  try {
    const modelViewer = modelViewerRef.value
    await modelViewer.updateComplete
    
    const material = modelViewer.model?.materials?.[0]
    if (!material) {
      console.warn('[VasePreview] No material found')
      return
    }
    
    let texture
    if (cachedTexture.value && lastTextureUrl.value === textureUrl) {
      texture = cachedTexture.value
    } else {
      texture = await modelViewer.createTexture(textureUrl)
      cachedTexture.value = texture
      lastTextureUrl.value = textureUrl
    }
    
    material.pbrMetallicRoughness.baseColorTexture.setTexture(texture)
    
    const endTime = performance.now()
    console.log(`[VasePreview] Texture applied in ${(endTime - startTime).toFixed(0)}ms`)
  } catch (error) {
    console.error('Failed to apply texture:', error)
  }
}

async function captureScreenshot(): Promise<string | null> {
  if (!modelViewerRef.value) return null
  
  try {
    const modelViewer = modelViewerRef.value
    await modelViewer.updateComplete
    
    const blob = await modelViewer.toBlob({
      mimeType: 'image/png',
      quality: 1
    })
    
    if (!blob) return null
    
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to capture screenshot:', error)
    return null
  }
}

watch(() => props.textureUrl, (newUrl) => {
  if (newUrl) {
    applyTexture(newUrl)
  }
})

watch(() => props.modelId, () => {
  isLoading.value = true
})

onMounted(() => {
  if (props.textureUrl) {
    applyTexture(props.textureUrl)
  }
})

defineExpose({
  applyTexture,
  resetView,
  captureScreenshot
})
</script>

<style scoped>
.vase-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(26, 26, 26, 0.98);
  border: 1px solid rgba(196, 146, 16, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(196, 146, 16, 0.2);
  flex-shrink: 0;
}

.preview-title {
  color: var(--text-color, #C49210);
  font-size: 16px;
  font-weight: 500;
}

.preview-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.preview-content {
  flex: 1;
  display: flex;
  min-height: 0;
  gap: 1px;
  background: rgba(26, 26, 26, 0.98);
}

.vase-container {
  position: relative;
  flex: 1;
  min-width: 0;
  background: rgba(26, 26, 26, 0.98);
}

.vase-container model-viewer {
  --poster-color: transparent;
  width: 100%;
  height: 100%;
  background: rgba(26, 26, 26, 0.98);
}

.loading-overlay,
.generating-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: var(--text-color, #C49210);
  font-size: 14px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(196, 146, 16, 0.3);
  border-top-color: var(--text-color, #C49210);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.texture-applied-badge {
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
  font-size: 12px;
}

.texture-preview {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: rgba(26, 26, 26, 0.98);
}

.texture-preview-header {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(196, 146, 16, 0.2);
  color: var(--text-color, #C49210);
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.texture-image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  overflow: hidden;
}

.texture-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.vase-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  border-top: 1px solid rgba(196, 146, 16, 0.2);
  flex-shrink: 0;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(196, 146, 16, 0.3);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-color, #C49210);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(196, 146, 16, 0.2);
  border-color: var(--text-color, #C49210);
}
</style>
