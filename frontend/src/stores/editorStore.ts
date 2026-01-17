import { create } from 'zustand'

export interface FileItem {
  id: number
  name: string
  path: string
  language: string
  is_deleted: boolean
  updated_at: string
}

export interface FileContent extends FileItem {
  content: string
  encoding: string
  created_at: string
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'offline' | 'error'

interface EditorState {
  // 文件列表
  files: FileItem[]
  setFiles: (files: FileItem[]) => void
  
  // 当前文件
  currentFile: FileContent | null
  setCurrentFile: (file: FileContent | null) => void
  
  // 编辑器内容 (可能与保存的内容不同)
  editorContent: string
  setEditorContent: (content: string) => void
  
  // 保存状态
  saveStatus: SaveStatus
  setSaveStatus: (status: SaveStatus) => void
  
  // 侧边栏
  sidebarOpen: boolean
  toggleSidebar: () => void
  
  // 设置面板
  settingsOpen: boolean
  toggleSettings: () => void
  
  // 版本历史面板
  historyOpen: boolean
  toggleHistory: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  files: [],
  setFiles: (files) => set({ files }),
  
  currentFile: null,
  setCurrentFile: (file) => set({ 
    currentFile: file, 
    editorContent: file?.content || '',
    saveStatus: 'saved'
  }),
  
  editorContent: '',
  setEditorContent: (content) => set({ editorContent: content }),
  
  saveStatus: 'saved',
  setSaveStatus: (status) => set({ saveStatus: status }),
  
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  settingsOpen: false,
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  
  historyOpen: false,
  toggleHistory: () => set((state) => ({ historyOpen: !state.historyOpen })),
}))
