<template>
  <div class="discover-view">
    <h2>发现音乐</h2>
    
    <div class="section">
      <h3>推荐歌单</h3>
      <div class="playlist-grid">
        <div v-for="playlist in recommendedPlaylists" :key="playlist.id" class="playlist-card">
          <div class="playlist-cover">
            <img :src="playlist.cover" :alt="playlist.name" />
          </div>
          <div class="playlist-name">{{ playlist.name }}</div>
          <div class="playlist-desc">{{ playlist.description }}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3>热门歌曲</h3>
      <div class="song-list">
        <div v-for="(song, index) in hotSongs" :key="song.id" class="song-item" @click="playSong(song)">
          <div class="song-index">{{ index + 1 }}</div>
          <div class="song-cover">
            <img :src="song.cover" :alt="song.title" />
          </div>
          <div class="song-info">
            <div class="song-title">{{ song.title }}</div>
            <div class="song-artist">{{ song.artist }}</div>
          </div>
          <div class="song-duration">{{ formatTime(song.duration) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMusicStore } from '../stores/musicStore';

const musicStore = useMusicStore();

const recommendedPlaylists = ref([
  {
    id: '1',
    name: '华语流行',
    description: '最热华语流行音乐',
    cover: 'https://p2.music.126.net/5CJeYN35NwDrWXXgDHGDKA==/109951165474121408.jpg'
  },
  {
    id: '2',
    name: '轻音乐',
    description: '放松心情的轻音乐',
    cover: 'https://p2.music.126.net/8ZRSyI-ZQCpB8HVfVPv8aw==/109951165474121408.jpg'
  },
  {
    id: '3',
    name: '经典摇滚',
    description: '永不过时的摇滚经典',
    cover: 'https://p2.music.126.net/9VdkBUKO8K1NV0uu3HUTHw==/109951165474121408.jpg'
  },
  {
    id: '4',
    name: '爵士乐',
    description: '慵懒午后的爵士时光',
    cover: 'https://p2.music.126.net/7xQsJcFbS2ITGQVJGLSyPQ==/109951165474121408.jpg'
  }
]);

const hotSongs = ref([]);

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const playSong = (song: any) => {
  musicStore.setCurrentSong(song);
  musicStore.addToPlayHistory(song);
};

onMounted(async () => {
  // 获取热门歌曲
  hotSongs.value = await musicStore.fetchHotSongs();
});
</script>

<style scoped>
.discover-view {
  padding: 20px;
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
}

.section {
  margin-bottom: 30px;
}

h3 {
  font-size: 18px;
  margin-bottom: 15px;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.playlist-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.playlist-card:hover {
  transform: translateY(-5px);
}

.playlist-cover {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 8px;
}

.playlist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.playlist-desc {
  font-size: 12px;
  color: #777;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.song-duration {
  color: #999;
  font-size: 12px;
}
</style>