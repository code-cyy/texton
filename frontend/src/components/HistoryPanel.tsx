import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, RotateCcw, GitCompare, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/stores/editorStore'
import { useSettingsStore, COLOR_SCHEMES } from '@/stores/settingsStore'
import { historyApi } from '@/services/api'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/useMobile'
import { DiffEditor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface Version {
  id: number
  version_number: number
  operation_count: number
  created_at: string
}

export function HistoryPanel() {
  const { historyOpen, toggleHistory, currentFile, editorContent, setCurrentFile } = useEditorStore()
  const { colorScheme, theme, codeFont, fontSize } = useSettingsStore()
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [diffMode, setDiffMode] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [versionContent, setVersionContent] = useState<string>('')
  const [loadingContent, setLoadingContent] = useState(false)
  const [diffChanges, setDiffChanges] = useState<{ added: number; removed: number }>({ added: 0, removed: 0 })
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0)
  const [totalChanges, setTotalChanges] = useState(0)
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null)
  const isMobile = useMobile()
  
  useEffect(() => {
    if (historyOpen && currentFile) {
      loadVersions()
      setDiffMode(false)
      setSelectedVersion(null)
    }
  }, [historyOpen, currentFile?.id])
  
  const loadVersions = async () => {
    if (!currentFile) return
    setLoading(true)
    try {
      const response = await historyApi.getVersions(currentFile.id)
      setVersions(response.data)
    } catch (error) {
      console.error('Failed to load versions:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCompare = async (version: Version) => {
    if (!currentFile) return
    setLoadingContent(true)
    setSelectedVersion(version)
    
    try {
      const response = await historyApi.getVersionContent(currentFile.id, version.id)
      setVersionContent(response.data.content)
      setDiffMode(true)
      setCurrentChangeIndex(0)
      
      // 计算差异统计
      const oldLines = response.data.content.split('\n')
      const newLines = editorContent.split('\n')
      let added = 0, removed = 0
      
      // 简单的行级别差异统计
      const oldSet = new Set(oldLines)
      const newSet = new Set(newLines)
      
      newLines.forEach((line: string) => {
        if (!oldSet.has(line)) added++
      })
      oldLines.forEach((line: string) => {
        if (!newSet.has(line)) removed++
      })
      
      setDiffChanges({ added, removed })
    } catch (error) {
      console.error('Failed to load version content:', error)
    } finally {
      setLoadingContent(false)
    }
  }
  
  const handleRestore = async (version: Version) => {
    if (!currentFile) return
    if (!confirm(`确定恢复到版本 ${version.version_number}？当前未保存的更改将丢失。`)) return
    
    try {
      const response = await historyApi.restoreVersion(currentFile.id, version.id)
      setCurrentFile(response.data)
      setDiffMode(false)
      setSelectedVersion(null)
      toggleHistory()
    } catch (error) {
      console.error('Failed to restore version:', error)
    }
  }

  const handleDiffEditorMount = (editor: editor.IStandaloneDiffEditor) => {
    diffEditorRef.current = editor
    
    // 获取差异导航器
    setTimeout(() => {
      const lineChanges = editor.getLineChanges()
      if (lineChanges) {
        setTotalChanges(lineChanges.length)
        if (lineChanges.length > 0) {
          // 自动跳转到第一个差异
          const firstChange = lineChanges[0]
          editor.revealLineInCenter(firstChange.modifiedStartLineNumber)
        }
      }
    }, 100)
  }

  const navigateToChange = (direction: 'prev' | 'next') => {
    if (!diffEditorRef.current) return
    
    const lineChanges = diffEditorRef.current.getLineChanges()
    if (!lineChanges || lineChanges.length === 0) return
    
    let newIndex = currentChangeIndex
    if (direction === 'next') {
      newIndex = (currentChangeIndex + 1) % lineChanges.length
    } else {
      newIndex = (currentChangeIndex - 1 + lineChanges.length) % lineChanges.length
    }
    
    setCurrentChangeIndex(newIndex)
    const change = lineChanges[newIndex]
    diffEditorRef.current.revealLineInCenter(change.modifiedStartLineNumber)
  }

  const closeDiff = () => {
    setDiffMode(false)
    setSelectedVersion(null)
    setVersionContent('')
  }
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 6) return `${hours} 小时前`
    
    // 超过 6 小时显示具体日期时间
    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()
    
    const timeStr = date.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
    
    if (isToday) {
      return `今天 ${timeStr}`
    }
    if (isYesterday) {
      return `昨天 ${timeStr}`
    }
    
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getThemeName = () => {
    const scheme = COLOR_SCHEMES.find(s => s.value === colorScheme)
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? colorScheme : 'github-light'
    }
    if (scheme) {
      if (theme === 'dark' && scheme.type === 'light') return 'mariana'
      if (theme === 'light' && scheme.type === 'dark') return 'github-light'
    }
    return colorScheme
  }
  
  return (
    <AnimatePresence>
      {historyOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => { if (!diffMode) toggleHistory() }}
          />
          
          {/* Diff 对比视图 */}
          <AnimatePresence>
            {diffMode && selectedVersion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "fixed bg-background z-50 flex flex-col overflow-hidden",
                  isMobile 
                    ? "inset-2 rounded-lg" 
                    : "left-4 right-[336px] top-14 bottom-4 rounded-lg border shadow-2xl"
                )}
              >
                {/* Diff 头部 */}
                <div className="h-12 border-b flex items-center justify-between px-4 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      版本 {selectedVersion.version_number} vs 当前
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-500">+{diffChanges.added} 行</span>
                      <span className="text-red-500">-{diffChanges.removed} 行</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {totalChanges > 0 && (
                      <div className="flex items-center gap-1 mr-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateToChange('prev')}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                          {currentChangeIndex + 1} / {totalChanges}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateToChange('next')}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRestore(selectedVersion)}
                      className="text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      恢复此版本
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeDiff}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Diff 标签 */}
                <div className="h-8 border-b flex text-xs flex-shrink-0">
                  <div className="flex-1 flex items-center justify-center bg-red-500/10 text-red-500 border-r">
                    版本 {selectedVersion.version_number} (历史)
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-green-500/10 text-green-500">
                    当前版本
                  </div>
                </div>
                
                {/* Diff 编辑器 */}
                <div className="flex-1">
                  {loadingContent ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <DiffEditor
                      height="100%"
                      language={currentFile?.language || 'plaintext'}
                      original={versionContent}
                      modified={editorContent}
                      theme={getThemeName()}
                      onMount={handleDiffEditorMount}
                      options={{
                        readOnly: true,
                        renderSideBySide: !isMobile,
                        fontSize: fontSize,
                        fontFamily: `'${codeFont}', 'Fira Code', 'Consolas', monospace`,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        renderOverviewRuler: true,
                        diffWordWrap: 'on',
                        ignoreTrimWhitespace: false,
                        renderIndicators: true,
                        originalEditable: false,
                      }}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 版本列表面板 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 bottom-0 bg-background border-l z-50 flex flex-col",
              isMobile ? "w-full" : "w-80"
            )}
          >
            <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
              <h2 className="font-semibold">版本历史</h2>
              <Button variant="ghost" size="icon" onClick={toggleHistory}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : versions.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p>暂无版本历史</p>
                  <p className="text-xs mt-2 opacity-70">编辑文件后会自动创建版本快照</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {/* 当前版本 */}
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        当前版本
                      </span>
                      <span className="text-xs text-muted-foreground">未保存</span>
                    </div>
                  </div>
                  
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        selectedVersion?.id === version.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-transparent hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            版本 {version.version_number}
                          </span>
                          {index === 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              最近
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleCompare(version)}
                            title="对比差异"
                          >
                            <GitCompare className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleRestore(version)}
                            title="恢复此版本"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(version.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 底部提示 */}
            <div className="p-3 border-t text-xs text-muted-foreground text-center">
              点击 <GitCompare className="h-3 w-3 inline" /> 查看与当前版本的差异
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
