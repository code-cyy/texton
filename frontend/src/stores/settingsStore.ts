import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 可选字体列表
export const CODE_FONTS = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
  { value: 'Cascadia Code', label: 'Cascadia Code' },
  { value: 'Source Code Pro', label: 'Source Code Pro' },
  { value: 'Consolas', label: 'Consolas' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'Menlo', label: 'Menlo' },
]

export const UI_FONTS = [
  { value: 'Noto Sans SC', label: 'Noto Sans SC (思源黑体)' },
  { value: 'PingFang SC', label: 'PingFang SC (苹方)' },
  { value: 'Microsoft YaHei', label: 'Microsoft YaHei (微软雅黑)' },
  { value: 'Source Han Sans SC', label: 'Source Han Sans (思源黑体)' },
  { value: 'HarmonyOS Sans SC', label: 'HarmonyOS Sans' },
  { value: 'system-ui', label: '系统默认' },
]

// 配色方案列表
export const COLOR_SCHEMES = [
  // 深色主题
  { value: 'monokai', label: 'Monokai', type: 'dark', preview: { bg: '#272822', fg: '#f8f8f2', accent: '#f92672' } },
  { value: 'mariana', label: 'Mariana', type: 'dark', preview: { bg: '#303841', fg: '#f8f8f2', accent: '#5fb4b4' } },
  { value: 'one-dark', label: 'One Dark', type: 'dark', preview: { bg: '#282c34', fg: '#abb2bf', accent: '#61afef' } },
  { value: 'dracula', label: 'Dracula', type: 'dark', preview: { bg: '#282a36', fg: '#f8f8f2', accent: '#bd93f9' } },
  { value: 'nord', label: 'Nord', type: 'dark', preview: { bg: '#2e3440', fg: '#d8dee9', accent: '#88c0d0' } },
  { value: 'tokyo-night', label: 'Tokyo Night', type: 'dark', preview: { bg: '#1a1b26', fg: '#a9b1d6', accent: '#7aa2f7' } },
  { value: 'github-dark', label: 'GitHub Dark', type: 'dark', preview: { bg: '#0d1117', fg: '#c9d1d9', accent: '#58a6ff' } },
  { value: 'ayu-dark', label: 'Ayu Dark', type: 'dark', preview: { bg: '#0a0e14', fg: '#b3b1ad', accent: '#ffb454' } },
  { value: 'synthwave', label: 'Synthwave', type: 'dark', preview: { bg: '#262335', fg: '#ffffff', accent: '#ff7edb' } },
  // 浅色主题
  { value: 'github-light', label: 'GitHub Light', type: 'light', preview: { bg: '#ffffff', fg: '#24292f', accent: '#0969da' } },
  { value: 'solarized-light', label: 'Solarized Light', type: 'light', preview: { bg: '#fdf6e3', fg: '#657b83', accent: '#268bd2' } },
  { value: 'one-light', label: 'One Light', type: 'light', preview: { bg: '#fafafa', fg: '#383a42', accent: '#4078f2' } },
  { value: 'ayu-light', label: 'Ayu Light', type: 'light', preview: { bg: '#fafafa', fg: '#5c6166', accent: '#ff9940' } },
  { value: 'quiet-light', label: 'Quiet Light', type: 'light', preview: { bg: '#f5f5f5', fg: '#333333', accent: '#4b83cd' } },
]

export type ColorScheme = typeof COLOR_SCHEMES[number]['value']

interface SettingsState {
  // 主题
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // 配色方案
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  
  // 字体设置
  codeFont: string
  setCodeFont: (font: string) => void
  uiFont: string
  setUiFont: (font: string) => void
  
  // 编辑器基础设置
  fontSize: number
  setFontSize: (size: number) => void
  lineHeight: number
  setLineHeight: (height: number) => void
  tabSize: number
  setTabSize: (size: number) => void
  
  // 编辑器显示设置
  wordWrap: boolean
  setWordWrap: (wrap: boolean) => void
  minimap: boolean
  setMinimap: (show: boolean) => void
  lineNumbers: boolean
  setLineNumbers: (show: boolean) => void
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all'
  setRenderWhitespace: (mode: 'none' | 'boundary' | 'selection' | 'trailing' | 'all') => void
  
  // 编辑器行为设置
  autoClosingBrackets: boolean
  setAutoClosingBrackets: (enabled: boolean) => void
  autoClosingQuotes: boolean
  setAutoClosingQuotes: (enabled: boolean) => void
  autoIndent: boolean
  setAutoIndent: (enabled: boolean) => void
  formatOnPaste: boolean
  setFormatOnPaste: (enabled: boolean) => void
  formatOnType: boolean
  setFormatOnType: (enabled: boolean) => void
  
  // 自动补全设置
  quickSuggestions: boolean
  setQuickSuggestions: (enabled: boolean) => void
  suggestOnTriggerCharacters: boolean
  setSuggestOnTriggerCharacters: (enabled: boolean) => void
  acceptSuggestionOnEnter: boolean
  setAcceptSuggestionOnEnter: (enabled: boolean) => void
  snippetSuggestions: 'top' | 'bottom' | 'inline' | 'none'
  setSnippetSuggestions: (mode: 'top' | 'bottom' | 'inline' | 'none') => void
  
  // 光标设置
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin'
  setCursorStyle: (style: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin') => void
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid'
  setCursorBlinking: (mode: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid') => void
  
  // 自动保存
  autoSave: boolean
  setAutoSave: (enabled: boolean) => void
  autoSaveDelay: number
  setAutoSaveDelay: (delay: number) => void
  
  // 新增：滚动设置
  smoothScrolling: boolean
  setSmoothScrolling: (enabled: boolean) => void
  mouseWheelZoom: boolean
  setMouseWheelZoom: (enabled: boolean) => void
  
  // 新增：括号设置
  bracketPairColorization: boolean
  setBracketPairColorization: (enabled: boolean) => void
  matchBrackets: 'never' | 'near' | 'always'
  setMatchBrackets: (mode: 'never' | 'near' | 'always') => void
  
  // 新增：代码折叠
  folding: boolean
  setFolding: (enabled: boolean) => void
  showFoldingControls: 'always' | 'never' | 'mouseover'
  setShowFoldingControls: (mode: 'always' | 'never' | 'mouseover') => void
  
  // 新增：选择与高亮
  selectionHighlight: boolean
  setSelectionHighlight: (enabled: boolean) => void
  occurrencesHighlight: boolean
  setOccurrencesHighlight: (enabled: boolean) => void
  renderLineHighlight: 'none' | 'gutter' | 'line' | 'all'
  setRenderLineHighlight: (mode: 'none' | 'gutter' | 'line' | 'all') => void
  
  // 新增：连字
  fontLigatures: boolean
  setFontLigatures: (enabled: boolean) => void
  
  // 新增：缩进参考线
  renderIndentGuides: boolean
  setRenderIndentGuides: (enabled: boolean) => void
  highlightActiveIndentGuide: boolean
  setHighlightActiveIndentGuide: (enabled: boolean) => void
  
  // 新增：链接检测
  links: boolean
  setLinks: (enabled: boolean) => void
  
  // 新增：拖放
  dragAndDrop: boolean
  setDragAndDrop: (enabled: boolean) => void
  
  // 新增：多光标
  multiCursorModifier: 'ctrlCmd' | 'alt'
  setMultiCursorModifier: (modifier: 'ctrlCmd' | 'alt') => void
  
  // 安全设置
  autoLockEnabled: boolean
  setAutoLockEnabled: (enabled: boolean) => void
  autoLockMinutes: number
  setAutoLockMinutes: (minutes: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      colorScheme: 'mariana',
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
      
      codeFont: 'JetBrains Mono',
      setCodeFont: (font) => set({ codeFont: font }),
      uiFont: 'Noto Sans SC',
      setUiFont: (font) => set({ uiFont: font }),
      
      fontSize: 14,
      setFontSize: (size) => set({ fontSize: size }),
      lineHeight: 1.6,
      setLineHeight: (height) => set({ lineHeight: height }),
      tabSize: 2,
      setTabSize: (size) => set({ tabSize: size }),
      
      wordWrap: true,
      setWordWrap: (wrap) => set({ wordWrap: wrap }),
      minimap: false,
      setMinimap: (show) => set({ minimap: show }),
      lineNumbers: true,
      setLineNumbers: (show) => set({ lineNumbers: show }),
      renderWhitespace: 'selection',
      setRenderWhitespace: (mode) => set({ renderWhitespace: mode }),
      
      autoClosingBrackets: true,
      setAutoClosingBrackets: (enabled) => set({ autoClosingBrackets: enabled }),
      autoClosingQuotes: true,
      setAutoClosingQuotes: (enabled) => set({ autoClosingQuotes: enabled }),
      autoIndent: true,
      setAutoIndent: (enabled) => set({ autoIndent: enabled }),
      formatOnPaste: true,
      setFormatOnPaste: (enabled) => set({ formatOnPaste: enabled }),
      formatOnType: false,
      setFormatOnType: (enabled) => set({ formatOnType: enabled }),
      
      quickSuggestions: true,
      setQuickSuggestions: (enabled) => set({ quickSuggestions: enabled }),
      suggestOnTriggerCharacters: true,
      setSuggestOnTriggerCharacters: (enabled) => set({ suggestOnTriggerCharacters: enabled }),
      acceptSuggestionOnEnter: true,
      setAcceptSuggestionOnEnter: (enabled) => set({ acceptSuggestionOnEnter: enabled }),
      snippetSuggestions: 'inline',
      setSnippetSuggestions: (mode) => set({ snippetSuggestions: mode }),
      
      cursorStyle: 'line',
      setCursorStyle: (style) => set({ cursorStyle: style }),
      cursorBlinking: 'smooth',
      setCursorBlinking: (mode) => set({ cursorBlinking: mode }),
      
      autoSave: true,
      setAutoSave: (enabled) => set({ autoSave: enabled }),
      autoSaveDelay: 500,
      setAutoSaveDelay: (delay) => set({ autoSaveDelay: delay }),
      
      // 新增设置默认值
      smoothScrolling: true,
      setSmoothScrolling: (enabled) => set({ smoothScrolling: enabled }),
      mouseWheelZoom: false,
      setMouseWheelZoom: (enabled) => set({ mouseWheelZoom: enabled }),
      
      bracketPairColorization: true,
      setBracketPairColorization: (enabled) => set({ bracketPairColorization: enabled }),
      matchBrackets: 'always',
      setMatchBrackets: (mode) => set({ matchBrackets: mode }),
      
      folding: true,
      setFolding: (enabled) => set({ folding: enabled }),
      showFoldingControls: 'mouseover',
      setShowFoldingControls: (mode) => set({ showFoldingControls: mode }),
      
      selectionHighlight: true,
      setSelectionHighlight: (enabled) => set({ selectionHighlight: enabled }),
      occurrencesHighlight: true,
      setOccurrencesHighlight: (enabled) => set({ occurrencesHighlight: enabled }),
      renderLineHighlight: 'all',
      setRenderLineHighlight: (mode) => set({ renderLineHighlight: mode }),
      
      fontLigatures: true,
      setFontLigatures: (enabled) => set({ fontLigatures: enabled }),
      
      renderIndentGuides: true,
      setRenderIndentGuides: (enabled) => set({ renderIndentGuides: enabled }),
      highlightActiveIndentGuide: true,
      setHighlightActiveIndentGuide: (enabled) => set({ highlightActiveIndentGuide: enabled }),
      
      links: true,
      setLinks: (enabled) => set({ links: enabled }),
      
      dragAndDrop: true,
      setDragAndDrop: (enabled) => set({ dragAndDrop: enabled }),
      
      multiCursorModifier: 'alt',
      setMultiCursorModifier: (modifier) => set({ multiCursorModifier: modifier }),
      
      // 安全设置
      autoLockEnabled: true,
      setAutoLockEnabled: (enabled) => set({ autoLockEnabled: enabled }),
      autoLockMinutes: 5,
      setAutoLockMinutes: (minutes) => set({ autoLockMinutes: minutes }),
    }),
    {
      name: 'settings-storage',
    }
  )
)
