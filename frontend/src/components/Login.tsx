import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, User, Key, Loader2, Eye, EyeOff, FileCode2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/services/api'

type PageState = 'loading' | 'init' | 'login' | '2fa-setup' | '2fa-verify'

export function Login() {
  const [pageState, setPageState] = useState<PageState>('loading')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { setTokens, setPending } = useAuthStore()

  useEffect(() => {
    checkInitStatus()
  }, [])

  const checkInitStatus = async () => {
    try {
      const response = await authApi.initStatus()
      setPageState(response.data.initialized ? 'login' : 'init')
    } catch {
      setPageState('login')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 8) {
      setError('密码至少 8 个字符')
      return
    }
    setLoading(true)
    try {
      await authApi.register(username, password)
      setPending(username, password)
      const setupResponse = await authApi.setup2FA(username, password)
      setQrCode(setupResponse.data.qr_code)
      setSecret(setupResponse.data.secret)
      setPageState('2fa-setup')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await authApi.login(username, password, totpCode || undefined)
      const data = response.data
      if (data.requires_2fa_setup) {
        setPending(username, password)
        const setupResponse = await authApi.setup2FA(username, password)
        setQrCode(setupResponse.data.qr_code)
        setSecret(setupResponse.data.secret)
        setPageState('2fa-setup')
      } else if (data.requires_2fa) {
        setPending(username, password)
        setPageState('2fa-verify')
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
      setTotpCode('')
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
      setTotpCode('')
    } finally {
      setLoading(false)
    }
  }

  // 加载中
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // 初始化/注册界面
  if (pageState === 'init') {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* 左侧装饰 */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FileCode2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TextOn
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              安全、简洁的<br />在线编辑器
            </h1>
            <p className="text-gray-500 text-lg mb-8">
              端到端加密，多设备同步，专为隐私而生
            </p>
            <div className="space-y-4">
              {[
                { icon: '🔐', text: 'AES-256 加密存储' },
                { icon: '🔑', text: '两步验证保护' },
                { icon: '📱', text: '多设备无缝访问' },
                { icon: '⚡', text: '实时自动保存' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 text-gray-600"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 右侧表单 */}
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8">
              <div className="flex items-center gap-3 mb-2 lg:hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <FileCode2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TextOn
                </span>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-600">首次使用</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">创建管理员账户</h2>
                <p className="text-gray-500 text-sm mt-1">设置您的登录凭据以开始使用</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="至少 3 个字符"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      autoFocus
                      minLength={3}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="至少 8 个字符"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-500/25"
                  disabled={loading || !username || !password || !confirmPassword}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : '创建账户'}
                </Button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-6">
                创建账户后需要设置两步验证以确保安全
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // 2FA 设置界面
  if (pageState === '2fa-setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Key className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">设置两步验证</h2>
              <p className="text-gray-500 text-sm mt-1">
                使用 Google Authenticator 扫描二维码
              </p>
            </div>

            {qrCode && (
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-white rounded-2xl border-2 border-gray-100">
                  <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="2FA QR Code"
                    className="w-44 h-44"
                  />
                </div>
              </div>
            )}

            {secret && (
              <div className="text-center mb-6">
                <p className="text-xs text-gray-400 mb-2">或手动输入密钥</p>
                <code className="text-sm bg-gray-100 px-4 py-2 rounded-lg font-mono select-all text-gray-700">
                  {secret}
                </code>
              </div>
            )}

            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">验证码</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="输入 6 位数字"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-14 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg text-center"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium"
                disabled={loading || totpCode.length !== 6}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : '验证并启用'}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  // 2FA 验证界面
  if (pageState === '2fa-verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">两步验证</h2>
              <p className="text-gray-500 text-sm mt-1">请输入验证器中的 6 位数字</p>
            </div>

            <form onSubmit={handle2FALogin} className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-14 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                maxLength={6}
                autoFocus
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg text-center"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium"
                disabled={loading || totpCode.length !== 6}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : '验证登录'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setPageState('login')
                  setTotpCode('')
                  setError('')
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                返回登录
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  // 登录界面
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 左侧装饰 */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FileCode2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TextOn
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            欢迎回来
          </h1>
          <p className="text-gray-500 text-lg">
            登录以访问您的私密文档
          </p>
        </motion.div>
      </div>

      {/* 右侧表单 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8">
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FileCode2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TextOn
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">登录</h2>
              <p className="text-gray-500 text-sm mt-1">在线编辑器</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-500/25"
                disabled={loading || !username || !password}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : '登录'}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
