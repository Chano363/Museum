import { ref, type Ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export interface GenerateConfig {
  bronzeType: string
  style: string
  prompt: string
}

export interface GenerateResult {
  success: boolean
  textureUrl: string
  fallback: boolean
  matchedId?: string
  error?: string
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
          bronze_type: config.bronzeType,
          strength: 0.75
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }
      
      const result = await response.json()
      return {
        success: result.success,
        textureUrl: result.texture_url || '',
        fallback: result.fallback || false,
        matchedId: result.matched_id,
        error: result.error
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
  
  async getTextureList(bronzeType?: string): Promise<any[]> {
    const params = new URLSearchParams()
    if (bronzeType) {
      params.append('type', bronzeType)
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
