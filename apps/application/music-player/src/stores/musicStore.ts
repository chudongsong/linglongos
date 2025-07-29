import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Song, Playlist } from '../types'

// 模拟API调用的延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 示例数据
const sampleSongs: Song[] = [
  {
    id: '1',
    title: '七里香',
    artist: '周杰伦',
    album: '七里香',
    cover: 'https://p2.music.126.net/9kZl6NRj3HxmQQ8DqTjZ4Q==/109951165625990489.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=186001.mp3',
    duration: 296,
    isFavorite: false,
  },
  {
    id: '2',
    title: '晴天',
    artist: '周杰伦',
    album: '叶惠美',
    cover: 'https://p1.music.126.net/cUTk0ewrQtYGP2YpPZoUng==/3265549553028224.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=186016.mp3',
    duration: 269,
    isFavorite: true,
  },
  {
    id: '3',
    title: '稻香',
    artist: '周杰伦',
    album: '魔杰座',
    cover: 'https://p1.music.126.net/2O9I0aPc0BjRZP1kKOSrzQ==/109951163061832350.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=185809.mp3',
    duration: 223,
    isFavorite: false,
  },
  {
    id: '4',
    title: '青花瓷',
    artist: '周杰伦',
    album: '我很忙',
    cover: 'https://p2.music.126.net/X0EDfXzxMQJiQ-71JFGdZw==/109951163020570422.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=185811.mp3',
    duration: 239,
    isFavorite: false,
  },
  {
    id: '5',
    title: '告白气球',
    artist: '周杰伦',
    album: '周杰伦的床边故事',
    cover: 'https://p1.music.126.net/zUv0JxO8pxbJDRt0SnYN1g==/109951163120085136.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=418603077.mp3',
    duration: 215,
    isFavorite: true,
  },
]

const samplePlaylists: Playlist[] = [
  {
    id: '1',
    name: '我的周杰伦',
    description: '周杰伦经典歌曲合集',
    cover: 'https://p1.music.126.net/cUTk0ewrQtYGP2YpPZoUng==/3265549553028224.jpg',
    songCount: 3,
    songs: [sampleSongs[0], sampleSongs[1], sampleSongs[2]],
  },
  {
    id: '2',
    name: '轻松时刻',
    description: '放松心情的音乐',
    cover: 'https://p2.music.126.net/X0EDfXzxMQJiQ-71JFGdZw==/109951163020570422.jpg',
    songCount: 2,
    songs: [sampleSongs[3], sampleSongs[4]],
  },
]

// 创建音乐存储
export const useMusicStore = defineStore('music', () => {
  // 状态
  const currentSong = ref<Song | null>(null)
  const playlist = ref<Song[]>([])
  const playIndex = ref(-1)
  const favoriteSongs = ref<Song[]>([sampleSongs[1], sampleSongs[4]])
  const playHistory = ref<(Song & { playedAt: number })[]>([
    { ...sampleSongs[0], playedAt: Date.now() - 3600000 },
    { ...sampleSongs[2], playedAt: Date.now() - 7200000 },
  ])
  const userPlaylists = ref<Playlist[]>(samplePlaylists)
  const isLoading = ref(false)
  const searchResults = ref<Song[]>([])

  // 计算属性
  const nextSong = computed(() => {
    if (playlist.value.length === 0 || playIndex.value === -1) return null
    const nextIndex = (playIndex.value + 1) % playlist.value.length
    return playlist.value[nextIndex]
  })

  const previousSong = computed(() => {
    if (playlist.value.length === 0 || playIndex.value === -1) return null
    const prevIndex = (playIndex.value - 1 + playlist.value.length) % playlist.value.length
    return playlist.value[prevIndex]
  })

  // 方法
  const setCurrentSong = (song: Song) => {
    currentSong.value = song
    addToPlayHistory(song)
  }

  const setPlaylist = (songs: Song[]) => {
    playlist.value = songs
    playIndex.value = 0
  }

  const playNextSong = () => {
    if (playlist.value.length === 0) return
    playIndex.value = (playIndex.value + 1) % playlist.value.length
    currentSong.value = playlist.value[playIndex.value]
    addToPlayHistory(currentSong.value)
  }

  const playPreviousSong = () => {
    if (playlist.value.length === 0) return
    playIndex.value = (playIndex.value - 1 + playlist.value.length) % playlist.value.length
    currentSong.value = playlist.value[playIndex.value]
    addToPlayHistory(currentSong.value)
  }

  const addToFavorites = (song: Song) => {
    if (!favoriteSongs.value.some(s => s.id === song.id)) {
      favoriteSongs.value.push({ ...song, isFavorite: true })
    }
  }

  const removeFromFavorites = (songId: string) => {
    favoriteSongs.value = favoriteSongs.value.filter(song => song.id !== songId)

    // 更新当前歌曲的收藏状态
    if (currentSong.value && currentSong.value.id === songId) {
      currentSong.value = { ...currentSong.value, isFavorite: false }
    }
  }

  const addToPlayHistory = (song: Song) => {
    // 移除相同歌曲的历史记录
    playHistory.value = playHistory.value.filter(s => s.id !== song.id)

    // 添加到历史记录开头
    playHistory.value.unshift({
      ...song,
      playedAt: Date.now(),
    })

    // 限制历史记录数量
    if (playHistory.value.length > 50) {
      playHistory.value = playHistory.value.slice(0, 50)
    }
  }

  const clearPlayHistory = () => {
    playHistory.value = []
  }

  const createPlaylist = (playlist: Omit<Playlist, 'id' | 'songCount'>) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      ...playlist,
      songCount: playlist.songs.length,
    }

    userPlaylists.value.push(newPlaylist)
  }

  const addSongToPlaylist = (playlistId: string, song: Song) => {
    const playlist = userPlaylists.value.find(p => p.id === playlistId)
    if (playlist && !playlist.songs.some(s => s.id === song.id)) {
      playlist.songs.push(song)
      playlist.songCount = playlist.songs.length
    }
  }

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    const playlist = userPlaylists.value.find(p => p.id === playlistId)
    if (playlist) {
      playlist.songs = playlist.songs.filter(s => s.id !== songId)
      playlist.songCount = playlist.songs.length
    }
  }

  // API调用模拟
  const fetchRecommendedSongs = async () => {
    isLoading.value = true
    await delay(500)
    isLoading.value = false
    return sampleSongs
  }

  const fetchHotSongs = async () => {
    isLoading.value = true
    await delay(500)
    isLoading.value = false
    return sampleSongs
  }

  const fetchUserPlaylists = async () => {
    isLoading.value = true
    await delay(500)
    isLoading.value = false
    return userPlaylists.value
  }

  const fetchFavoriteSongs = async () => {
    isLoading.value = true
    await delay(500)
    isLoading.value = false
    return favoriteSongs.value
  }

  const fetchPlayHistory = async () => {
    isLoading.value = true
    await delay(500)
    isLoading.value = false
    return playHistory.value
  }

  const searchMusic = async (query: string) => {
    isLoading.value = true
    await delay(500)

    // 模拟搜索结果
    searchResults.value = sampleSongs.filter(
      song =>
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase()) ||
        song.album.toLowerCase().includes(query.toLowerCase())
    )

    isLoading.value = false
    return searchResults.value
  }

  return {
    // 状态
    currentSong,
    playlist,
    playIndex,
    favoriteSongs,
    playHistory,
    userPlaylists,
    isLoading,
    searchResults,

    // 计算属性
    nextSong,
    previousSong,

    // 方法
    setCurrentSong,
    setPlaylist,
    playNextSong,
    playPreviousSong,
    addToFavorites,
    removeFromFavorites,
    addToPlayHistory,
    clearPlayHistory,
    createPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,

    // API调用
    fetchRecommendedSongs,
    fetchHotSongs,
    fetchUserPlaylists,
    fetchFavoriteSongs,
    fetchPlayHistory,
    searchMusic,
  }
})
