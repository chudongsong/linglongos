<template>
  <div class="music-player">
    <div class="player-container">
      <!-- 播放器头部 -->
      <div class="player-header">
        <div class="player-title">
          <h1>灵龙音乐</h1>
        </div>
        <div class="player-search">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索音乐..." 
            @keyup.enter="searchMusic"
          />
          <button @click="searchMusic">搜索</button>
        </div>
      </div>

      <!-- 播放器主体 -->
      <div class="player-main">
        <!-- 左侧菜单 -->
        <div class="player-sidebar">
          <div class="menu-item" :class="{ active: currentView === 'discover' }" @click="currentView = 'discover'">
            <i class="icon-discover"></i>
            <span>发现音乐</span>
          </div>
          <div class="menu-item" :class="{ active: currentView === 'playlist' }" @click="currentView = 'playlist'">
            <i class="icon-playlist"></i>
            <span>我的歌单</span>
          </div>
          <div class="menu-item" :class="{ active: currentView === 'favorite' }" @click="currentView = 'favorite'">
            <i class="icon-heart"></i>
            <span>我喜欢的</span>
          </div>
          <div class="menu-item" :class="{ active: currentView === 'history' }" @click="currentView = 'history'">
            <i class="icon-history"></i>
            <span>播放历史</span>
          </div>
        </div>

        <!-- 右侧内容 -->
        <div class="player-content">
          <component :is="currentViewComponent" />
        </div>
      </div>

      <!-- 播放器控制栏 -->
      <div class="player-controls">
        <div class="song-info">
          <div v-if="currentSong" class="song-cover">
            <img :src="currentSong.cover" :alt="currentSong.title" />
          </div>
          <div v-if="currentSong" class="song-details">
            <div class="song-title">{{ currentSong.title }}</div>
            <div class="song-artist">{{ currentSong.artist }}</div>
          </div>
          <div v-else class="no-song">
            <span>未播放歌曲</span>
          </div>
        </div>

        <div class="control-buttons">
          <button class="btn-prev" @click="playPrevious">
            <i class="icon-previous"></i>
          </button>
          <button class="btn-play" @click="togglePlay">
            <i :class="isPlaying ? 'icon-pause' : 'icon-play'"></i>
          </button>
          <button class="btn-next" @click="playNext">
            <i class="icon-next"></i>
          </button>
        </div>

        <div class="progress-container">
          <span class="time-current">{{ formatTime(currentTime) }}</span>
          <div class="progress-bar" @click="seek">
            <div class="progress-current" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <span class="time-total">{{ formatTime(duration) }}</span>
        </div>

        <div class="volume-container">
          <i :class="isMuted ? 'icon-volume-mute' : 'icon-volume'"></i>
          <div class="volume-slider" @click="adjustVolume">
            <div class="volume-current" :style="{ width: volumePercentage + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, markRaw } from 'vue';
import { Howl } from 'howler';
import DiscoverView from './views/DiscoverView.vue';
import PlaylistView from './views/PlaylistView.vue';
import FavoriteView from './views/FavoriteView.vue';
import HistoryView from './views/HistoryView.vue';
import { useMusicStore } from './stores/musicStore';

// 视图管理
const currentView = ref('discover');
const viewComponents = {
  discover: markRaw(DiscoverView),
  playlist: markRaw(PlaylistView),
  favorite: markRaw(FavoriteView),
  history: markRaw(HistoryView)
};

const currentViewComponent = computed(() => viewComponents[currentView.value]);

// 音乐存储
const musicStore = useMusicStore();
const { currentSong } = musicStore;

// 播放器状态
const isPlaying = ref(false);
const isMuted = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(0.7);
const searchQuery = ref('');

// 音频对象
let sound: Howl | null = null;

// 计算属性
const progressPercentage = computed(() => {
  return duration.value ? (currentTime.value / duration.value) * 100 : 0;
});

const volumePercentage = computed(() => {
  return volume.value * 100;
});

// 方法
const togglePlay = () => {
  if (!currentSong.value) return;
  
  if (sound) {
    if (isPlaying.value) {
      sound.pause();
    } else {
      sound.play();
    }
    isPlaying.value = !isPlaying.value;
  } else {
    loadAndPlaySong(currentSong.value);
  }
};

const playNext = () => {
  musicStore.playNextSong();
  if (currentSong.value) {
    loadAndPlaySong(currentSong.value);
  }
};

const playPrevious = () => {
  musicStore.playPreviousSong();
  if (currentSong.value) {
    loadAndPlaySong(currentSong.value);
  }
};

const seek = (event: MouseEvent) => {
  if (!sound || !duration.value) return;
  
  const progressBar = event.currentTarget as HTMLElement;
  const rect = progressBar.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = x / rect.width;
  const seekTime = percentage * duration.value;
  
  sound.seek(seekTime);
  currentTime.value = seekTime;
};

const adjustVolume = (event: MouseEvent) => {
  if (!sound) return;
  
  const volumeBar = event.currentTarget as HTMLElement;
  const rect = volumeBar.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const newVolume = Math.max(0, Math.min(1, x / rect.width));
  
  volume.value = newVolume;
  sound.volume(newVolume);
  
  if (newVolume === 0) {
    isMuted.value = true;
  } else if (isMuted.value) {
    isMuted.value = false;
  }
};

const toggleMute = () => {
  if (!sound) return;
  
  isMuted.value = !isMuted.value;
  sound.mute(isMuted.value);
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const loadAndPlaySong = (song: any) => {
  if (sound) {
    sound.stop();
    sound.unload();
  }
  
  sound = new Howl({
    src: [song.url],
    html5: true,
    volume: volume.value,
    onplay: () => {
      isPlaying.value = true;
      updateProgress();
    },
    onpause: () => {
      isPlaying.value = false;
    },
    onstop: () => {
      isPlaying.value = false;
    },
    onend: () => {
      isPlaying.value = false;
      playNext();
    },
    onload: () => {
      duration.value = sound?.duration() || 0;
    }
  });
  
  sound.play();
};

const updateProgress = () => {
  if (sound && isPlaying.value) {
    currentTime.value = sound.seek();
    requestAnimationFrame(updateProgress);
  }
};

const searchMusic = () => {
  if (searchQuery.value.trim()) {
    musicStore.searchMusic(searchQuery.value);
  }
};

// 生命周期钩子
onMounted(() => {
  // 初始化加载一些推荐歌曲
  musicStore.fetchRecommendedSongs();
});

onUnmounted(() => {
  if (sound) {
    sound.stop();
    sound.unload();
  }
});
</script>

<style scoped>
.music-player {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #f5f5f5;
  color: #333;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.player-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.player-title h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.player-search {
  display: flex;
  align-items: center;
}

.player-search input {
  width: 200px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
  outline: none;
}

.player-search button {
  padding: 8px 15px;
  background-color: #1db954;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.player-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.player-sidebar {
  width: 200px;
  background-color: #fff;
  border-right: 1px solid #eee;
  padding: 20px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f0f0f0;
}

.menu-item.active {
  background-color: #f0f0f0;
  border-left: 3px solid #1db954;
}

.menu-item i {
  margin-right: 10px;
  font-size: 18px;
}

.player-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.player-controls {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background-color: #fff;
  border-top: 1px solid #eee;
  height: 80px;
}

.song-info {
  display: flex;
  align-items: center;
  width: 250px;
}

.song-cover {
  width: 50px;
  height: 50px;
  margin-right: 15px;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.song-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.song-artist {
  font-size: 12px;
  color: #777;
}

.no-song {
  color: #999;
}

.control-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.control-buttons button {
  background: none;
  border: none;
  cursor: pointer;
  margin: 0 15px;
  font-size: 24px;
  color: #333;
}

.btn-play {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #1db954;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-container {
  display: flex;
  align-items: center;
  flex: 2;
  margin: 0 20px;
}

.time-current, .time-total {
  font-size: 12px;
  color: #777;
  width: 40px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background-color: #ddd;
  border-radius: 2px;
  margin: 0 10px;
  cursor: pointer;
  position: relative;
}

.progress-current {
  height: 100%;
  background-color: #1db954;
  border-radius: 2px;
  position: absolute;
  top: 0;
  left: 0;
}

.volume-container {
  display: flex;
  align-items: center;
  width: 150px;
}

.volume-container i {
  margin-right: 10px;
  cursor: pointer;
}

.volume-slider {
  flex: 1;
  height: 4px;
  background-color: #ddd;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.volume-current {
  height: 100%;
  background-color: #1db954;
  border-radius: 2px;
  position: absolute;
  top: 0;
  left: 0;
}

/* 图标样式 */
.icon-discover:before { content: "🔍"; }
.icon-playlist:before { content: "📋"; }
.icon-heart:before { content: "❤️"; }
.icon-history:before { content: "🕒"; }
.icon-previous:before { content: "⏮"; }
.icon-play:before { content: "▶"; }
.icon-pause:before { content: "⏸"; }
.icon-next:before { content: "⏭"; }
.icon-volume:before { content: "🔊"; }
.icon-volume-mute:before { content: "🔇"; }
</style>