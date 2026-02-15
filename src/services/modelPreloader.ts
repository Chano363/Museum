import { ParticleRenderer, ModelCache } from './particleRenderer'

export class ModelPreloader {
  private static isPreloading = false
  private static preloadPromises: Promise<void>[] = []
  
  static async preloadAllModels(): Promise<void> {
    if (this.isPreloading) {
      return
    }
    
    this.isPreloading = true
    
    // 预加载展示列表中的第一个模型（卣（盛酒器））
    const modelsToPreload = [
      '/3Dmodels/卣（盛酒器）/you_wine_vessel_12th-11th_c_bce/scene.gltf'
    ]
    
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.top = '-9999px'
    tempContainer.style.width = '1px'
    tempContainer.style.height = '1px'
    document.body.appendChild(tempContainer)
    
    try {
      for (const modelPath of modelsToPreload) {
        if (!ModelCache.has(modelPath)) {
          const renderer = new ParticleRenderer(tempContainer)
          
          const preloadPromise = renderer.loadModel(modelPath).catch(error => {
            console.error(`Error preloading model ${modelPath}:`, error)
          }).finally(() => {
            // 释放renderer实例，防止内存泄漏
            setTimeout(() => {
              if (renderer && typeof renderer.dispose === 'function') {
                renderer.dispose()
              }
            }, 100)
          })
          
          this.preloadPromises.push(preloadPromise)
          
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      await Promise.all(this.preloadPromises)
      
    } catch (error) {
      console.error('Error in preloading:', error)
    } finally {
      document.body.removeChild(tempContainer)
      this.isPreloading = false
      this.preloadPromises = []
    }
  }
  
  static isPreloadComplete(): boolean {
    return this.preloadPromises.length === 0 && !this.isPreloading
  }
  
  static getCacheSize(): number {
    return ModelCache['cache']?.size || 0
  }
}

export default ModelPreloader
