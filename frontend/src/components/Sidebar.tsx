import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  ChevronRight,
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileIcon } from '@/components/FileIcon'
import { useEditorStore, FileItem } from '@/stores/editorStore'
import { filesApi, systemApi } from '@/services/api'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/useMobile'

interface FileTreeNode {
  name: string
  path: string
  isFolder: boolean
  children: FileTreeNode[]
  file?: FileItem
}

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
  updateUrl?: string
  type?: 'release' | 'commit'
  checking: boolean
  updating: boolean
}

interface ToastInfo {
  visible: boolean
  type: 'success' | 'error' | 'info'
  message: string
}

function buildFileTree(files: FileItem[]): FileTreeNode[] {
  const root: FileTreeNode[] = []
  
  files.forEach(file => {
    const parts = file.path.split('/').filter(Boolean)
    let current = root
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      let node = current.find(n => n.name === part)
      
      if (!node) {
        node = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          isFolder: !isLast,
          children: [],
          file: isLast ? file : undefined,
        }
        current.push(node)
      }
      
      if (!isLast) {
        current = node.children
      }
    })
  })
  
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1
      if (!a.isFolder && b.isFolder) return 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach(n => sortNodes(n.children))
  }
  sortNodes(root)
  
  return root
}

function FileTreeItem({
  node,
  level = 0,
  onSelect,
  onContextMenu,
  selectedId,
}: {
  node: FileTreeNode
  level?: number
  onSelect: (file: FileItem) => void
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void
  selectedId?: number
}) {
  const [expanded, setExpanded] = useState(true)
  
  const isSelected = node.file?.id === selectedId
  
  if (node.isFolder) {
    return (
      <div>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 cursor-pointer rounded hover:bg-accent",
            "text-sm text-muted-foreground"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronRight className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")} />
          {expanded ? <FolderOpen className="h-4 w-4 text-yellow-500" /> : <Folder className="h-4 w-4 text-yellow-500" />}
          <span className="truncate">{node.name}</span>
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {node.children.map(child => (
                <FileTreeItem
                  key={child.path}
                  node={child}
                  level={level + 1}
                  onSelect={onSelect}
                  onContextMenu={onContextMenu}
                  selectedId={selectedId}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
  
  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 cursor-pointer rounded group",
        "text-sm",
        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      )}
      style={{ paddingLeft: `${level * 12 + 20}px` }}
      onClick={() => node.file && onSelect(node.file)}
      onContextMenu={(e) => node.file && onContextMenu(e, node.file)}
    >
      <FileIcon filename={node.name} />
      <span className="truncate flex-1">{node.name}</span>
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
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ hasUpdate: false, checking: false, updating: false })
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
    try {
      const response = await filesApi.exportAll()
      const blob = new Blob([response.data], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `texton-backup-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)
      showToast('success', '导出成功')
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
        setUpdateInfo({ hasUpdate: false, checking: false, updating: false })
        return
      }
      
      if (data.message && !data.has_update) {
        // 未配置仓库或其他提示
        showToast('info', data.message)
        setUpdateInfo({ hasUpdate: false, checking: false, updating: false })
        return
      }
      
      setUpdateInfo({
        hasUpdate: data.has_update,
        latestVersion: data.latest_version,
        currentVersion: data.current_version,
        message: data.message || data.release_notes,
        updateUrl: data.update_url,
        type: data.type,
        checking: false,
        updating: false,
      })
      
      if (data.has_update) {
        showToast('info', `发现新版本 ${data.type === 'release' ? 'v' : '#'}${data.latest_version}`)
      } else {
        showToast('success', '已是最新版本')
      }
    } catch (error) {
      console.error('Failed to check update:', error)
      showToast('error', '检查更新失败，请检查网络连接')
      setUpdateInfo({ hasUpdate: false, checking: false, updating: false })
    }
  }

  const handlePerformUpdate = async () => {
    if (!confirm('确定要更新到最新版本吗？更新后需要重启服务。')) return
    
    setUpdateInfo(prev => ({ ...prev, updating: true }))
    try {
      const response = await systemApi.performUpdate()
      if (response.data.success) {
        alert('更新成功！请重启服务以应用更新。')
      } else {
        alert(`更新失败: ${response.data.message}`)
      }
    } catch (error) {
      console.error('Failed to perform update:', error)
      alert('更新失败，请手动执行 git pull')
    } finally {
      setUpdateInfo(prev => ({ ...prev, updating: false }))
    }
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
  
  const fileTree = buildFileTree(filteredFiles)
  
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
              {fileTree.map(node => (
                <FileTreeItem
                  key={node.path}
                  node={node}
                  onSelect={handleSelect}
                  onContextMenu={handleContextMenu}
                  selectedId={currentFile?.id}
                />
              ))}
              
              {filteredFiles.length === 0 && !loading && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery ? '未找到匹配的文件' : '暂无文件'}
                </div>
              )}
            </div>

            {/* 底部工具栏 */}
            <div className="p-2 border-t space-y-2">
              {/* 更新状态提示 */}
              <AnimatePresence>
                {updateInfo.hasUpdate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 text-blue-500 mb-1">
                      <AlertCircle className="h-3 w-3" />
                      <span className="font-medium">发现新版本</span>
                    </div>
                    <p className="text-muted-foreground truncate">
                      {updateInfo.type === 'release' 
                        ? `v${updateInfo.latestVersion}` 
                        : `#${updateInfo.latestVersion}`}
                    </p>
                    {updateInfo.message && (
                      <p className="text-muted-foreground truncate mt-1">{updateInfo.message}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        className="h-6 text-xs flex-1"
                        onClick={handlePerformUpdate}
                        disabled={updateInfo.updating}
                      >
                        {updateInfo.updating ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <CloudCog className="h-3 w-3 mr-1" />
                        )}
                        更新
                      </Button>
                      {updateInfo.updateUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-6 text-xs"
                          onClick={() => window.open(updateInfo.updateUrl, '_blank')}
                        >
                          查看
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
