import { useRef, useCallback, useEffect, useMemo } from 'react'
import MonacoEditor, { OnMount, OnChange, Monaco } from '@monaco-editor/react'
import { useEditorStore } from '@/stores/editorStore'
import { useSettingsStore, COLOR_SCHEMES } from '@/stores/settingsStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import type { editor } from 'monaco-editor'

// 定义所有配色方案主题
const defineAllThemes = (monaco: Monaco) => {
  // Monokai
  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'type', foreground: '66d9ef', fontStyle: 'italic' },
      { token: 'class', foreground: 'a6e22e' },
      { token: 'function', foreground: 'a6e22e' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'constant', foreground: 'ae81ff' },
      { token: 'operator', foreground: 'f92672' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#3e3d32',
      'editor.selectionBackground': '#49483e',
      'editorLineNumber.foreground': '#90908a',
      'editorCursor.foreground': '#f8f8f0',
    }
  })

  // Mariana (Sublime Text)
  monaco.editor.defineTheme('mariana', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'a6acb9', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c695c6' },
      { token: 'string', foreground: '99c794' },
      { token: 'number', foreground: 'f9ae58' },
      { token: 'type', foreground: '5fb4b4', fontStyle: 'italic' },
      { token: 'class', foreground: 'fac761' },
      { token: 'function', foreground: '5fb4b4' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'constant', foreground: 'f9ae58' },
      { token: 'operator', foreground: 'f97b58' },
    ],
    colors: {
      'editor.background': '#303841',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#3a424d',
      'editor.selectionBackground': '#4e5a65',
      'editorLineNumber.foreground': '#6e7a86',
      'editorCursor.foreground': '#f8f8f0',
    }
  })

  // One Dark
  monaco.editor.defineTheme('one-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: 'string', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'type', foreground: 'e5c07b' },
      { token: 'class', foreground: 'e5c07b' },
      { token: 'function', foreground: '61afef' },
      { token: 'variable', foreground: 'e06c75' },
      { token: 'constant', foreground: 'd19a66' },
      { token: 'operator', foreground: '56b6c2' },
    ],
    colors: {
      'editor.background': '#282c34',
      'editor.foreground': '#abb2bf',
      'editor.lineHighlightBackground': '#2c313c',
      'editor.selectionBackground': '#3e4451',
      'editorLineNumber.foreground': '#4b5263',
      'editorCursor.foreground': '#528bff',
    }
  })

  // Dracula
  monaco.editor.defineTheme('dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
      { token: 'class', foreground: '8be9fd' },
      { token: 'function', foreground: '50fa7b' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'constant', foreground: 'bd93f9' },
      { token: 'operator', foreground: 'ff79c6' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#44475a',
      'editor.selectionBackground': '#44475a',
      'editorLineNumber.foreground': '#6272a4',
      'editorCursor.foreground': '#f8f8f2',
    }
  })

  // Nord
  monaco.editor.defineTheme('nord', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '616e88', fontStyle: 'italic' },
      { token: 'keyword', foreground: '81a1c1' },
      { token: 'string', foreground: 'a3be8c' },
      { token: 'number', foreground: 'b48ead' },
      { token: 'type', foreground: '8fbcbb' },
      { token: 'class', foreground: '8fbcbb' },
      { token: 'function', foreground: '88c0d0' },
      { token: 'variable', foreground: 'd8dee9' },
      { token: 'constant', foreground: 'b48ead' },
      { token: 'operator', foreground: '81a1c1' },
    ],
    colors: {
      'editor.background': '#2e3440',
      'editor.foreground': '#d8dee9',
      'editor.lineHighlightBackground': '#3b4252',
      'editor.selectionBackground': '#434c5e',
      'editorLineNumber.foreground': '#4c566a',
      'editorCursor.foreground': '#d8dee9',
    }
  })

  // Tokyo Night
  monaco.editor.defineTheme('tokyo-night', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '565f89', fontStyle: 'italic' },
      { token: 'keyword', foreground: '9d7cd8' },
      { token: 'string', foreground: '9ece6a' },
      { token: 'number', foreground: 'ff9e64' },
      { token: 'type', foreground: '2ac3de' },
      { token: 'class', foreground: 'bb9af7' },
      { token: 'function', foreground: '7aa2f7' },
      { token: 'variable', foreground: 'c0caf5' },
      { token: 'constant', foreground: 'ff9e64' },
      { token: 'operator', foreground: '89ddff' },
    ],
    colors: {
      'editor.background': '#1a1b26',
      'editor.foreground': '#a9b1d6',
      'editor.lineHighlightBackground': '#292e42',
      'editor.selectionBackground': '#33467c',
      'editorLineNumber.foreground': '#3b4261',
      'editorCursor.foreground': '#c0caf5',
    }
  })

  // GitHub Dark
  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'class', foreground: 'ffa657' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'c9d1d9' },
      { token: 'constant', foreground: '79c0ff' },
      { token: 'operator', foreground: 'ff7b72' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#264f78',
      'editorLineNumber.foreground': '#484f58',
      'editorCursor.foreground': '#58a6ff',
    }
  })

  // Ayu Dark
  monaco.editor.defineTheme('ayu-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '626a73', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff8f40' },
      { token: 'string', foreground: 'c2d94c' },
      { token: 'number', foreground: 'ffee99' },
      { token: 'type', foreground: '59c2ff' },
      { token: 'class', foreground: 'ffb454' },
      { token: 'function', foreground: 'ffb454' },
      { token: 'variable', foreground: 'b3b1ad' },
      { token: 'constant', foreground: 'ffee99' },
      { token: 'operator', foreground: 'f29668' },
    ],
    colors: {
      'editor.background': '#0a0e14',
      'editor.foreground': '#b3b1ad',
      'editor.lineHighlightBackground': '#0d1016',
      'editor.selectionBackground': '#273747',
      'editorLineNumber.foreground': '#3d424d',
      'editorCursor.foreground': '#e6b450',
    }
  })

  // Synthwave '84
  monaco.editor.defineTheme('synthwave', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '848bbd', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'fede5d' },
      { token: 'string', foreground: 'ff8b39' },
      { token: 'number', foreground: 'f97e72' },
      { token: 'type', foreground: 'ff7edb' },
      { token: 'class', foreground: '36f9f6' },
      { token: 'function', foreground: '36f9f6' },
      { token: 'variable', foreground: 'ffffff' },
      { token: 'constant', foreground: 'f97e72' },
      { token: 'operator', foreground: 'fede5d' },
    ],
    colors: {
      'editor.background': '#262335',
      'editor.foreground': '#ffffff',
      'editor.lineHighlightBackground': '#34294f',
      'editor.selectionBackground': '#463465',
      'editorLineNumber.foreground': '#495495',
      'editorCursor.foreground': '#72f1b8',
    }
  })

  // GitHub Light
  monaco.editor.defineTheme('github-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'cf222e' },
      { token: 'string', foreground: '0a3069' },
      { token: 'number', foreground: '0550ae' },
      { token: 'type', foreground: '953800' },
      { token: 'class', foreground: '953800' },
      { token: 'function', foreground: '8250df' },
      { token: 'variable', foreground: '24292f' },
      { token: 'constant', foreground: '0550ae' },
      { token: 'operator', foreground: 'cf222e' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#24292f',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editor.selectionBackground': '#add6ff',
      'editorLineNumber.foreground': '#8c959f',
      'editorCursor.foreground': '#0969da',
    }
  })

  // Solarized Light
  monaco.editor.defineTheme('solarized-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '93a1a1', fontStyle: 'italic' },
      { token: 'keyword', foreground: '859900' },
      { token: 'string', foreground: '2aa198' },
      { token: 'number', foreground: 'd33682' },
      { token: 'type', foreground: 'b58900' },
      { token: 'class', foreground: 'b58900' },
      { token: 'function', foreground: '268bd2' },
      { token: 'variable', foreground: '657b83' },
      { token: 'constant', foreground: 'cb4b16' },
      { token: 'operator', foreground: '859900' },
    ],
    colors: {
      'editor.background': '#fdf6e3',
      'editor.foreground': '#657b83',
      'editor.lineHighlightBackground': '#eee8d5',
      'editor.selectionBackground': '#eee8d5',
      'editorLineNumber.foreground': '#93a1a1',
      'editorCursor.foreground': '#657b83',
    }
  })

  // One Light
  monaco.editor.defineTheme('one-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'a0a1a7', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'a626a4' },
      { token: 'string', foreground: '50a14f' },
      { token: 'number', foreground: '986801' },
      { token: 'type', foreground: 'c18401' },
      { token: 'class', foreground: 'c18401' },
      { token: 'function', foreground: '4078f2' },
      { token: 'variable', foreground: 'e45649' },
      { token: 'constant', foreground: '986801' },
      { token: 'operator', foreground: '0184bc' },
    ],
    colors: {
      'editor.background': '#fafafa',
      'editor.foreground': '#383a42',
      'editor.lineHighlightBackground': '#f0f0f0',
      'editor.selectionBackground': '#e5e5e6',
      'editorLineNumber.foreground': '#9d9d9f',
      'editorCursor.foreground': '#526fff',
    }
  })

  // Ayu Light
  monaco.editor.defineTheme('ayu-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'abb0b6', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'fa8d3e' },
      { token: 'string', foreground: '86b300' },
      { token: 'number', foreground: 'a37acc' },
      { token: 'type', foreground: '399ee6' },
      { token: 'class', foreground: 'ff9940' },
      { token: 'function', foreground: 'f2ae49' },
      { token: 'variable', foreground: '5c6166' },
      { token: 'constant', foreground: 'a37acc' },
      { token: 'operator', foreground: 'ed9366' },
    ],
    colors: {
      'editor.background': '#fafafa',
      'editor.foreground': '#5c6166',
      'editor.lineHighlightBackground': '#f0f0f0',
      'editor.selectionBackground': '#d1e4f4',
      'editorLineNumber.foreground': '#9da2a6',
      'editorCursor.foreground': '#ff9940',
    }
  })

  // Quiet Light
  monaco.editor.defineTheme('quiet-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'aaaaaa', fontStyle: 'italic' },
      { token: 'keyword', foreground: '4b83cd' },
      { token: 'string', foreground: '448c27' },
      { token: 'number', foreground: 'ab6526' },
      { token: 'type', foreground: '7a3e9d' },
      { token: 'class', foreground: '7a3e9d' },
      { token: 'function', foreground: 'aa3731' },
      { token: 'variable', foreground: '333333' },
      { token: 'constant', foreground: 'ab6526' },
      { token: 'operator', foreground: '777777' },
    ],
    colors: {
      'editor.background': '#f5f5f5',
      'editor.foreground': '#333333',
      'editor.lineHighlightBackground': '#e4f6d4',
      'editor.selectionBackground': '#c9d0d9',
      'editorLineNumber.foreground': '#aaaaaa',
      'editorCursor.foreground': '#54494b',
    }
  })
}

export function Editor() {
  const { currentFile, editorContent, setEditorContent } = useEditorStore()
  const settings = useSettingsStore()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  
  useAutoSave()
  
  // 构建编辑器选项
  const editorOptions = useMemo((): editor.IStandaloneEditorConstructionOptions => ({
    fontSize: settings.fontSize,
    fontFamily: `'${settings.codeFont}', 'Fira Code', 'Consolas', monospace`,
    lineHeight: settings.fontSize * settings.lineHeight,
    tabSize: settings.tabSize,
    wordWrap: settings.wordWrap ? 'on' : 'off',
    minimap: { enabled: settings.minimap },
    lineNumbers: settings.lineNumbers ? 'on' : 'off',
    renderWhitespace: settings.renderWhitespace,
    
    // 自动关闭
    autoClosingBrackets: settings.autoClosingBrackets ? 'always' : 'never',
    autoClosingQuotes: settings.autoClosingQuotes ? 'always' : 'never',
    autoIndent: settings.autoIndent ? 'full' : 'none',
    formatOnPaste: settings.formatOnPaste,
    formatOnType: settings.formatOnType,
    
    // 自动补全
    quickSuggestions: settings.quickSuggestions,
    suggestOnTriggerCharacters: settings.suggestOnTriggerCharacters,
    acceptSuggestionOnEnter: settings.acceptSuggestionOnEnter ? 'on' : 'off',
    snippetSuggestions: settings.snippetSuggestions,
    
    // 光标
    cursorStyle: settings.cursorStyle,
    cursorBlinking: settings.cursorBlinking,
    cursorWidth: settings.cursorStyle === 'line' ? 2 : undefined,
    cursorSmoothCaretAnimation: 'on',
    
    // 滚动
    smoothScrolling: settings.smoothScrolling,
    mouseWheelZoom: settings.mouseWheelZoom,
    scrollBeyondLastLine: false,
    
    // 括号
    bracketPairColorization: { enabled: settings.bracketPairColorization },
    matchBrackets: settings.matchBrackets,
    
    // 代码折叠
    folding: settings.folding,
    foldingStrategy: 'indentation',
    showFoldingControls: settings.showFoldingControls,
    
    // 选择与高亮
    selectionHighlight: settings.selectionHighlight,
    occurrencesHighlight: settings.occurrencesHighlight ? 'singleFile' : 'off',
    renderLineHighlight: settings.renderLineHighlight,
    
    // 连字
    fontLigatures: settings.fontLigatures,
    
    // 缩进参考线
    guides: {
      indentation: settings.renderIndentGuides,
      highlightActiveIndentation: settings.highlightActiveIndentGuide,
      bracketPairs: settings.bracketPairColorization,
    },
    
    // 链接
    links: settings.links,
    
    // 拖放
    dragAndDrop: settings.dragAndDrop,
    
    // 多光标
    multiCursorModifier: settings.multiCursorModifier,
    
    // 其他
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    roundedSelection: true,
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'never',
      seedSearchStringFromSelection: 'selection',
    },
    fixedOverflowWidgets: true,
  }), [settings])
  
  const getThemeName = useCallback(() => {
    const scheme = COLOR_SCHEMES.find(s => s.value === settings.colorScheme)
    
    if (settings.theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      // 如果系统是深色但选择了浅色配色方案，或反之，则使用配色方案的类型
      if (scheme) {
        return settings.colorScheme
      }
      return isDark ? 'mariana' : 'github-light'
    }
    
    // 如果主题和配色方案类型不匹配，使用默认配色
    if (scheme) {
      if (settings.theme === 'dark' && scheme.type === 'light') {
        return 'mariana' // 深色模式下使用深色配色
      }
      if (settings.theme === 'light' && scheme.type === 'dark') {
        return 'github-light' // 浅色模式下使用浅色配色
      }
    }
    
    return settings.colorScheme
  }, [settings.theme, settings.colorScheme])

  // 监听主题和配色方案变化
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setTheme(getThemeName())
    }
  }, [settings.theme, settings.colorScheme, getThemeName])

  // 监听设置变化，更新编辑器选项
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions(editorOptions)
    }
  }, [editorOptions])
  
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    
    // 定义所有配色方案主题
    defineAllThemes(monaco)
    monaco.editor.setTheme(getThemeName())
    
    // 应用编辑器选项
    editor.updateOptions(editorOptions)
    
    // 监听光标位置变化
    editor.onDidChangeCursorPosition((e) => {
      const selection = editor.getSelection()
      let selectionInfo = { lines: 0, chars: 0 }
      
      if (selection && !selection.isEmpty()) {
        const selectedText = editor.getModel()?.getValueInRange(selection) || ''
        selectionInfo = {
          lines: selection.endLineNumber - selection.startLineNumber + 1,
          chars: selectedText.length,
        }
      }
      
      window.dispatchEvent(new CustomEvent('editor-cursor-change', {
        detail: {
          position: { line: e.position.lineNumber, column: e.position.column },
          selection: selectionInfo,
        }
      }))
    })

    // 监听选择变化
    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection
      let selectionInfo = { lines: 0, chars: 0 }
      
      if (!selection.isEmpty()) {
        const selectedText = editor.getModel()?.getValueInRange(selection) || ''
        selectionInfo = {
          lines: selection.endLineNumber - selection.startLineNumber + 1,
          chars: selectedText.length,
        }
      }
      
      window.dispatchEvent(new CustomEvent('editor-cursor-change', {
        detail: {
          position: { line: selection.positionLineNumber, column: selection.positionColumn },
          selection: selectionInfo,
        }
      }))
    })
    
    // 快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // 手动保存由 useAutoSave 处理
    })
  }
  
  const handleChange: OnChange = useCallback((value) => {
    setEditorContent(value || '')
  }, [setEditorContent])
  
  if (!currentFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p>选择或创建一个文件开始编辑</p>
          <p className="text-sm opacity-60">Ctrl/Cmd + N 创建新文件</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex-1 h-full">
      <MonacoEditor
        height="100%"
        language={currentFile.language}
        value={editorContent}
        theme={getThemeName()}
        onMount={handleEditorMount}
        onChange={handleChange}
        options={editorOptions}
      />
    </div>
  )
}
