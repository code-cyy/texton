import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, User, Key, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/services/api'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  
  const {
    requires2FASetup,
    requires2FA,
    setTokens,
    setPending,
    setRequires2FASetup,
    setRequires2FA,
  } = useAuthStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login(username, password, totpCode || undefined)
      const data = response.data

      if (data.requires_2fa_setup) {
        setPending(username, password)
        setRequires2FASetup(true)
        // 获取 2FA 设置信息
        const setupResponse = await authApi.setup2FA(username, password)
        setQrCode(setupResponse.data.qr_code)
        setSecret(setupResponse.data.secret)
      } else if (data.requires_2fa) {
        setPending(username, password)
        setRequires2FA(true)
      } else if (data.access_token) {
        setTokens(data.access_token, data.refresh_token)
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.verify2FA(username, password, totpCode)
      setTokens(response.data.access_token, response.data.refresh_token)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || '验证失败')
    } finally {
      setLoading(false)
    }
  }

  const handle2FALogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login(username, password, totpCode)
      if (response.data.access_token) {
        setTokens(response.data.access_token, response.data.refresh_token)
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || '验证失败')
    } finally {
      setLoading(false)
    }
  }

  // 2FA 设置界面
  if (requires2FASetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">设置两步验证</h1>
            <p className="text-muted-foreground text-sm">
              使用 Google Authenticator 或类似应用扫描二维码
            </p>
          </div>

          {qrCode && (
            <div className="flex justify-center">
              <img
                src={`data:image/png;base64,${qrCode}`}
                alt="2FA QR Code"
                className="w-48 h-48 rounded-lg border"
              />
            </div>
          )}

          {secret && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">或手动输入密钥:</p>
              <code className="text-sm bg-muted px-2 py-1 rounded">{secret}</code>
            </div>
          )}

          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="输入 6 位验证码"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="pl-10 text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading || totpCode.length !== 6}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '验证并启用'}
            </Button>
          </form>
        </motion.div>
      </div>
    )
  }

  // 2FA 验证界面
  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center space-y-2">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-semibold">两步验证</h1>
            <p className="text-muted-foreground text-sm">
              请输入验证器应用中的验证码
            </p>
          </div>

          <form onSubmit={handle2FALogin} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="输入 6 位验证码"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="pl-10 text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading || totpCode.length !== 6}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '验证'}
            </Button>
          </form>
        </motion.div>
      </div>
    )
  }

  // 登录界面
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Secure Editor</h1>
          <p className="text-muted-foreground text-sm">私有化在线编辑器</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '登录'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
