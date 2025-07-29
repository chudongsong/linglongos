/**
 * 音乐播放器类型定义
 */

/**
 * 歌曲信息
 */
export interface Song {
  /** 歌曲ID */
  id: string
  /** 歌曲标题 */
  title: string
  /** 歌手 */
  artist: string
  /** 专辑 */
  album: string
  /** 封面图片URL */
  cover: string
  /** 音频文件URL */
  url: string
  /** 时长（秒） */
  duration: number
  /** 是否收藏 */
  isFavorite: boolean
}

/**
 * 歌单信息
 */
export interface Playlist {
  /** 歌单ID */
  id: string
  /** 歌单名称 */
  name: string
  /** 歌单描述 */
  description: string
  /** 歌单封面 */
  cover: string
  /** 歌曲数量 */
  songCount: number
  /** 歌曲列表 */
  songs: Song[]
}

/**
 * 菜单位置
 */
export interface MenuPosition {
  x: number
  y: number
}
