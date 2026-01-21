import { motion, AnimatePresence } from 'framer-motion'
import { X, Sun, Moon, Monitor, Type, Keyboard, Sparkles, MousePointer2, Brackets, Scroll, Highlighter, Palette, Shield, Check } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useSettingsStore, CODE_FONTS, UI_FONTS, COLOR_SCHEMES, SettingsState } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useMobile } from '@/hooks/useMobile'

type SettingsSection = 'appearance' | 'colorscheme' | 'editor' | 'autocomplete' | 'cursor' | 'brackets' | 'scroll' | 'highlight' | 'shortcuts' | 'security'

const SECTIONS = [
  { id: 'appearance' as const, icon: Sun, label: '外观' },
  { id: 'editor' as const, icon: Type, label: '编辑器' },
  { id: 'colorscheme' as const, icon: Palette, label: '配色' },
  { id: 'autocomplete' as const, icon: Sparkles, label: '补全' },
  { id: 'cursor' as const, icon: MousePointer2, label: '光标' },
  { id: 'brackets' as const, icon: Brackets, label: '括号' },
  { id: 'scroll' as const, icon: Scroll, label: '滚动' },
  { id: 'highlight' as const, icon: Highlighter, label: '高亮' },
  { id: 'security' as const, icon: Shield, label: '安全' },
  { id: 'shortcuts' as const, icon: Keyboard, label: '快捷键' },
]

export function SettingsPanel() {
  const { settingsOpen, toggleSettings } = useEditorStore()
  const [section, setSection] = useState<SettingsSection>('appearance')
  const isMobile = useMobile()
  const settings = useSettingsStore()

  // 关闭时重置到外观
  useEffect(() => {
    if (!settingsOpen) {
      setSection('appearance')
    }
  }, [settingsOpen])

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={toggleSettings}
          />
          
          {isMobile ? (
            // 移动端：底部抽屉
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 top-12 bg-background rounded-t-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-4 pb-3 border-b">
                <h2 className="text-lg font-semibold">设置</h2>
                <button onClick={toggleSettings} className="p-2 hover:bg-muted rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <MobileSettingsContent section={section} setSection={setSection} settings={settings} />
            </motion.div>
          ) : (
            // 桌面端：macOS 风格弹窗 + 气泡箭头
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50"
              style={{ right: '60px', top: '48px' }}
            >
              {/* 气泡箭头 */}
              <div 
                className="absolute -top-2 right-[10px] w-4 h-4 bg-background rotate-45 border-l border-t"
                style={{ boxShadow: '-2px -2px 4px rgba(0,0,0,0.03)' }}
              />
              
              {/* 主面板 */}
              <div 
                className="relative bg-background rounded-xl overflow-hidden flex"
                style={{ 
                  width: '680px',
                  height: '480px',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.16)'
                }}
              >
                {/* 左侧导航 */}
                <div className="w-44 bg-muted/40 border-r flex flex-col">
                  <div className="p-3 border-b">
                    <span className="text-sm font-semibold">设置</span>
                  </div>
                  <div className="flex-1 p-2 space-y-0.5 overflow-auto">
                    {SECTIONS.map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        onClick={() => setSection(id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left",
                          section === id 
                            ? "bg-blue-500 text-white shadow-sm" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 右侧内容 */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between px-5 py-3 border-b">
                    <h2 className="text-base font-semibold">
                      {SECTIONS.find(s => s.id === section)?.label}
                    </h2>
                    <button onClick={toggleSettings} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <SettingsContent section={section} settings={settings} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}

// 桌面端设置内容
function SettingsContent({ section, settings }: { section: SettingsSection; settings: SettingsType }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="p-5"
      >
        {section === 'appearance' && <AppearanceSettings settings={settings} />}
        {section === 'colorscheme' && <ColorSchemeSettings settings={settings} />}
        {section === 'editor' && <EditorSettings settings={settings} />}
        {section === 'autocomplete' && <AutocompleteSettings settings={settings} />}
        {section === 'cursor' && <CursorSettings settings={settings} />}
        {section === 'brackets' && <BracketsSettings settings={settings} />}
        {section === 'scroll' && <ScrollSettings settings={settings} />}
        {section === 'highlight' && <HighlightSettings settings={settings} />}
        {section === 'security' && <SecuritySettings settings={settings} />}
        {section === 'shortcuts' && <ShortcutsSettings />}
      </motion.div>
    </AnimatePresence>
  )
}

// 移动端设置内容（带导航）
function MobileSettingsContent({ section, setSection, settings }: { 
  section: SettingsSection
  setSection: (s: SettingsSection) => void
  settings: SettingsType 
}) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <div className="flex-1 overflow-auto">
      <AnimatePresence mode="wait">
        {!showDetail ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-2"
          >
            {SECTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => { setSection(id); setShowDetail(true) }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-500" />
                </div>
                <span className="flex-1 font-medium">{label}</span>
                <span className="text-muted-foreground">›</span>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            <button 
              onClick={() => setShowDetail(false)}
              className="flex items-center gap-2 text-blue-500 mb-4"
            >
              <span>‹</span>
              <span>返回</span>
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {SECTIONS.find(s => s.id === section)?.label}
            </h3>
            <SettingsContent section={section} settings={settings} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Settings 类型
type SettingsType = SettingsState

// ============================================
// 各设置页面组件
// ============================================

function AppearanceSettings({ settings }: { settings: SettingsType }) {
  return (
    <div className="space-y-6">
      <SettingGroup label="主题">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', icon: Sun, label: '浅色' },
            { value: 'dark', icon: Moon, label: '深色' },
            { value: 'system', icon: Monitor, label: '系统' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => settings.setTheme(value as 'light' | 'dark' | 'system')}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                settings.theme === value 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                  : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <Icon className={cn("h-6 w-6", settings.theme === value ? "text-blue-500" : "text-muted-foreground")} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </SettingGroup>
      
      <SettingGroup label="代码字体">
        <select 
          value={settings.codeFont} 
          onChange={(e) => settings.setCodeFont(e.target.value)} 
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CODE_FONTS.map(font => (
            <option key={font.value} value={font.value}>{font.label}</option>
          ))}
        </select>
      </SettingGroup>
      
      <SettingGroup label="界面字体">
        <select 
          value={settings.uiFont} 
          onChange={(e) => settings.setUiFont(e.target.value)} 
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {UI_FONTS.map(font => (
            <option key={font.value} value={font.value}>{font.label}</option>
          ))}
        </select>
      </SettingGroup>
    </div>
  )
}

function ColorSchemeSettings({ settings }: { settings: SettingsType }) {
  return (
    <div className="space-y-5">
      <SettingGroup label="深色配色">
        <div className="grid grid-cols-2 gap-2">
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
        <div className="grid grid-cols-2 gap-2">
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
    </div>
  )
}

function EditorSettings({ settings }: { settings: SettingsType }) {
  return (
    <div className="space-y-5">
      <SettingRow label="字体大小" value={`${settings.fontSize}px`}>
        <input type="range" min="10" max="24" value={settings.fontSize} onChange={(e) => settings.setFontSize(Number(e.target.value))} className="w-28 accent-blue-500" />
      </SettingRow>
      <SettingRow label="行高" value={settings.lineHeight.toFixed(1)}>
        <input type="range" min="1.2" max="2.0" step="0.1" value={settings.lineHeight} onChange={(e) => settings.setLineHeight(Number(e.target.value))} className="w-28 accent-blue-500" />
      </SettingRow>
      <SettingRow label="Tab 大小" value={`${settings.tabSize} 空格`}>
        <div className="flex gap-1">
          {[2, 4, 8].map(size => (
            <button key={size} onClick={() => settings.setTabSize(size)} className={cn("px-3 py-1.5 text-xs rounded-lg font-medium", settings.tabSize === size ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{size}</button>
          ))}
        </div>
      </SettingRow>
      
      <div className="border-t pt-4 space-y-3">
        <ToggleRow label="自动换行" description="在窗口边缘自动换行" checked={settings.wordWrap} onChange={settings.setWordWrap} />
        <ToggleRow label="显示小地图" description="在编辑器右侧显示代码缩略图" checked={settings.minimap} onChange={settings.setMinimap} />
        <ToggleRow label="显示行号" description="在编辑器左侧显示行号" checked={settings.lineNumbers} onChange={settings.setLineNumbers} />
        <ToggleRow label="字体连字" description="启用编程字体连字" checked={settings.fontLigatures} onChange={settings.setFontLigatures} />
        <ToggleRow label="自动关闭括号" description="输入左括号时自动补全右括号" checked={settings.autoClosingBrackets} onChange={settings.setAutoClosingBrackets} />
        <ToggleRow label="自动关闭引号" description="输入引号时自动补全配对引号" checked={settings.autoClosingQuotes} onChange={settings.setAutoClosingQuotes} />
      </div>
      
      <div className="border-t pt-4 space-y-3">
        <ToggleRow label="自动保存" description="编辑后自动保存文件" checked={settings.autoSave} onChange={settings.setAutoSave} />
        {settings.autoSave && (
          <SettingRow label="保存延迟" value={`${settings.autoSaveDelay}ms`}>
            <input type="range" min="200" max="2000" step="100" value={settings.autoSaveDelay} onChange={(e) => settings.setAutoSaveDelay(Number(e.target.value))} className="w-28 accent-blue-500" />
          </SettingRow>
        )}
      </div>
    </div>
  )
}

function AutocompleteSettings({ settings }: { settings: SettingsType }) {
  return (
    <div className="space-y-5">
      <ToggleRow label="快速建议" description="输入时显示代码建议" checked={settings.quickSuggestions} onChange={settings.setQuickSuggestions} />
      <ToggleRow label="触发字符建议" description="输入特定字符时显示建议（如 . 或 :）" checked={settings.suggestOnTriggerCharacters} onChange={settings.setSuggestOnTriggerCharacters} />
      <ToggleRow label="回车接受建议" description="按回车键接受当前建议" checked={settings.acceptSuggestionOnEnter} onChange={settings.setAcceptSuggestionOnEnter} />
      
      <SettingGroup label="代码片段位置">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'top', label: '顶部' },
            { value: 'bottom', label: '底部' },
            { value: 'inline', label: '内联' },
            { value: 'none', label: '不显示' },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => settings.setSnippetSuggestions(value as any)} className={cn("px-4 py-2 text-sm rounded-lg font-medium", settings.snippetSuggestions === value ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{label}</button>
          ))}
        </div>
      </SettingGroup>
    </div>
  )
}

function CursorSettings({ settings }: { settings: SettingsType }) {
  return (
    <div className="space-y-5">
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
            <button key={value} onClick={() => settings.setCursorStyle(value as any)} className={cn("px-3 py-2.5 text-sm rounded-lg border-2 transition-all font-medium", settings.cursorStyle === value ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-transparent bg-muted hover:bg-muted/80")}>{label}</button>
          ))}
        </div>
      </SettingGroup>
      
      <SettingGroup label="闪烁效果">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'blink', label: '闪烁' },
            { value: 'smooth', label: '平滑' },
            { value: 'phase', label: '渐变' },
            { value: 'expand', label: '扩展' },
            { value: 'solid', label: '常亮' },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => settings.setCursorBlinking(value as any)} className={cn("px-4 py-2 text-sm rounded-lg font-medium", settings.cursorBlinking === value ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{label}</button>
          ))}
        </div>
      </SettingGroup>
    </div>
  )
}

function BracketsSettings({ settings }: { settings: SettingsType }) {
  return (
    <div className="space-y-5">
      <ToggleRow label="括号对着色" description="用不同颜色区分嵌套的括号对" checked={settings.bracketPairColorization} onChange={settings.setBracketPairColorization} />
      <ToggleRow label="代码折叠" description="允许折叠代码块" checked={settings.folding} onChange={settings.setFolding} />
      
      <SettingGroup label="括号匹配">
        <div className="flex gap-2">
          {[
            { value: 'never', label: '从不' },
            { value: 'near', label: '靠近时' },
            { value: 'always', label: '总是' },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => settings.setMatchBrackets(value as any)} className={cn("px-4 py-2 text-sm rounded-lg font-medium", settings.matchBrackets === value ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{label}</button>
          ))}
        </div>
      </SettingGroup>
      
      {settings.folding && (
        <SettingGroup label="折叠控件显示">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'always', label: '总是显示' },
              { value: 'mouseover', label: '悬停显示' },
              { value: 'never', label: '从不显示' },
            ].map(({ value, label }) => (
              <button key={value} onClick={() => settings.setShowFoldingControls(value as any)} className={cn("px-4 py-2 text-sm rounded-lg font-medium", settings.showFoldingControls === value ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{label}</button>
            ))}
          </div>
        </SettingGroup>
      )}
    </div>
  )
}


function ScrollSettings({ settings }: { settings: SettingsType }) {
  return (
    <div className="space-y-5">
      <ToggleRow label="平滑滚动" description="启用平滑滚动动画" checked={settings.smoothScrolling} onChange={settings.setSmoothScrolling} />
      <ToggleRow label="滚轮缩放" description="按住 Ctrl 滚动鼠标滚轮缩放字体" checked={settings.mouseWheelZoom} onChange={settings.setMouseWheelZoom} />
      <ToggleRow label="拖放移动" description="允许拖放选中的文本" checked={settings.dragAndDrop} onChange={settings.setDragAndDrop} />
      
      <SettingGroup label="多光标修饰键">
        <div className="flex gap-2">
          {[
            { value: 'alt', label: 'Alt 键' },
            { value: 'ctrlCmd', label: 'Ctrl/Cmd 键' },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => settings.setMultiCursorModifier(value as any)} className={cn("flex-1 px-4 py-2.5 text-sm rounded-lg border-2 transition-all font-medium", settings.multiCursorModifier === value ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-transparent bg-muted hover:bg-muted/80")}>{label}</button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">按住此键点击可添加多个光标</p>
      </SettingGroup>
    </div>
  )
}

function HighlightSettings({ settings }: { settings: SettingsType }) {
  return (
    <div className="space-y-5">
      <ToggleRow label="选择高亮" description="高亮显示与选中文本相同的内容" checked={settings.selectionHighlight} onChange={settings.setSelectionHighlight} />
      <ToggleRow label="出现位置高亮" description="高亮显示光标所在单词的其他出现位置" checked={settings.occurrencesHighlight} onChange={settings.setOccurrencesHighlight} />
      <ToggleRow label="缩进参考线" description="显示缩进参考线" checked={settings.renderIndentGuides} onChange={settings.setRenderIndentGuides} />
      {settings.renderIndentGuides && (
        <ToggleRow label="高亮当前缩进" description="高亮显示当前代码块的缩进参考线" checked={settings.highlightActiveIndentGuide} onChange={settings.setHighlightActiveIndentGuide} />
      )}
      
      <SettingGroup label="当前行高亮">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'none', label: '不高亮' },
            { value: 'gutter', label: '仅行号' },
            { value: 'line', label: '仅行' },
            { value: 'all', label: '全部' },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => settings.setRenderLineHighlight(value as any)} className={cn("px-4 py-2 text-sm rounded-lg font-medium", settings.renderLineHighlight === value ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80")}>{label}</button>
          ))}
        </div>
      </SettingGroup>
    </div>
  )
}

function SecuritySettings({ settings }: { settings: SettingsType }) {
  return (
    <div className="space-y-5">
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
            className="w-28 accent-blue-500" 
          />
        </SettingRow>
      )}
      
      <div className="border-t pt-4">
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <p className="text-sm flex items-center gap-2">🔐 所有文件内容使用 AES-256-GCM 加密存储</p>
          <p className="text-sm flex items-center gap-2">🔑 解锁需要输入 2FA 验证码</p>
          <p className="text-sm flex items-center gap-2">🛡️ 只有通过完整认证才能查看数据</p>
        </div>
      </div>
    </div>
  )
}

function ShortcutsSettings() {
  const shortcuts = [
    { label: '保存', keys: ['Ctrl', 'S'] },
    { label: '查找', keys: ['Ctrl', 'F'] },
    { label: '替换', keys: ['Ctrl', 'H'] },
    { label: '撤销', keys: ['Ctrl', 'Z'] },
    { label: '重做', keys: ['Ctrl', 'Y'] },
    { label: '全选', keys: ['Ctrl', 'A'] },
    { label: '跳转到行', keys: ['Ctrl', 'G'] },
    { label: '注释/取消注释', keys: ['Ctrl', '/'] },
    { label: '复制行', keys: ['Alt', '↑/↓'] },
    { label: '删除行', keys: ['Ctrl', 'Shift', 'K'] },
    { label: '触发建议', keys: ['Ctrl', 'Space'] },
  ]
  
  return (
    <div className="space-y-1">
      {shortcuts.map(({ label, keys }) => (
        <div key={label} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50">
          <span className="text-sm">{label}</span>
          <div className="flex gap-1">
            {keys.map((key, i) => (
              <kbd key={i} className="px-2 py-1 text-xs font-medium bg-muted rounded-md border shadow-sm">{key}</kbd>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground mt-4 px-3">Mac 用户请将 Ctrl 替换为 Cmd</p>
    </div>
  )
}

// ============================================
// 通用组件
// ============================================

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function SettingRow({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
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
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors",
          checked ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <span className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm mt-0.5 transition",
          checked ? "translate-x-5 ml-0.5" : "translate-x-0.5"
        )} />
      </button>
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
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left w-full",
        isSelected ? "bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-500" : "hover:bg-muted"
      )}
    >
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border"
        style={{ backgroundColor: scheme.preview.bg }}
      >
        <div className="flex flex-col gap-0.5 p-1">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-0.5 rounded-sm" style={{ backgroundColor: scheme.preview.accent }} />
            <div className="w-2 h-0.5 rounded-sm" style={{ backgroundColor: scheme.preview.fg }} />
          </div>
          <div className="w-3 h-0.5 rounded-sm opacity-50" style={{ backgroundColor: scheme.preview.fg }} />
        </div>
      </div>
      <span className="text-sm font-medium flex-1">{scheme.label}</span>
      {isSelected && <Check className="h-4 w-4 text-blue-500" />}
    </button>
  )
}
