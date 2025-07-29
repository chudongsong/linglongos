/**
 * 玲珑OS应用注册表
 *
 * 这个文件导出所有应用，便于主项目导入和使用
 */

// 导入所有应用
import FileManager from '../../../file-manager/src/index'
import Terminal from './terminal/src/index'
import Settings from './settings/src/index'
import TaskManager from './task-manager/src/index'
import ImageViewer from './image-viewer/src/index'
import VideoPlayer from './video-player/src/index'
import MarkdownEditor from './markdown-editor/src/index'
import CodeEditor from './code-editor/src/index'
import MusicPlayer from './music-player/src/index'

// 应用类型定义
export interface AppDefinition {
  id: string
  name: string
  icon: string
  component: any
  defaultSize?: { width: number; height: number }
  defaultPosition?: { x: number; y: number }
  singleton?: boolean
  category?: string
}

// 应用注册表
export const appRegistry: Record<string, AppDefinition> = {
  'file-manager': {
    id: 'file-manager',
    name: '文件管理器',
    icon: 'folder',
    component: FileManager,
    defaultSize: { width: 800, height: 600 },
    category: 'system',
  },
  terminal: {
    id: 'terminal',
    name: '终端',
    icon: 'terminal',
    component: Terminal,
    defaultSize: { width: 700, height: 500 },
    category: 'system',
  },
  settings: {
    id: 'settings',
    name: '设置',
    icon: 'settings',
    component: Settings,
    defaultSize: { width: 800, height: 600 },
    singleton: true,
    category: 'system',
  },
  'task-manager': {
    id: 'task-manager',
    name: '任务管理器',
    icon: 'activity',
    component: TaskManager,
    defaultSize: { width: 700, height: 500 },
    singleton: true,
    category: 'system',
  },
  'image-viewer': {
    id: 'image-viewer',
    name: '图片查看器',
    icon: 'image',
    component: ImageViewer,
    defaultSize: { width: 800, height: 600 },
    category: 'media',
  },
  'video-player': {
    id: 'video-player',
    name: '视频播放器',
    icon: 'video',
    component: VideoPlayer,
    defaultSize: { width: 800, height: 600 },
    category: 'media',
  },
  'music-player': {
    id: 'music-player',
    name: '音乐播放器',
    icon: 'music',
    component: MusicPlayer,
    defaultSize: { width: 900, height: 600 },
    category: 'media',
  },
  'markdown-editor': {
    id: 'markdown-editor',
    name: 'Markdown编辑器',
    icon: 'file-text',
    component: MarkdownEditor,
    defaultSize: { width: 800, height: 600 },
    category: 'editors',
  },
  'code-editor': {
    id: 'code-editor',
    name: '代码编辑器',
    icon: 'code',
    component: CodeEditor,
    defaultSize: { width: 800, height: 600 },
    category: 'editors',
  },
}

// 按类别分组的应用
export const appsByCategory = Object.values(appRegistry).reduce(
  (acc, app) => {
    const category = app.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(app)
    return acc
  },
  {} as Record<string, AppDefinition[]>
)

// 导出所有应用
export {
  FileManager,
  Terminal,
  Settings,
  TaskManager,
  ImageViewer,
  VideoPlayer,
  MusicPlayer,
  MarkdownEditor,
  CodeEditor,
}

// 默认导出应用注册表
export default appRegistry
