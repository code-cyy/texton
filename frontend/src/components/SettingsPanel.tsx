import { motion, AnimatePresence } from 'framer-motion'
import { X, Sun, Moon, Monitor, ChevronRight, Type, Keyboard, Sparkles, MousePointer2, Brackets, Scroll, Highlighter, Palette, Check, Shield } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useSettingsStore, CODE_FONTS, UI_FONTS, COLOR_SCHEMES } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useMobile } from '@/hooks/useMobile'

type SettingsSection = 'main' | 'appearance' | 'colorscheme' | 'editor' | 'autocomplete' | 'cursor' | 'brackets' | 'scroll' | 'highlight' | 'shortcuts' | 'security'

export function SettingsPanel() {
  const { settingsOpen, toggleSettings } = useEditorStore()
  const [section, setSection] = useState<SettingsSection>('main')
  const isMobile = useMobile()
  
  const settings = useSettingsStore()

  const handleBack = () => setSection('main')
  
  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={toggleSettings}
          />
          
          <motion.div
            initial={isMobile ? { y: '100%' } : { opacity: 0, x: 20, y: -10 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, x: 0, y: 0 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, x: 20, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bg-background shadow-2xl z-50 overflow-hidden flex flex-col",
              isMobile 
                ? "inset-x-0 bottom-0 top-12 rounded-t-2xl" 
                : "right-4 top-14 w-[520px] max-h-[85vh] rounded-lg"
            )}
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.12)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                {section !== 'main' && (
                  <button onClick={handleBack} className="p-1 hover:bg-muted rounded">
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                )}
                <h2 className="text-sm font-medium">
                  {section === 'main' && '设置'}
                  {section === 'appearance' && '外观'}
                  {section === 'colorscheme' && '配色方案'}
                  {section === 'editor' && '编辑器'}
                  {section === 'autocomplete' && '自动补全'}
                  {section === 'cursor' && '光标'}
                  {section === 'brackets' && '括号与折叠'}
                  {section === 'scroll' && '滚动与交互'}
                  {section === 'highlight' && '高亮与参考线'}
                  {section === 'shortcuts' && '快捷键'}
                  {section === 'security' && '安全'}
                </h2>
              </div>
              <button onClick={toggleSettings} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <AnimatePresence mode="wait">
                {section === 'main' && (
                  <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-2">
                    <MenuItem icon={<Sun className="h-4 w-4" />} label="外观" description="主题、字体" onClick={() => setSection('appearance')} />
                    <MenuItem icon={<Palette className="h-4 w-4" />} label="配色方案" description="编辑器配色主题" onClick={() => setSection('colorscheme')} />
                    <MenuItem icon={<Type className="h-4 w-4" />} label="编辑器" description="字体大小、行高、缩进、显示" onClick={() => setSection('editor')} />
                    <MenuItem icon={<Sparkles className="h-4 w-4" />} label="自动补全" description="代码提示、智能补全" onClick={() => setSection('autocomplete')} />
                    <MenuItem icon={<MousePointer2 className="h-4 w-4" />} label="光标" description="光标样式、闪烁效果" onClick={() => setSection('cursor')} />
                    <MenuItem icon={<Brackets className="h-4 w-4" />} label="括号与折叠" description="括号匹配、代码折叠" onClick={() => setSection('brackets')} />
                    <MenuItem icon={<Scroll className="h-4 w-4" />} label="滚动与交互" description="平滑滚动、拖放、多光标" onClick={() => setSection('scroll')} />
                    <MenuItem icon={<Highlighter className="h-4 w-4" />} label="高亮与参考线" description="选择高亮、缩进参考线" onClick={() => setSection('highlight')} />
                    <MenuItem icon={<Shield className="h-4 w-4" />} label="安全" description="自动锁定、隐私保护" onClick={() => setSection('security')} />
                    <MenuItem icon={<Keyboard className="h-4 w-4" />} label="快捷键" description="键盘快捷方式" onClick={() => setSection('shortcuts')} />
                  </motion.div>
                )}

                {section === 'appearance' && (
                  <motion.div key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-6">
                    <SettingGroup label="主题">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'light', icon: Sun, label: '浅色' },
                          { value: 'dark', icon: Moon, label: '深色' },
                          { value: 'system', icon: Monitor, label: '系统' },
                        ].map(({ value, icon: Icon, label }) => (
                          <button
                            key={value}
                            onClick={() => settings.setTheme(value as 'light' | 'dark' | 'system')}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                              settings.theme === value ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-transparent bg-muted/50 hover:bg-muted"
                            )}
                          >
                            <Icon className={cn("h-5 w-5", settings.theme === value ? "text-blue-500" : "text-muted-foreground")} />
                            <span className="text-xs font-medium">{label}</span>
                          </button>
                        ))}
                      </div>
                    </SettingGroup>
                    <SettingGroup label="代码字体">
                      <select value={settings.codeFont} onChange={(e) => settings.setCodeFont(e.target.value)} className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {CODE_FONTS.map(font => (<option key={font.value} value={font.value}>{font.label}</option>))}
                      </select>
                    </SettingGroup>
                    <SettingGroup label="界面字体">
                      <select value={settings.uiFont} onChange={(e) => settings.setUiFont(e.target.value)} className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {UI_FONTS.map(font => (<option key={font.value} value={font.value}>{font.label}</option>))}
                      </select>
                    </SettingGroup>
                  </motion.div>
                )}

                {section === 'colorscheme' && (
                  <motion.div key="colorscheme" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-4">
                    <SettingGroup label="深色配色">
                      <div className="space-y-1">
                        {COLOR_SCHEMES.filter(s => s.type === 'dark').map(scheme => (
                          <ColorSchemeItem
                            key={scheme.value}
                            scheme={scheme}
                            isSelected={settings.colorScheme === scheme.value}
                            onClick={() => settings.setColorScheme(scheme.value)}
                          />
                        ))}
                      </div>
                    </SettingGroup>
                    <SettingGroup label="浅色配色">
                      <div className="space-y-1">
                        {COLOR_SCHEMES.filter(s => s.type === 'light').map(scheme => (
                          <ColorSchemeItem
                            key={scheme.value}
                            scheme={scheme}
                            isSelected={settings.colorScheme === scheme.value}
                            onClick={() => settings.setColorScheme(scheme.value)}
                          />
                        ))}
                      </div>
                    </SettingGroup>
                  </motion.div>
                )}

                {section === 'editor' && (
                  <motion.div key="editor" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-5">
                    <SettingRow label="字体大小" value={`${settings.fontSize}px`}>
                      <input type="range" min="10" max="24" value={settings.fontSize} onChange={(e) => settings.setFontSize(Number(e.target.value))} className="w-32 accent-blue-500" />
                    </SettingRow>
                    <SettingRow label="行高" value={settings.lineHeight.toFixed(1)}>
                      <input type="range" min="1.2" max="2.0" step="0.1" value={settings.lineHeight} onChange={(e) => settings.setLineHeight(Number(e.target.value))} className="w-32 accent-blue-500" />
                    </SettingRow>
                    <SettingRow label="Tab 大小" value={`${settings.tabSize} 空格`}>
                      <div className="flex gap-1">
                        {[2, 4, 8].map(size => (
                          <button key={size} onClick={() => settings.setTabSize(size)} className={cn("px-3 py-1 text-xs rounded", settings.tabSize === size ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{size}</button>
                        ))}
                      </div>
                    </SettingRow>
                    <SettingGroup label="显示空白字符">
                      <div className="flex gap-1 flex-wrap">
                        {[
                          { value: 'none', label: '不显示' },
                          { value: 'boundary', label: '边界' },
                          { value: 'selection', label: '选中时' },
                          { value: 'trailing', label: '尾部' },
                          { value: 'all', label: '全部' },
                        ].map(({ value, label }) => (
                          <button key={value} onClick={() => settings.setRenderWhitespace(value as any)} className={cn("px-3 py-1 text-xs rounded", settings.renderWhitespace === value ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{label}</button>
                        ))}
                      </div>
                    </SettingGroup>
                    <div className="border-t pt-4 space-y-3">
                      <ToggleRow label="自动换行" description="在窗口边缘自动换行" checked={settings.wordWrap} onChange={settings.setWordWrap} />
                      <ToggleRow label="显示小地图" description="在编辑器右侧显示代码缩略图" checked={settings.minimap} onChange={settings.setMinimap} />
                      <ToggleRow label="显示行号" description="在编辑器左侧显示行号" checked={settings.lineNumbers} onChange={settings.setLineNumbers} />
                      <ToggleRow label="字体连字" description="启用编程字体连字（如 => 显示为箭头）" checked={settings.fontLigatures} onChange={settings.setFontLigatures} />
                      <ToggleRow label="自动关闭括号" description="输入左括号时自动补全右括号" checked={settings.autoClosingBrackets} onChange={settings.setAutoClosingBrackets} />
                      <ToggleRow label="自动关闭引号" description="输入引号时自动补全配对引号" checked={settings.autoClosingQuotes} onChange={settings.setAutoClosingQuotes} />
                      <ToggleRow label="自动缩进" description="换行时自动缩进" checked={settings.autoIndent} onChange={settings.setAutoIndent} />
                      <ToggleRow label="粘贴时格式化" description="粘贴代码时自动格式化" checked={settings.formatOnPaste} onChange={settings.setFormatOnPaste} />
                      <ToggleRow label="输入时格式化" description="输入时自动格式化代码" checked={settings.formatOnType} onChange={settings.setFormatOnType} />
                      <ToggleRow label="检测链接" description="自动检测并高亮 URL 链接" checked={settings.links} onChange={settings.setLinks} />
                    </div>
                    <div className="border-t pt-4 space-y-3">
                      <ToggleRow label="自动保存" description="编辑后自动保存文件" checked={settings.autoSave} onChange={settings.setAutoSave} />
                      {settings.autoSave && (
                        <SettingRow label="保存延迟" value={`${settings.autoSaveDelay}ms`}>
                          <input type="range" min="200" max="2000" step="100" value={settings.autoSaveDelay} onChange={(e) => settings.setAutoSaveDelay(Number(e.target.value))} className="w-32 accent-blue-500" />
                        </SettingRow>
                      )}
                    </div>
                  </motion.div>
                )}

                {section === 'autocomplete' && (
                  <motion.div key="autocomplete" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-5">
                    <div className="space-y-3">
                      <ToggleRow label="快速建议" description="输入时显示代码建议" checked={settings.quickSuggestions} onChange={settings.setQuickSuggestions} />
                      <ToggleRow label="触发字符建议" description="输入特定字符时显示建议（如 . 或 :）" checked={settings.suggestOnTriggerCharacters} onChange={settings.setSuggestOnTriggerCharacters} />
                      <ToggleRow label="回车接受建议" description="按回车键接受当前建议" checked={settings.acceptSuggestionOnEnter} onChange={settings.setAcceptSuggestionOnEnter} />
                    </div>
                    <SettingGroup label="代码片段位置">
                      <div className="flex gap-1 flex-wrap">
                        {[
                          { value: 'top', label: '顶部' },
                          { value: 'bottom', label: '底部' },
                          { value: 'inline', label: '内联' },
                          { value: 'none', label: '不显示' },
                        ].map(({ value, label }) => (
                          <button key={value} onClick={() => settings.setSnippetSuggestions(value as any)} className={cn("px-3 py-1 text-xs rounded", settings.snippetSuggestions === value ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{label}</button>
                        ))}
                      </div>
                    </SettingGroup>
                  </motion.div>
                )}

                {section === 'cursor' && (
                  <motion.div key="cursor" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-5">
                    <SettingGroup label="光标样式">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'line', label: '竖线' },
                          { value: 'line-thin', label: '细竖线' },
                          { value: 'block', label: '方块' },
                          { value: 'block-outline', label: '空心方块' },
                          { value: 'underline', label: '下划线' },
                          { value: 'underline-thin', label: '细下划线' },
                        ].map(({ value, label }) => (
                          <button key={value} onClick={() => settings.setCursorStyle(value as any)} className={cn("px-3 py-2 text-xs rounded border-2 transition-all", settings.cursorStyle === value ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-transparent bg-muted hover:bg-muted/80")}>{label}</button>
                        ))}
                      </div>
                    </SettingGroup>
                    <SettingGroup label="闪烁效果">
                      <div className="flex gap-1 flex-wrap">
                        {[
                          { value: 'blink', label: '闪烁' },
                          { value: 'smooth', label: '平滑' },
                          { value: 'phase', label: '渐变' },
                          { value: 'expand', label: '扩展' },
                          { value: 'solid', label: '常亮' },
                        ].map(({ value, label }) => (
                          <button key={value} onClick={() => settings.setCursorBlinking(value as any)} className={cn("px-3 py-1 text-xs rounded", settings.cursorBlinking === value ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{label}</button>
                        ))}
                      </div>
                    </SettingGroup>
                  </motion.div>
                )}

                {section === 'brackets' && (
                  <motion.div key="brackets" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-5">
                    <div className="space-y-3">
                      <ToggleRow label="括号对着色" description="用不同颜色区分嵌套的括号对" checked={settings.bracketPairColorization} onChange={settings.setBracketPairColorization} />
                      <ToggleRow label="代码折叠" description="允许折叠代码块" checked={settings.folding} onChange={settings.setFolding} />
                    </div>
                    <SettingGroup label="括号匹配">
                      <div className="flex gap-1 flex-wrap">
                        {[
                          { value: 'never', label: '从不' },
                          { value: 'near', label: '靠近时' },
                          { value: 'always', label: '总是' },
                        ].map(({ value, label }) => (
                          <button key={value} onClick={() => settings.setMatchBrackets(value as any)} className={cn("px-3 py-1 text-xs rounded", settings.matchBrackets === value ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{label}</button>
                        ))}
                      </div>
                    </SettingGroup>
                    {settings.folding && (
                      <SettingGroup label="折叠控件显示">
                        <div className="flex gap-1 flex-wrap">
                          {[
                            { value: 'always', label: '总是显示' },
                            { value: 'mouseover', label: '悬停显示' },
                            { value: 'never', label: '从不显示' },
                          ].map(({ value, label }) => (
                            <button key={value} onClick={() => settings.setShowFoldingControls(value as any)} className={cn("px-3 py-1 text-xs rounded", settings.showFoldingControls === value ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{label}</button>
                          ))}
                        </div>
                      </SettingGroup>
                    )}
                  </motion.div>
                )}

                {section === 'scroll' && (
                  <motion.div key="scroll" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-5">
                    <div className="space-y-3">
                      <ToggleRow label="平滑滚动" description="启用平滑滚动动画" checked={settings.smoothScrolling} onChange={settings.setSmoothScrolling} />
                      <ToggleRow label="滚轮缩放" description="按住 Ctrl 滚动鼠标滚轮缩放字体" checked={settings.mouseWheelZoom} onChange={settings.setMouseWheelZoom} />
                      <ToggleRow label="拖放移动" description="允许拖放选中的文本" checked={settings.dragAndDrop} onChange={settings.setDragAndDrop} />
                    </div>
                    <SettingGroup label="多光标修饰键">
                      <div className="flex gap-2">
                        {[
                          { value: 'alt', label: 'Alt 键' },
                          { value: 'ctrlCmd', label: 'Ctrl/Cmd 键' },
                        ].map(({ value, label }) => (
                          <button key={value} onClick={() => settings.setMultiCursorModifier(value as any)} className={cn("flex-1 px-3 py-2 text-xs rounded border-2 transition-all", settings.multiCursorModifier === value ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-transparent bg-muted hover:bg-muted/80")}>{label}</button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">按住此键点击可添加多个光标</p>
                    </SettingGroup>
                  </motion.div>
                )}

                {section === 'highlight' && (
                  <motion.div key="highlight" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-5">
                    <div className="space-y-3">
                      <ToggleRow label="选择高亮" description="高亮显示与选中文本相同的内容" checked={settings.selectionHighlight} onChange={settings.setSelectionHighlight} />
                      <ToggleRow label="出现位置高亮" description="高亮显示光标所在单词的其他出现位置" checked={settings.occurrencesHighlight} onChange={settings.setOccurrencesHighlight} />
                      <ToggleRow label="缩进参考线" description="显示缩进参考线" checked={settings.renderIndentGuides} onChange={settings.setRenderIndentGuides} />
                      {settings.renderIndentGuides && (
                        <ToggleRow label="高亮当前缩进" description="高亮显示当前代码块的缩进参考线" checked={settings.highlightActiveIndentGuide} onChange={settings.setHighlightActiveIndentGuide} />
                      )}
                    </div>
                    <SettingGroup label="当前行高亮">
                      <div className="flex gap-1 flex-wrap">
                        {[
                          { value: 'none', label: '不高亮' },
                          { value: 'gutter', label: '仅行号' },
                          { value: 'line', label: '仅行' },
                          { value: 'all', label: '全部' },
                        ].map(({ value, label }) => (
                          <button key={value} onClick={() => settings.setRenderLineHighlight(value as any)} className={cn("px-3 py-1 text-xs rounded", settings.renderLineHighlight === value ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{label}</button>
                        ))}
                      </div>
                    </SettingGroup>
                  </motion.div>
                )}

                {section === 'shortcuts' && (
                  <motion.div key="shortcuts" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4">
                    <div className="space-y-1">
                      <ShortcutRow label="保存" keys={['Ctrl', 'S']} />
                      <ShortcutRow label="查找" keys={['Ctrl', 'F']} />
                      <ShortcutRow label="替换" keys={['Ctrl', 'H']} />
                      <ShortcutRow label="撤销" keys={['Ctrl', 'Z']} />
                      <ShortcutRow label="重做" keys={['Ctrl', 'Y']} />
                      <ShortcutRow label="全选" keys={['Ctrl', 'A']} />
                      <ShortcutRow label="跳转到行" keys={['Ctrl', 'G']} />
                      <ShortcutRow label="注释/取消注释" keys={['Ctrl', '/']} />
                      <ShortcutRow label="复制行" keys={['Alt', '↑/↓']} />
                      <ShortcutRow label="删除行" keys={['Ctrl', 'Shift', 'K']} />
                      <ShortcutRow label="触发建议" keys={['Ctrl', 'Space']} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">Mac 用户请将 Ctrl 替换为 Cmd</p>
                  </motion.div>
                )}

                {section === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-5">
                    <div className="space-y-3">
                      <ToggleRow 
                        label="自动锁定" 
                        description="空闲一段时间后自动锁定屏幕" 
                        checked={settings.autoLockEnabled} 
                        onChange={settings.setAutoLockEnabled} 
                      />
                      {settings.autoLockEnabled && (
                        <SettingRow label="锁定时间" value={`${settings.autoLockMinutes} 分钟`}>
                          <input 
                            type="range" 
                            min="1" 
                            max="30" 
                            value={settings.autoLockMinutes} 
                            onChange={(e) => settings.setAutoLockMinutes(Number(e.target.value))} 
                            className="w-32 accent-blue-500" 
                          />
                        </SettingRow>
                      )}
                    </div>
                    <div className="border-t pt-4">
                      <div className="text-xs text-muted-foreground space-y-2">
                        <p>🔐 所有文件内容使用 AES-256-GCM 加密存储</p>
                        <p>🔑 解锁需要输入 2FA 验证码</p>
                        <p>🛡️ 只有通过完整认证才能查看数据</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function MenuItem({ icon, label, description, onClick }: { icon: React.ReactNode; label: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left">
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function SettingRow({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{value}</div>
      </div>
      {children}
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <div className="text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors", checked ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600")}
      >
        <span className={cn("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm mt-0.5 transition", checked ? "translate-x-4 ml-0.5" : "translate-x-0.5")} />
      </button>
    </div>
  )
}

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (<kbd key={i} className="px-2 py-0.5 text-xs font-medium bg-muted rounded border shadow-sm">{key}</kbd>))}
      </div>
    </div>
  )
}

function ColorSchemeItem({ scheme, isSelected, onClick }: { 
  scheme: typeof COLOR_SCHEMES[number]
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left",
        isSelected ? "bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-500" : "hover:bg-muted"
      )}
    >
      {/* 配色预览 */}
      <div 
        className="w-10 h-10 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0 border"
        style={{ backgroundColor: scheme.preview.bg }}
      >
        <div className="flex flex-col gap-0.5 p-1">
          <div className="flex gap-0.5">
            <div className="w-2 h-1 rounded-sm" style={{ backgroundColor: scheme.preview.accent }} />
            <div className="w-3 h-1 rounded-sm" style={{ backgroundColor: scheme.preview.fg }} />
          </div>
          <div className="flex gap-0.5">
            <div className="w-4 h-1 rounded-sm opacity-50" style={{ backgroundColor: scheme.preview.fg }} />
          </div>
          <div className="flex gap-0.5">
            <div className="w-1 h-1 rounded-sm" style={{ backgroundColor: scheme.preview.accent }} />
            <div className="w-2 h-1 rounded-sm" style={{ backgroundColor: scheme.preview.fg }} />
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{scheme.label}</div>
        <div className="text-xs text-muted-foreground capitalize">{scheme.type === 'dark' ? '深色' : '浅色'}主题</div>
      </div>
      
      {isSelected && (
        <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
      )}
    </button>
  )
}
