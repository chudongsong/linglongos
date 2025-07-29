<template>
  <div class="favorite-view">
    <h2>我喜欢的音乐</h2>
    
    <div v-if="favoriteSongs.length > 0" class="favorite-controls">
      <button class="btn-play-all" @click="playAll">
        <i class="icon-play"></i> 播放全部
      </button>
    </div>
    
    <div v-if="favoriteSongs.length > 0" class="song-list">
      <div v-for="(song, index) in favoriteSongs" :key="song.id" class="song-item" @click="playSong(song)">
        <div class="song-index">{{ index + 1 }}</div>
        <div class="song-cover">
          <img :src="song.cover" :alt="song.title" />
        </div>
        <div class="song-info">
          <div class="song-title">{{ song.title }}</div>
          <div class="song-artist">{{ song.artist }}</div>
        </div>
        <div class="song-album">{{ song.album }}</div>
        <div class="song-duration">{{ formatTime(song.duration) }}</div>
        <div class="song-actions">
          <button @click.stop="removeFromFavorites(song)">
            <i class="icon-heart-filled"></i>
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <div class="empty-icon">❤️</div>
      <div class="empty-text">你还没有添加喜欢的音乐</div>
      <div class="empty-subtext">在播放音乐时点击心形图标，将音乐添加到这里</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMusicStore } from '../stores/musicStore';

const musicStore = useMusicStore();
const favoriteSongs = ref([]);

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const playSong = (song: any) => {
  musicStore.setCurrentSong(song);
  musicStore.addToPlayHistory(song);
};

const playAll = () => {
  if (favoriteSongs.value.length > 0) {
    musicStore.setPlaylist(favoriteSongs.value);
    musicStore.setCurrentSong(favoriteSongs.value[0]);
  }
};

const removeFromFavorites = (song: any) => {
  musicStore.removeFromFavorites(song.id);
  // 刷新喜欢的歌曲列表
  loadFavoriteSongs();
};

const loadFavoriteSongs = async () => {
  favoriteSongs.value = await musicStore.fetchFavoriteSongs();
};

onMounted(() => {
  loadFavoriteSongs();
});
</script>

<style scoped>
.favorite-view {
  padding: 20px;
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
}

.favorite-controls {
  margin-bottom: 20px;
}

.btn-play-all {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  background-color: #1db954;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-play-all i {
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

.song-index {
  width: 30px;
  text-align: center;
  color: #999;
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

.song-duration {
  width: 50px;
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
  color: #ff4757;
  cursor: pointer;
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
.icon-play:before { content: "▶"; }
.icon-heart-filled:before { content: "❤️"; }
</style>