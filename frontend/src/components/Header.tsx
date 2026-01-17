import { motion } from 'framer-motion'
import {
  Menu,
  Settings,
  History,
  LogOut,
  Save,
  Cloud,
  CloudOff,
  Loader2,
  AlertCircle,
  Download,
  Copy,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore, SaveStatus } from '@/stores/editorStore'
import { useAuthStore } from '@/stores/authStore'
import { filesApi } from '@/services/api'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useMobile } from '@/hooks/useMobile'

const saveStatusConfig: Record<SaveStatus, { icon: React.ReactNode; text: string; className: string }> = {
  saved: {
    icon: <Cloud className="h-3 w-3" />,
    text: '已保存',
    className: 'text-green-500',
  },
  saving: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    text: '保存中...',
    className: 'text-muted-foreground',
  },
  unsaved: {
    icon: <Save className="h-3 w-3" />,
    text: '未保存',
    className: 'text-yellow-500',
  },
  offline: {
    icon: <CloudOff className="h-3 w-3" />,
    text: '离线',
    className: 'text-red-500',
  },
  error: {
    icon: <AlertCircle className="h-3 w-3" />,
    text: '保存失败',
    className: 'text-red-500',
  },
}

export function Header() {
  const { currentFile, saveStatus, setCurrentFile, setFiles, toggleSidebar, toggleSettings, toggleHistory } = useEditorStore()
  const { logout } = useAuthStore()
  const [showFileMenu, setShowFileMenu] = useState(false)
  const isMobile = useMobile()
  
  const status = saveStatusConfig[saveStatus]

  // 关闭菜单
  useEffect(() => {
    const handleClick = () => setShowFileMenu(false)
    if (showFileMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [showFileMenu])

  const handleExport = async () => {
    if (!currentFile) return
    try {
      const response = await filesApi.export(currentFile.id)
      const blob = new Blob([response.data], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = currentFile.name
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export file:', error)
    }
  }

  const handleDuplicate = async () => {
    if (!currentFile) return
    try {
      const response = await filesApi.duplicate(currentFile.id)
      const listResponse = await filesApi.list()
      setFiles(listResponse.data)
      setCurrentFile(response.data)
    } catch (error) {
      console.error('Failed to duplicate file:', error)
    }
  }

  const handleDelete = async () => {
    if (!currentFile) return
    if (!confirm(`确定删除 "${currentFile.name}"？`)) return
    try {
      await filesApi.delete(currentFile.id)
      setCurrentFile(null)
      const listResponse = await filesApi.list()
      setFiles(listResponse.data)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }
  
  return (
    <header className="h-12 border-b flex items-center justify-between px-2 bg-background flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="flex-shrink-0">
          <Menu className="h-4 w-4" />
        </Button>
        
        {currentFile && (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-medium truncate">{currentFile.name}</span>
            {!isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn("flex items-center gap-1 text-xs flex-shrink-0", status.className)}
              >
                {status.icon}
                <span>{status.text}</span>
              </motion.div>
            )}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn("flex-shrink-0", status.className)}
              >
                {status.icon}
              </motion.div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        {currentFile && (
          <>
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setShowFileMenu(!showFileMenu) }}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <AnimatePresence>
                {showFileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg py-1 min-w-[140px] z-50"
                  >
                    <FileMenuItem icon={<Download className="h-4 w-4" />} label="导出" onClick={handleExport} />
                    <FileMenuItem icon={<Copy className="h-4 w-4" />} label="复制" onClick={handleDuplicate} />
                    <div className="h-px bg-border my-1" />
                    <FileMenuItem icon={<Trash2 className="h-4 w-4" />} label="删除" onClick={handleDelete} className="text-red-500 hover:text-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isMobile && (
              <Button variant="ghost" size="icon" onClick={toggleHistory} title="版本历史">
                <History className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSettings} title="设置">
          <Settings className="h-4 w-4" />
        </Button>
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={logout} title="退出">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  )
}

function FileMenuItem({ icon, label, onClick, className }: { icon: React.ReactNode; label: string; onClick: () => void; className?: string }) {
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
