<template>
  <div class="leaderboard-panel">
    <div class="panel-header">
      <h3>
        <svg viewBox="0 0 24 24" width="20" height="20" class="header-icon">
          <path fill="currentColor" d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
        </svg>
        排行榜
      </h3>
      <span class="subtitle">最受欢迎的作品</span>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="leaderboard.length === 0" class="empty">
      <svg viewBox="0 0 24 24" width="48" height="48">
        <path fill="currentColor" d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
      </svg>
      <p>暂无排行数据</p>
      <p class="hint">为喜欢的作品点赞吧</p>
    </div>
    
    <div v-else class="leaderboard-list">
      <div 
        v-for="item in leaderboard" 
        :key="item.id" 
        class="leaderboard-item"
        @click="showDetail(item)"
      >
        <div class="rank" :class="getRankClass(item.rank)">
          <svg v-if="item.rank === 1" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          <svg v-else-if="item.rank === 2" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          <svg v-else-if="item.rank === 3" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          <span v-else>{{ item.rank }}</span>
        </div>
        <img :src="item.image_url" :alt="item.prompt || '纹理图案'" class="thumbnail" />
        <div class="item-info">
          <div class="item-likes">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {{ item.likes }}
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="selectedArtwork" class="detail-overlay" @click.self="closeDetail">
      <div class="detail-modal">
        <button class="close-btn" @click="closeDetail">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <img :src="selectedArtwork.image_url" :alt="selectedArtwork.prompt || '纹理图案'" class="detail-image" />
        <div class="detail-info">
          <div class="rank-badge" :class="getRankClass(selectedArtwork.rank)">
            <svg v-if="selectedArtwork.rank <= 3" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            {{ selectedArtwork.rank <= 3 ? ['第一名', '第二名', '第三名'][selectedArtwork.rank - 1] : `第${selectedArtwork.rank}名` }}
          </div>
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface LeaderboardItem {
  rank: number
  id: number
  image_url: string
  prompt: string
  base_model: string
  style: string
  created_at: string
  likes: number
  is_liked?: boolean
}

const leaderboard = ref<LeaderboardItem[]>([])
const loading = ref(true)
const selectedArtwork = ref<LeaderboardItem | null>(null)

const API_BASE = '/api'

async function loadLeaderboard() {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/gallery/leaderboard`)
    const data = await response.json()
    if (data.success) {
      leaderboard.value = data.leaderboard
    }
  } catch (e) {
    console.error('Failed to load leaderboard:', e)
  } finally {
    loading.value = false
  }
}

async function showDetail(item: LeaderboardItem) {
  try {
    const response = await fetch(`${API_BASE}/gallery/${item.id}`)
    const data = await response.json()
    if (data.success) {
      selectedArtwork.value = {
        ...data.artwork,
        rank: item.rank
      }
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
      
      const index = leaderboard.value.findIndex(a => a.id === selectedArtwork.value!.id)
      if (index !== -1) {
        leaderboard.value[index].likes = data.likes
      }
      
      await loadLeaderboard()
    }
  } catch (e) {
    console.error('Failed to like artwork:', e)
  }
}

function getRankClass(rank: number): string {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return ''
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  loadLeaderboard()
})

defineExpose({
  loadLeaderboard
})
</script>

<style scoped>
.leaderboard-panel {
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--text-color, #C49210);
}

.subtitle {
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

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.leaderboard-item:hover {
  background: rgba(196, 146, 16, 0.1);
}

.rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.rank.gold {
  font-size: 20px;
}

.rank.silver {
  font-size: 20px;
}

.rank.bronze {
  font-size: 20px;
}

.thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-likes {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff6b6b;
  font-size: 13px;
  font-weight: 500;
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

.rank-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.rank-badge.gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
}

.rank-badge.silver {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
  color: #000;
}

.rank-badge.bronze {
  background: linear-gradient(135deg, #CD7F32, #B87333);
  color: #000;
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
</style>
