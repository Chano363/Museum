import { ref, type Ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export interface GenerateConfig {
  baseModel: string
  style: string
  prompt: string
  customPrompt: string
  name?: string
}

export interface GenerateResult {
  success: boolean
  textureUrl: string
  fallback: boolean
  matchedId?: string
  baseModel?: string
  error?: string
  generationTime?: number
}

class SketchGeneratorService {
  private isGenerating: Ref<boolean> = ref(false)
  
  get generating() {
    return this.isGenerating
  }
  
  async generateFromSketch(
    sketchDataUrl: string,
    config: GenerateConfig
  ): Promise<GenerateResult> {
    this.isGenerating.value = true
    const startTime = performance.now()
    
    try {
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sketch: sketchDataUrl,
          prompt: config.prompt,
          style: config.style,
          base_model: config.baseModel,
          custom_prompt: config.customPrompt,
          strength: 0.75
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }
      
      const result = await response.json()
      const endTime = performance.now()
      const genTime = Math.round(endTime - startTime)
      console.log('[sketchGenerator] 生成耗时:', genTime, 'ms')
      
      return {
        success: result.success,
        textureUrl: result.texture_url || '',
        fallback: result.fallback || false,
        matchedId: result.matched_id,
        baseModel: result.base_model,
        error: result.error,
        generationTime: genTime
      }
      
    } catch (error) {
      console.error('Generate failed:', error)
      return {
        success: false,
        textureUrl: '',
        fallback: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } finally {
      this.isGenerating.value = false
    }
  }
  
  async getTextureList(baseModel?: string): Promise<any[]> {
    const params = new URLSearchParams()
    if (baseModel) {
      params.append('type', baseModel)
    }
    
    try {
      const response = await fetch(
        `${API_BASE}/api/textures/list?${params.toString()}`
      )
      
      if (!response.ok) {
        return []
      }
      
      return await response.json()
    } catch {
      return []
    }
  }
}

export const sketchGenerator = new SketchGeneratorService()
