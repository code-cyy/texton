import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { filesApi } from '@/services/api'

export function useAutoSave() {
  const { currentFile, editorContent, setSaveStatus } = useEditorStore()
  const { autoSave, autoSaveDelay } = useSettingsStore()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContent = useRef<string>('')

  const save = useCallback(async () => {
    if (!currentFile) return
    
    const content = useEditorStore.getState().editorContent
    
    // 内容没变化，不保存
    if (content === lastSavedContent.current) {
      setSaveStatus('saved')
      return
    }
    
    setSaveStatus('saving')
    
    try {
      await filesApi.save(currentFile.id, content)
      lastSavedContent.current = content
      setSaveStatus('saved')
    } catch (error) {
      console.error('Save failed:', error)
      setSaveStatus('error')
    }
  }, [currentFile, setSaveStatus])

  // 监听内容变化
  useEffect(() => {
    if (!autoSave || !currentFile) return
    
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // 检查内容是否变化
    if (editorContent !== lastSavedContent.current) {
      setSaveStatus('unsaved')
      
      // 设置新的定时器
      timeoutRef.current = setTimeout(save, autoSaveDelay)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [editorContent, autoSave, autoSaveDelay, currentFile, save, setSaveStatus])

  // 文件切换时更新 lastSavedContent
  useEffect(() => {
    if (currentFile) {
      lastSavedContent.current = currentFile.content
    }
  }, [currentFile?.id])

  return { save }
}
