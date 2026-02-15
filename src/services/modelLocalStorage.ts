import * as THREE from 'three'
import { ModelCacheData } from './particleRenderer'

interface SerializedModelCacheData {
  positions: string
  colors: string
  particleCount: number
  center: [number, number, number]
  scale: number
  timestamp: number
}

class ModelLocalStorage {
  private static DB_NAME = 'ModelCacheDB'
  private static DB_VERSION = 1
  private static STORE_NAME = 'modelData'
  private static MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7天

  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME)
        }
      }
    })
  }

  static async serializeModelData(data: ModelCacheData): Promise<SerializedModelCacheData> {
    return {
      positions: this.arrayBufferToBase64(data.positions.buffer),
      colors: this.arrayBufferToBase64(data.colors.buffer),
      particleCount: data.particleCount,
      center: [data.center.x, data.center.y, data.center.z],
      scale: data.scale,
      timestamp: Date.now()
    }
  }

  static async deserializeModelData(serialized: SerializedModelCacheData): Promise<ModelCacheData> {
    return {
      positions: new Float32Array(this.base64ToArrayBuffer(serialized.positions)),
      colors: new Float32Array(this.base64ToArrayBuffer(serialized.colors)),
      particleCount: serialized.particleCount,
      center: new THREE.Vector3(...serialized.center),
      scale: serialized.scale
    }
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const buffer = new ArrayBuffer(binary.length)
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return buffer
  }

  static async set(key: string, data: ModelCacheData): Promise<void> {
    try {
      console.log('📦 IndexedDB存储开始:', key)
      const db = await this.getDB()
      const transaction = db.transaction(this.STORE_NAME, 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      
      const serialized = await this.serializeModelData(data)
      console.log('📦 序列化完成，数据大小:', Math.round(serialized.positions.length / 1024), 'KB')
      store.put(serialized, key)
      
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log('✅ IndexedDB存储成功:', key)
          resolve()
        }
        transaction.onerror = () => {
          console.error('❌ IndexedDB存储失败:', key)
          reject(new Error('Failed to store model data'))
        }
      })
    } catch (error) {
      console.error('Error storing model data:', error)
      throw error
    }
  }

  static async get(key: string): Promise<ModelCacheData | null> {
    try {
      console.log('🔍 IndexedDB查询:', key)
      const db = await this.getDB()
      const transaction = db.transaction(this.STORE_NAME, 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      
      const request = store.get(key)
      
      const serialized = await new Promise<SerializedModelCacheData | undefined>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(new Error('Failed to retrieve model data'))
      })
      
      if (!serialized) {
        console.log('❌ IndexedDB未找到:', key)
        return null
      }
      
      if (Date.now() - serialized.timestamp > this.MAX_AGE) {
        console.log('⏰ IndexedDB数据已过期:', key)
        await this.delete(key)
        return null
      }
      
      console.log('✅ IndexedDB找到数据:', key)
      return await this.deserializeModelData(serialized)
    } catch (error) {
      console.error('Error retrieving model data:', error)
      return null
    }
  }

  static async has(key: string): Promise<boolean> {
    try {
      const data = await this.get(key)
      return data !== null
    } catch (error) {
      console.error('Error checking model data existence:', error)
      return false
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction(this.STORE_NAME, 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      
      store.delete(key)
      
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(new Error('Failed to delete model data'))
      })
    } catch (error) {
      console.error('Error deleting model data:', error)
    }
  }

  static async clear(): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction(this.STORE_NAME, 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      
      store.clear()
      
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(new Error('Failed to clear model data'))
      })
    } catch (error) {
      console.error('Error clearing model data:', error)
    }
  }

  static async getSize(): Promise<number> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction(this.STORE_NAME, 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      
      const request = store.getAllKeys()
      
      const keys = await new Promise<string[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as string[])
        request.onerror = () => reject(new Error('Failed to get all keys'))
      })
      
      return keys.length
    } catch (error) {
      console.error('Error getting storage size:', error)
      return 0
    }
  }
}

export { ModelLocalStorage }