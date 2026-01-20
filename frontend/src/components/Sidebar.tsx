import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  Trash2,
  RefreshCw,
  Edit3,
  Copy,
  Download,
  Upload,
  Archive,
  Search,
  X,
  CloudCog,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileIcon } from '@/components/FileIcon'
import { useEditorStore, FileItem } from '@/stores/editorStore'
import { filesApi, systemApi } from '@/services/api'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/useMobile'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  file: FileItem | null
}

interface UpdateInfo {
  hasUpdate: boolean
  latestVersion?: string
  currentVersion?: string
  message?: string
  releaseNotes?: string
  updateUrl?: string
  type?: 'release' | 'commit'
  checking: boolean
  updating: boolean
  showModal: boolean
  updateLog?: string
}

interface ToastInfo {
  visible: boolean
  type: 'success' | 'error' | 'info'
  message: string
}

// 可排序的文件项组件
function SortableFileItem({
  file,
  isSelected,
  onSelect,
  onContextMenu,
}: {
  file: FileItem
  isSelected: boolean
  onSelect: (file: FileItem) => void
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded group',
        'text-sm',
        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
      )}
      onClick={() => onSelect(file)}
      onContextMenu={(e) => onContextMenu(e, file)}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 opacity-0 group-hover:opacity-50 hover:!opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" />
      </div>
      <FileIcon filename={file.name} />
      <span className="truncate flex-1">{file.name}</span>
    </div>
  )
}

export function Sidebar() {
  const { files, setFiles, currentFile, setCurrentFile, sidebarOpen, toggleSidebar } = useEditorStore()
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [renaming, setRenaming] = useState<FileItem | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, file: null })
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ hasUpdate: false, checking: false, updating: false, showModal: false })
  const [appVersion, setAppVersion] = useState('1.0.0')
  const [toast, setToast] = useState<ToastInfo>({ visible: false, type: 'info', message: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMobile()

  const showToast = (type: ToastInfo['type'], message: string) => {
    setToast({ visible: true, type, message })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
  }
  
  const loadFiles = async () => {
    setLoading(true)
    try {
      const response = await filesApi.list()
      setFiles(response.data)
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVersion = async () => {
    try {
      const response = await systemApi.version()
      setAppVersion(response.data.version || '1.0.0')
    } catch (error) {
      console.error('Failed to load version:', error)
    }
  }
  
  useEffect(() => {
    loadFiles()
    loadVersion()
  }, [])

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }))
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])
  
  const handleSelect = async (file: FileItem) => {
    try {
      const response = await filesApi.get(file.id)
      setCurrentFile(response.data)
      // 移动端选择文件后自动关闭侧边栏
      if (isMobile) {
        toggleSidebar()
      }
    } catch (error) {
      console.error('Failed to load file:', error)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, file })
  }
  
  const handleDelete = async (file: FileItem) => {
    if (!confirm(`确定删除 "${file.name}"？`)) return
    try {
      await filesApi.delete(file.id)
      if (currentFile?.id === file.id) setCurrentFile(null)
      loadFiles()
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  const handleRename = async () => {
    if (!renaming || !renameValue.trim()) return
    try {
      const newPath = renaming.path.replace(renaming.name, renameValue)
      await filesApi.update(renaming.id, { name: renameValue, path: newPath })
      setRenaming(null)
      setRenameValue('')
      loadFiles()
      if (currentFile?.id === renaming.id) {
        const response = await filesApi.get(renaming.id)
        setCurrentFile(response.data)
      }
    } catch (error) {
      console.error('Failed to rename file:', error)
    }
  }

  const handleDuplicate = async (file: FileItem) => {
    try {
      const response = await filesApi.duplicate(file.id)
      loadFiles()
      setCurrentFile(response.data)
    } catch (error) {
      console.error('Failed to duplicate file:', error)
    }
  }

  const handleExport = async (file: FileItem) => {
    try {
      const response = await filesApi.export(file.id)
      const blob = new Blob([response.data], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export file:', error)
    }
  }

  const handleExportAll = async () => {
    // 弹出密码输入框
    const password = prompt('设置 ZIP 解压密码（留空则不加密）：')
    
    try {
      showToast('info', '正在导出...')
      const response = await filesApi.exportAll(password || undefined)
      const blob = new Blob([response.data], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `texton-backup-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)
      showToast('success', password ? '导出成功（已加密）' : '导出成功')
    } catch (error) {
      console.error('Failed to export all files:', error)
      showToast('error', '导出失败')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await filesApi.import(data)
      loadFiles()
    } catch (error) {
      console.error('Failed to import files:', error)
      alert('导入失败，请检查文件格式')
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCheckUpdate = async () => {
    setUpdateInfo(prev => ({ ...prev, checking: true }))
    try {
      const response = await systemApi.checkUpdate()
      const data = response.data
      
      if (data.error) {
        showToast('error', data.error || '检查更新失败')
        setUpdateInfo({ hasUpdate: false, checking: false, updating: false, showModal: false })
        return
      }
      
      // 没有更新时直接提示
      if (!data.has_update) {
        showToast('success', '已是最新版本')
        setUpdateInfo({ hasUpdate: false, checking: false, updating: false, showModal: false })
        return
      }
      
      // 有更新时显示弹窗
      setUpdateInfo({
        hasUpdate: true,
        latestVersion: data.latest_version,
        currentVersion: data.current_version,
        message: data.message,
        releaseNotes: data.release_notes,
        updateUrl: data.update_url,
        type: data.type,
        checking: false,
        updating: false,
        showModal: true,
      })
    } catch (error) {
      console.error('Failed to check update:', error)
      showToast('error', '检查更新失败，请检查网络连接')
      setUpdateInfo({ hasUpdate: false, checking: false, updating: false, showModal: false })
    }
  }

  const handlePerformUpdate = async () => {
    setUpdateInfo(prev => ({ ...prev, updating: true, updateLog: '正在更新...\n' }))
    
    try {
      const response = await systemApi.performUpdate()
      const output = response.data.output || ''
      
      if (response.data.success) {
        setUpdateInfo(prev => ({ 
          ...prev, 
          updating: false,
          updateLog: output + '\n\n✅ 更新完成！页面将在 3 秒后刷新...'
        }))
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        // 检查是否实际上更新成功了（git pull 输出包含更新信息）
        const isActuallySuccess = output.includes('->') || output.includes('Already up to date')
        
        if (isActuallySuccess) {
          setUpdateInfo(prev => ({ 
            ...prev, 
            updating: false,
            updateLog: output + '\n\n✅ 更新完成！页面将在 3 秒后刷新...'
          }))
          setTimeout(() => {
            window.location.reload()
          }, 3000)
        } else {
          setUpdateInfo(prev => ({ 
            ...prev, 
            updating: false,
            updateLog: '❌ 更新失败:\n' + (response.data.error || response.data.message || '未知错误')
          }))
        }
      }
    } catch (error) {
      console.error('Failed to perform update:', error)
      setUpdateInfo(prev => ({ 
        ...prev, 
        updating: false,
        updateLog: '❌ 更新失败，请手动更新'
      }))
    }
  }

  const closeUpdateModal = () => {
    setUpdateInfo(prev => ({ ...prev, showModal: false, updateLog: undefined }))
  }
  
  const handleCreate = async () => {
    if (!newFileName.trim()) return
    try {
      const response = await filesApi.create({
        name: newFileName,
        path: `/${newFileName}`,
        content: '',
        language: getLanguageFromName(newFileName),
      })
      setCreating(false)
      setNewFileName('')
      loadFiles()
      setCurrentFile(response.data)
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }
  
  const getLanguageFromName = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
      py: 'python', go: 'go', html: 'html', css: 'css', scss: 'scss', less: 'less',
      json: 'json', md: 'markdown', txt: 'plaintext', xml: 'xml', yaml: 'yaml',
      yml: 'yaml', sql: 'sql', sh: 'shell', bash: 'shell', java: 'java',
      c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', rs: 'rust', rb: 'ruby', php: 'php',
    }
    return langMap[ext || ''] || 'plaintext'
  }

  const filteredFiles = searchQuery
    ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : files

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filteredFiles.findIndex(f => f.id === active.id)
    const newIndex = filteredFiles.findIndex(f => f.id === over.id)

    const newFiles = arrayMove(filteredFiles, oldIndex, newIndex)
    setFiles(newFiles)

    // 保存排序到后端
    try {
      await filesApi.reorder(newFiles.map(f => f.id))
    } catch (error) {
      console.error('Failed to save order:', error)
      loadFiles() // 恢复原顺序
    }
  }
  
  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* 移动端遮罩层 */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
                onClick={toggleSidebar}
              />
            )}
            <motion.div
              initial={isMobile ? { x: -280 } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0 } : { width: 240, opacity: 1 }}
              exit={isMobile ? { x: -280 } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "h-full border-r bg-muted/50 dark:bg-[#22262A] flex flex-col overflow-hidden",
                isMobile ? "fixed left-0 top-0 z-40 w-[280px]" : ""
              )}
              style={{ minWidth: isMobile ? 280 : (sidebarOpen ? 240 : 0) }}
            >
              <div className="p-2 border-b flex items-center justify-between">
                <span className="text-sm font-medium">文件</span>
                <div className="flex items-center gap-1">
                  {isMobile && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleSidebar} title="关闭">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSearch(!showSearch)} title="搜索">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadFiles} title="刷新">
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCreating(true)} title="新建文件">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

            {showSearch && (
              <div className="p-2 border-b flex items-center gap-2">
                <Input
                  placeholder="搜索文件..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => { setShowSearch(false); setSearchQuery('') }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {creating && (
              <div className="p-2 border-b">
                <Input
                  placeholder="文件名"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                    if (e.key === 'Escape') { setCreating(false); setNewFileName('') }
                  }}
                  autoFocus
                />
              </div>
            )}

            {renaming && (
              <div className="p-2 border-b">
                <Input
                  placeholder="新文件名"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename()
                    if (e.key === 'Escape') { setRenaming(null); setRenameValue('') }
                  }}
                  autoFocus
                />
              </div>
            )}
            
            <div className="flex-1 overflow-auto py-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredFiles.map(f => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredFiles.map(file => (
                    <SortableFileItem
                      key={file.id}
                      file={file}
                      isSelected={currentFile?.id === file.id}
                      onSelect={handleSelect}
                      onContextMenu={handleContextMenu}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              
              {filteredFiles.length === 0 && !loading && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery ? '未找到匹配的文件' : '暂无文件'}
                </div>
              )}
            </div>

            {/* 底部工具栏 */}
            <div className="p-2 border-t">
              {/* 工具按钮和版本号 */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/50 pl-1">v{appVersion}</span>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 relative" 
                    onClick={handleCheckUpdate} 
                    title="检测更新"
                    disabled={updateInfo.checking}
                  >
                    {updateInfo.checking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : updateInfo.hasUpdate ? (
                      <>
                        <CloudCog className="h-4 w-4 text-blue-500" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />
                      </>
                    ) : (
                      <CloudCog className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExportAll} title="导出全部">
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fileInputRef.current?.click()} title="导入">
                    <Upload className="h-4 w-4" />
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                </div>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 右键菜单 */}
      <AnimatePresence>
        {contextMenu.visible && contextMenu.file && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-background border rounded-lg shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <ContextMenuItem icon={<Edit3 className="h-4 w-4" />} label="重命名" onClick={() => { setRenaming(contextMenu.file); setRenameValue(contextMenu.file!.name) }} />
            <ContextMenuItem icon={<Copy className="h-4 w-4" />} label="复制" onClick={() => handleDuplicate(contextMenu.file!)} />
            <ContextMenuItem icon={<Download className="h-4 w-4" />} label="导出" onClick={() => handleExport(contextMenu.file!)} />
            <div className="h-px bg-border my-1" />
            <ContextMenuItem icon={<Trash2 className="h-4 w-4" />} label="删除" onClick={() => handleDelete(contextMenu.file!)} className="text-red-500 hover:text-red-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast 提示 */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-20 left-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium",
              toast.type === 'success' && "bg-green-500 text-white",
              toast.type === 'error' && "bg-red-500 text-white",
              toast.type === 'info' && "bg-blue-500 text-white"
            )}
          >
            {toast.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {toast.type === 'error' && <XCircle className="h-4 w-4" />}
            {toast.type === 'info' && <AlertCircle className="h-4 w-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 更新弹窗 */}
      <AnimatePresence>
        {updateInfo.showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[200]"
              onClick={!updateInfo.updating ? closeUpdateModal : undefined}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed z-[201] w-[calc(100%-2rem)] max-w-md bg-background rounded-xl shadow-2xl overflow-hidden"
              style={{ 
                left: '50%', 
                top: '50%', 
                transform: 'translate(-50%, -50%)',
                maxHeight: 'calc(100vh - 4rem)'
              }}
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {updateInfo.updateLog ? '更新日志' : '发现新版本'}
                  </h3>
                  {!updateInfo.updating && (
                    <button onClick={closeUpdateModal} className="p-1 hover:bg-muted rounded">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 max-h-80 overflow-auto">
                {updateInfo.updateLog ? (
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-3 rounded-lg">
                    {updateInfo.updateLog}
                  </pre>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <CloudCog className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {updateInfo.type === 'release' 
                            ? `新版本 v${updateInfo.latestVersion}` 
                            : `新提交 #${updateInfo.latestVersion}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          当前版本: v{appVersion}
                        </div>
                      </div>
                    </div>
                    
                    {(updateInfo.message || updateInfo.releaseNotes) && (
                      <div className="bg-muted p-3 rounded-lg text-sm">
                        <div className="font-medium mb-1">更新内容:</div>
                        <div className="text-muted-foreground whitespace-pre-wrap">
                          {updateInfo.releaseNotes || updateInfo.message}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="p-4 border-t flex gap-2">
                {!updateInfo.updateLog && (
                  <>
                    <Button variant="outline" className="flex-1" onClick={closeUpdateModal}>
                      稍后再说
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={handlePerformUpdate}
                      disabled={updateInfo.updating}
                    >
                      {updateInfo.updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          更新中...
                        </>
                      ) : (
                        '立即更新'
                      )}
                    </Button>
                  </>
                )}
                {updateInfo.updateLog && !updateInfo.updating && (
                  <Button className="flex-1" onClick={closeUpdateModal}>
                    关闭
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function ContextMenuItem({ icon, label, onClick, className }: { icon: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left", className)}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}
