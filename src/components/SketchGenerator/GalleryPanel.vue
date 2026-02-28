<template>
  <div class="gallery-panel">
    <div class="panel-header">
      <h3>作品集</h3>
      <span class="count">{{ total }} 件作品</span>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="artworks.length === 0" class="empty">
      <svg viewBox="0 0 24 24" width="48" height="48">
        <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
      <p>暂无作品</p>
      <p class="hint">生成并保存作品后会显示在这里</p>
    </div>
    
    <div v-else class="artwork-grid">
      <div 
        v-for="artwork in artworks" 
        :key="artwork.id" 
        class="artwork-card"
        @click="showDetail(artwork)"
      >
        <img :src="artwork.image_url" :alt="artwork.prompt || '青铜器纹理'" />
        <div class="artwork-info">
          <div class="likes">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {{ artwork.likes }}
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="selectedArtwork" class="detail-overlay" @click.self="closeDetail">
      <div class="detail-modal">
        <button class="close-btn" @click="closeDetail">×</button>
        <img :src="selectedArtwork.image_url" :alt="selectedArtwork.prompt || '青铜器纹理'" class="detail-image" />
        <div class="detail-info">
          <div class="detail-stats">
            <span class="likes-count">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              {{ selectedArtwork.likes }} 点赞
            </span>
            <span class="created-time">{{ formatDate(selectedArtwork.created_at) }}</span>
          </div>
          <div v-if="selectedArtwork.prompt" class="prompt-text">
            {{ selectedArtwork.prompt }}
          </div>
          <div class="detail-actions">
            <button 
              class="like-btn" 
              :class="{ liked: selectedArtwork.is_liked }"
              @click="handleLike"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              {{ selectedArtwork.is_liked ? '已点赞' : '点赞' }}
            </button>
            <button 
              class="delete-btn" 
              @click="handleDelete"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Artwork {
  id: number
  image_url: string
  prompt: string
  bronze_type: string
  style: string
  created_at: string
  likes: number
  is_liked?: boolean
}

const artworks = ref<Artwork[]>([])
const total = ref(0)
const loading = ref(true)
const selectedArtwork = ref<Artwork | null>(null)

const API_BASE = '/api'

const emit = defineEmits<{
  (e: 'delete', artworkId: number): void
}>()

async function loadArtworks() {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/gallery/list`)
    const data = await response.json()
    if (data.success) {
      artworks.value = data.artworks
      total.value = data.total
    }
  } catch (e) {
    console.error('Failed to load artworks:', e)
  } finally {
    loading.value = false
  }
}

async function showDetail(artwork: Artwork) {
  try {
    const response = await fetch(`${API_BASE}/gallery/${artwork.id}`)
    const data = await response.json()
    if (data.success) {
      selectedArtwork.value = data.artwork
    }
  } catch (e) {
    console.error('Failed to load artwork detail:', e)
  }
}

function closeDetail() {
  selectedArtwork.value = null
}

async function handleLike() {
  if (!selectedArtwork.value) return
  
  try {
    const response = await fetch(`${API_BASE}/gallery/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artwork_id: selectedArtwork.value.id
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      selectedArtwork.value.likes = data.likes
      selectedArtwork.value.is_liked = data.liked
      
      const index = artworks.value.findIndex(a => a.id === selectedArtwork.value!.id)
      if (index !== -1) {
        artworks.value[index].likes = data.likes
      }
    }
  } catch (e) {
    console.error('Failed to like artwork:', e)
  }
}

async function handleDelete() {
  if (!selectedArtwork.value) return
  
  if (!confirm('确定要删除这个作品吗？')) return
  
  try {
    const response = await fetch(`${API_BASE}/gallery/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artwork_id: selectedArtwork.value.id
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      const deletedId = selectedArtwork.value.id
      artworks.value = artworks.value.filter(a => a.id !== deletedId)
      total.value--
      emit('delete', deletedId)
      closeDetail()
    }
  } catch (e) {
    console.error('Failed to delete artwork:', e)
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadArtworks()
})

defineExpose({
  loadArtworks
})
</script>

<style scoped>
.gallery-panel {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(196, 146, 16, 0.2);
  border-radius: 12px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.panel-header h3 {
  color: var(--text-color, #C49210);
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.count {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: rgba(196, 146, 16, 0.5);
  gap: 12px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(196, 146, 16, 0.3);
  border-top-color: var(--text-color, #C49210);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: rgba(196, 146, 16, 0.5);
  gap: 8px;
}

.empty p {
  margin: 0;
  font-size: 14px;
}

.empty .hint {
  font-size: 12px;
  opacity: 0.7;
}

.artwork-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.artwork-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.artwork-card:hover {
  transform: scale(1.05);
}

.artwork-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
}

.likes {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff6b6b;
  font-size: 11px;
}

.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
}

.detail-modal {
  position: relative;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  background: rgba(26, 26, 26, 0.95);
  border-radius: 12px;
  border: 1px solid var(--text-color, #C49210);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: var(--text-color, #C49210);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.detail-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
}

.detail-info {
  padding: 14px;
  flex-shrink: 0;
}

.detail-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.likes-count {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #ff6b6b;
  font-size: 14px;
}

.created-time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.prompt-text {
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.detail-actions {
  display: flex;
  gap: 10px;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border: 1px solid #ff6b6b;
  border-radius: 6px;
  background: transparent;
  color: #ff6b6b;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.like-btn:hover {
  background: rgba(255, 107, 107, 0.2);
}

.like-btn.liked {
  background: rgba(255, 107, 107, 0.3);
}

.delete-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border: 1px solid #ff6b6b;
  border-radius: 6px;
  background: transparent;
  color: #ff6b6b;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: rgba(255, 107, 107, 0.2);
}
</style>
