import { useEditorStore } from '@/stores/editorStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { filesApi } from '@/services/api'
import { useState, useEffect } from 'react'
import { useMobile } from '@/hooks/useMobile'

const LANGUAGES = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'less', label: 'Less' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'yaml', label: 'YAML' },
  { value: 'sql', label: 'SQL' },
  { value: 'shell', label: 'Shell' },
  { value: 'dockerfile', label: 'Dockerfile' },
]

export function StatusBar() {
  const { currentFile, editorContent, setCurrentFile } = useEditorStore()
  const { tabSize } = useSettingsStore()
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [selection, setSelection] = useState({ lines: 0, chars: 0 })
  const isMobile = useMobile()
  
  // 监听编辑器光标位置变化
  useEffect(() => {
    const handleCursorChange = (e: CustomEvent) => {
      setCursorPosition(e.detail.position)
      setSelection(e.detail.selection || { lines: 0, chars: 0 })
    }
    window.addEventListener('editor-cursor-change' as any, handleCursorChange)
    return () => window.removeEventListener('editor-cursor-change' as any, handleCursorChange)
  }, [])
  
  if (!currentFile) return null
  
  const lines = editorContent.split('\n').length
  
  const handleLanguageChange = async (language: string) => {
    try {
      await filesApi.update(currentFile.id, { language })
      setCurrentFile({ ...currentFile, language })
    } catch (error) {
      console.error('Failed to update language:', error)
    }
  }
  
  // 移动端简化显示
  if (isMobile) {
    return (
      <footer className="h-6 border-t flex items-center justify-between px-3 text-xs text-muted-foreground bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span>Ln {cursorPosition.line}</span>
          {selection.chars > 0 && (
            <span className="text-blue-500">{selection.chars} 选中</span>
          )}
        </div>
        <select
          value={currentFile.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-transparent text-foreground border-none outline-none cursor-pointer text-xs"
        >
          {LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value} className="bg-background text-foreground">
              {lang.label}
            </option>
          ))}
        </select>
      </footer>
    )
  }
  
  // 计算文件大小
  const bytes = new Blob([editorContent]).size
  const fileSize = bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
  const words = editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0
  
  return (
    <footer className="h-6 border-t flex items-center justify-between px-3 text-xs text-muted-foreground bg-muted/30 flex-shrink-0">
      <div className="flex items-center gap-4">
        <span>行 {cursorPosition.line}, 列 {cursorPosition.column}</span>
        {selection.chars > 0 && (
          <span className="text-blue-500">已选择 {selection.chars} 字符{selection.lines > 1 ? ` (${selection.lines} 行)` : ''}</span>
        )}
        <span>{lines} 行</span>
        <span>{words} 词</span>
        <span>{fileSize}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <span>Tab: {tabSize}</span>
        <span>{currentFile.encoding.toUpperCase()}</span>
        <select
          value={currentFile.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-transparent text-foreground border-none outline-none cursor-pointer hover:text-blue-500"
        >
          {LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value} className="bg-background text-foreground">
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </footer>
  )
}
