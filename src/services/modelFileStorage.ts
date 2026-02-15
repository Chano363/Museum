import { ModelCacheData } from './particleRenderer'

class ModelFileStorage {
  private static CACHE_VERSION = 'v2'
  private static VERSION_KEY = 'model_cache_version'
  
  private static encodeBase64(str: string): string {
    try {
      const bytes = new TextEncoder().encode(str)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      return btoa(binary)
    } catch (error) {
      console.warn('Base64 encoding failed:', error)
      return str
    }
  }

  private static decodeBase64(encoded: string): string {
    try {
      const binary = atob(encoded)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return new TextDecoder().decode(bytes)
    } catch (error) {
      console.warn('Base64 decoding failed:', error)
      return encoded
    }
  }
  private static STORAGE_DIR = 'model-cache'
  private static MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7天

  private static getStoragePath(): string {
    return `${this.STORAGE_DIR}`
  }

  private static async ensureStorageDir(): Promise<void> {
    try {
      const storagePath = this.getStoragePath()
      if (typeof localStorage !== 'undefined') {
        const currentVersion = localStorage.getItem(this.VERSION_KEY)
        if (currentVersion !== this.CACHE_VERSION) {
          console.log('🔄 检测到缓存版本更新，清除旧缓存...')
          await this.clear()
          localStorage.setItem(this.VERSION_KEY, this.CACHE_VERSION)
          console.log('✅ 旧缓存已清除')
        }
      }
    } catch (error) {
      console.error('Error ensuring storage directory:', error)
    }
  }

  private static getFilePath(modelPath: string): string {
    const safeName = modelPath
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
    return `${this.getStoragePath()}/${safeName}.json`
  }

  static async serializeModelData(data: ModelCacheData): Promise<string> {
    const serialized = {
      positions: Array.from(data.positions),
      colors: Array.from(data.colors),
      particleCount: data.particleCount,
      center: [data.center.x, data.center.y, data.center.z],
      scale: data.scale,
      timestamp: Date.now()
    }
    
    const json = JSON.stringify(serialized)
    return json
  }

  static async deserializeModelData(json: string): Promise<ModelCacheData | null> {
    try {
      const parsed = JSON.parse(json)
      if (!parsed || typeof parsed !== 'object') {
        return null
      }

      return {
        positions: new Float32Array(parsed.positions),
        colors: new Float32Array(parsed.colors),
        particleCount: parsed.particleCount,
        center: {
          x: parsed.center[0],
          y: parsed.center[1],
          z: parsed.center[2]
        },
        scale: parsed.scale
      }
    } catch (error) {
      console.error('Error deserializing model data:', error)
      return null
    }
  }

  static async set(key: string, data: ModelCacheData): Promise<void> {
    try {
      await this.ensureStorageDir()
      
      if (typeof localStorage !== 'undefined') {
        const json = await this.serializeModelData(data)
        const encoded = this.encodeBase64(json)
        const storageKey = `model_cache_${key.replace(/\//g, '_')}`
        
        const originalSizeKB = new Blob([json]).size / 1024
        const encodedSizeKB = new Blob([encoded]).size / 1024
        
        localStorage.setItem(storageKey, encoded)
      }
    } catch (error) {
      console.error('Error storing model data to file:', error)
    }
  }

  static async get(key: string): Promise<ModelCacheData | null> {
    try {
      if (typeof localStorage !== 'undefined') {
        const storageKey = `model_cache_${key.replace(/\//g, '_')}`
        const encoded = localStorage.getItem(storageKey)
        
        if (encoded) {
          try {
            const json = this.decodeBase64(encoded)
            const data = await this.deserializeModelData(json)
            if (data) {
              return data
            }
          } catch (error) {
            const data = await this.deserializeModelData(encoded)
            if (data) {
              return data
            }
          }
        }
      }
      return null
    } catch (error) {
      console.error('Error retrieving model data from file:', error)
      return null
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const storageKey = `model_cache_${key.replace(/\//g, '_')}`
        localStorage.removeItem(storageKey)
      }
    } catch (error) {
      console.error('Error deleting model data from file:', error)
    }
  }

  static async clear(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('model_cache_')) {
            localStorage.removeItem(key)
          }
        }
      }
    } catch (error) {
      console.error('Error clearing model data:', error)
    }
  }

  static async getSize(): Promise<number> {
    try {
      if (typeof localStorage !== 'undefined') {
        let count = 0
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('model_cache_')) {
            count++
          }
        }
        return count
      }
      return 0
    } catch (error) {
      console.error('Error getting storage size:', error)
      return 0
    }
  }
}

export { ModelFileStorage }
