import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTheme } from '@/hooks/useTheme'
import { Login } from '@/components/Login'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { Editor } from '@/components/Editor'
import { StatusBar } from '@/components/StatusBar'
import { SettingsPanel } from '@/components/SettingsPanel'
import { HistoryPanel } from '@/components/HistoryPanel'

function App() {
  const { isAuthenticated } = useAuthStore()
  const { uiFont } = useSettingsStore()
  
  useTheme()
  
  if (!isAuthenticated) {
    return <Login />
  }
  
  return (
    <div 
      className="h-screen flex flex-col overflow-hidden"
      style={{ fontFamily: `'${uiFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` }}
    >
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence>
          <Sidebar />
        </AnimatePresence>
        <Editor />
      </div>
      <StatusBar />
      <SettingsPanel />
      <HistoryPanel />
    </div>
  )
}

export default App
