<template>
  <div class="playlist-view">
    <h2>我的歌单</h2>
    
    <div class="create-playlist">
      <button @click="showCreatePlaylistModal = true">
        <i class="icon-add"></i> 创建歌单
      </button>
    </div>
    
    <div class="playlist-list">
      <div v-for="playlist in userPlaylists" :key="playlist.id" class="playlist-item" @click="selectPlaylist(playlist)">
        <div class="playlist-cover">
          <img :src="playlist.cover" :alt="playlist.name" />
        </div>
        <div class="playlist-info">
          <div class="playlist-name">{{ playlist.name }}</div>
          <div class="playlist-count">{{ playlist.songCount }}首歌曲</div>
        </div>
      </div>
    </div>
    
    <div v-if="selectedPlaylist" class="selected-playlist">
      <div class="playlist-header">
        <div class="playlist-cover-large">
          <img :src="selectedPlaylist.cover" :alt="selectedPlaylist.name" />
        </div>
        <div class="playlist-details">
          <h3>{{ selectedPlaylist.name }}</h3>
          <p>{{ selectedPlaylist.description }}</p>
          <div class="playlist-actions">
            <button class="btn-play-all" @click="playAll">
              <i class="icon-play"></i> 播放全部
            </button>
            <button class="btn-edit" @click="editPlaylist">
              <i class="icon-edit"></i> 编辑
            </button>
          </div>
        </div>
      </div>
      
      <div class="song-list">
        <div v-for="(song, index) in selectedPlaylist.songs" :key="song.id" class="song-item" @click="playSong(song)">
          <div class="song-index">{{ index + 1 }}</div>
          <div class="song-cover">
            <img :src="song.cover" :alt="song.title" />
          </div>
          <div class="song-info">
            <div class="song-title">{{ song.title }}</div>
            <div class="song-artist">{{ song.artist }}</div>
          </div>
          <div class="song-duration">{{ formatTime(song.duration) }}</div>
          <div class="song-actions">
            <button @click.stop="removeSongFromPlaylist(song)">
              <i class="icon-delete"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 创建歌单弹窗 -->
    <div v-if="showCreatePlaylistModal" class="modal">
      <div class="modal-content">
        <h3>创建歌单</h3>
        <div class="form-group">
          <label>歌单名称</label>
          <input v-model="newPlaylist.name" type="text" placeholder="请输入歌单名称" />
        </div>
        <div class="form-group">
          <label>歌单描述</label>
          <textarea v-model="newPlaylist.description" placeholder="请输入歌单描述"></textarea>
        </div>
        <div class="modal-actions">
          <button @click="showCreatePlaylistModal = false">取消</button>
          <button @click="createPlaylist" class="btn-primary">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMusicStore } from '../stores/musicStore';

const musicStore = useMusicStore();

const userPlaylists = ref([]);
const selectedPlaylist = ref(null);
const showCreatePlaylistModal = ref(false);
const newPlaylist = ref({
  name: '',
  description: ''
});

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const selectPlaylist = (playlist: any) => {
  selectedPlaylist.value = playlist;
};

const playSong = (song: any) => {
  musicStore.setCurrentSong(song);
  musicStore.addToPlayHistory(song);
};

const playAll = () => {
  if (selectedPlaylist.value && selectedPlaylist.value.songs.length > 0) {
    musicStore.setPlaylist(selectedPlaylist.value.songs);
    musicStore.setCurrentSong(selectedPlaylist.value.songs[0]);
  }
};

const editPlaylist = () => {
  // 实现编辑歌单功能
};

const removeSongFromPlaylist = (song: any) => {
  if (selectedPlaylist.value) {
    musicStore.removeSongFromPlaylist(selectedPlaylist.value.id, song.id);
    // 更新当前选中的歌单
    const updatedPlaylist = userPlaylists.value.find(p => p.id === selectedPlaylist.value.id);
    if (updatedPlaylist) {
      selectedPlaylist.value = updatedPlaylist;
    }
  }
};

const createPlaylist = () => {
  if (newPlaylist.value.name.trim()) {
    musicStore.createPlaylist({
      name: newPlaylist.value.name,
      description: newPlaylist.value.description,
      songs: []
    });
    
    // 重置表单
    newPlaylist.value = {
      name: '',
      description: ''
    };
    
    showCreatePlaylistModal.value = false;
    
    // 刷新歌单列表
    loadUserPlaylists();
  }
};

const loadUserPlaylists = async () => {
  userPlaylists.value = await musicStore.fetchUserPlaylists();
  
  // 如果有歌单，默认选中第一个
  if (userPlaylists.value.length > 0) {
    selectedPlaylist.value = userPlaylists.value[0];
  }
};

onMounted(() => {
  loadUserPlaylists();
});
</script>

<style scoped>
.playlist-view {
  padding: 20px;
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
}

.create-playlist {
  margin-bottom: 20px;
}

.create-playlist button {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  background-color: #1db954;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.create-playlist button i {
  margin-right: 5px;
}

.playlist-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.playlist-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.playlist-item:hover {
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

.playlist-count {
  font-size: 12px;
  color: #777;
}

.selected-playlist {
  margin-top: 30px;
}

.playlist-header {
  display: flex;
  margin-bottom: 30px;
}

.playlist-cover-large {
  width: 200px;
  height: 200px;
  margin-right: 30px;
  border-radius: 8px;
  overflow: hidden;
}

.playlist-cover-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-details {
  flex: 1;
}

.playlist-details h3 {
  font-size: 24px;
  margin-bottom: 10px;
}

.playlist-details p {
  color: #777;
  margin-bottom: 20px;
}

.playlist-actions {
  display: flex;
}

.playlist-actions button {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

.btn-play-all {
  background-color: #1db954;
  color: white;
}

.btn-edit {
  background-color: #f0f0f0;
  color: #333;
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
  margin-right: 20px;
}

.song-actions button {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
}

.song-actions button:hover {
  color: #ff5252;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 400px;
}

.modal-content h3 {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group textarea {
  height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.modal-actions button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

.btn-primary {
  background-color: #1db954;
  color: white;
}

/* 图标样式 */
.icon-add:before { content: "+"; }
.icon-play:before { content: "▶"; }
.icon-edit:before { content: "✏️"; }
.icon-delete:before { content: "🗑️"; }
</style>