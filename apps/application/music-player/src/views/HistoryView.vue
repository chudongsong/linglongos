<template>
  <div class="history-view">
    <h2>播放历史</h2>
    
    <div class="history-controls">
      <button class="btn-clear" @click="clearHistory">
        <i class="icon-delete"></i> 清空历史记录
      </button>
    </div>
    
    <div v-if="playHistory.length > 0" class="song-list">
      <div v-for="(song, index) in playHistory" :key="`${song.id}-${index}`" class="song-item" @click="playSong(song)">
        <div class="song-cover">
          <img :src="song.cover" :alt="song.title" />
        </div>
        <div class="song-info">
          <div class="song-title">{{ song.title }}</div>
          <div class="song-artist">{{ song.artist }}</div>
        </div>
        <div class="song-album">{{ song.album }}</div>
        <div class="song-time">{{ formatDate(song.playedAt) }}</div>
        <div class="song-actions">
          <button @click.stop="addToFavorites(song)" :class="{ 'active': song.isFavorite }">
            <i :class="song.isFavorite ? 'icon-heart-filled' : 'icon-heart'"></i>
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <div class="empty-icon">🕒</div>
      <div class="empty-text">暂无播放历史</div>
      <div class="empty-subtext">你播放的音乐将会显示在这里</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMusicStore } from '../stores/musicStore';

const musicStore = useMusicStore();
const playHistory = ref([]);

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
};

const playSong = (song: any) => {
  musicStore.setCurrentSong(song);
  musicStore.addToPlayHistory(song);
};

const addToFavorites = (song: any) => {
  if (song.isFavorite) {
    musicStore.removeFromFavorites(song.id);
  } else {
    musicStore.addToFavorites(song);
  }
  
  // 刷新播放历史
  loadPlayHistory();
};

const clearHistory = () => {
  if (confirm('确定要清空播放历史吗？')) {
    musicStore.clearPlayHistory();
    loadPlayHistory();
  }
};

const loadPlayHistory = async () => {
  playHistory.value = await musicStore.fetchPlayHistory();
};

onMounted(() => {
  loadPlayHistory();
});
</script>

<style scoped>
.history-view {
  padding: 20px;
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
}

.history-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.btn-clear {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-clear i {
  margin-right: 5px;
}

.song-list {
  display: flex;
  flex-direction: column;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
}

.song-item:hover {
  background-color: #f0f0f0;
}

.song-cover {
  width: 40px;
  height: 40px;
  margin-right: 15px;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.song-info {
  flex: 1;
}

.song-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.song-artist {
  font-size: 12px;
  color: #777;
}

.song-album {
  width: 150px;
  font-size: 12px;
  color: #777;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-time {
  width: 120px;
  color: #999;
  font-size: 12px;
  text-align: right;
}

.song-actions {
  width: 40px;
  text-align: center;
}

.song-actions button {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
}

.song-actions button.active {
  color: #ff4757;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 10px;
  color: #555;
}

.empty-subtext {
  font-size: 14px;
  color: #777;
}

/* 图标样式 */
.icon-delete:before { content: "🗑️"; }
.icon-heart:before { content: "♡"; }
.icon-heart-filled:before { content: "❤️"; }
</style>