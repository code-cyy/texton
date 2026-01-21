import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { systemApi } from '@/services/api'
import { cn } from '@/lib/utils'

export function LockScreen() {
  const { isLocked, unlock, logout, lastActivity, updateActivity } = useAuthStore()
  const { autoLockEnabled, autoLockMinutes } = useSettingsStore()
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动锁定检测
  useEffect(() => {
    if (!autoLockEnabled) return

    const checkIdleTime = () => {
      const idleTime = Date.now() - lastActivity
      const lockThreshold = autoLockMinutes * 60 * 1000

      if (idleTime >= lockThreshold && !isLocked) {
        useAuthStore.getState().lock()
      }
    }

    const interval = setInterval(checkIdleTime, 10000) // 每 10 秒检查一次
    return () => clearInterval(interval)
  }, [autoLockEnabled, autoLockMinutes, lastActivity, isLocked])

  // 锁定时修改标签页标题
  useEffect(() => {
    const originalTitle = document.title
    if (isLocked) {
      document.title = '🔒 已锁定 - TextOn'
    } else {
      document.title = 'TextOn'
    }
    return () => {
      document.title = originalTitle
    }
  }, [isLocked])

  // 监听用户活动
  useEffect(() => {
    if (isLocked) return

    const handleActivity = () => {
      updateActivity()
    }

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isLocked, updateActivity])

  // 聚焦输入框
  useEffect(() => {
    if (isLocked && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isLocked])

  const handleUnlock = async () => {
    if (totpCode.length !== 6) {
      setError('请输入 6 位验证码')
      return
    }

    setLoading(true)
    setError('')

    try {
      await systemApi.verifyTotp(totpCode)
      unlock()
      setTotpCode('')
    } catch (err: any) {
      setError(err.response?.data?.detail || '验证码错误')
      setTotpCode('')
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock()
    }
  }

  const handleLogout = () => {
    logout()
    setTotpCode('')
    setError('')
  }

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
        >
          {/* 背景模糊效果 */}
          <div className="absolute inset-0 backdrop-blur-xl bg-background/80" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 w-full max-w-sm mx-4"
          >
            <div className="bg-card border rounded-2xl shadow-2xl p-8">
              {/* 锁图标 */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="h-10 w-10 text-muted-foreground" />
                </div>
              </div>

              {/* 标题 */}
              <h1 className="text-xl font-semibold text-center mb-2">屏幕已锁定</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                请输入 2FA 验证码解锁
              </p>

              {/* 验证码输入 */}
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      setTotpCode(value)
                      setError('')
                    }}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      'text-center text-2xl tracking-[0.5em] font-mono h-14',
                      error && 'border-red-500 focus-visible:ring-red-500'
                    )}
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                </div>

                {/* 错误提示 */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 text-sm text-red-500"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 解锁按钮 */}
                <Button
                  className="w-full h-11"
                  onClick={handleUnlock}
                  disabled={loading || totpCode.length !== 6}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Unlock className="h-4 w-4 mr-2" />
                  )}
                  解锁
                </Button>

                {/* 退出登录 */}
                <Button variant="ghost" className="w-full" onClick={handleLogout}>
                  退出登录
                </Button>
              </div>
            </div>

            {/* 提示 */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              打开身份验证器应用获取验证码
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
