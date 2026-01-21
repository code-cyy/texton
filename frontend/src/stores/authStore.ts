import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLocked: boolean
  lastActivity: number
  
  // 登录流程状态
  pendingUsername: string | null
  pendingPassword: string | null
  requires2FASetup: boolean
  requires2FA: boolean
  
  setTokens: (access: string, refresh: string) => void
  setPending: (username: string, password: string) => void
  setRequires2FASetup: (value: boolean) => void
  setRequires2FA: (value: boolean) => void
  clearPending: () => void
  logout: () => void
  lock: () => void
  unlock: () => void
  updateActivity: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLocked: false,
      lastActivity: Date.now(),
      pendingUsername: null,
      pendingPassword: null,
      requires2FASetup: false,
      requires2FA: false,
      
      setTokens: (access, refresh) => set({
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLocked: false,
        lastActivity: Date.now(),
        pendingUsername: null,
        pendingPassword: null,
        requires2FASetup: false,
        requires2FA: false,
      }),
      
      setPending: (username, password) => set({
        pendingUsername: username,
        pendingPassword: password,
      }),
      
      setRequires2FASetup: (value) => set({ requires2FASetup: value }),
      setRequires2FA: (value) => set({ requires2FA: value }),
      
      clearPending: () => set({
        pendingUsername: null,
        pendingPassword: null,
        requires2FASetup: false,
        requires2FA: false,
      }),
      
      logout: () => set({
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLocked: false,
        pendingUsername: null,
        pendingPassword: null,
        requires2FASetup: false,
        requires2FA: false,
      }),
      
      lock: () => set({ isLocked: true }),
      
      unlock: () => set({ 
        isLocked: false,
        lastActivity: Date.now(),
      }),
      
      updateActivity: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isLocked: state.isLocked,
      }),
    }
  )
)
