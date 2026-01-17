import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config
    
    // Token 过期，尝试刷新
    if (error.response?.status === 401 && originalRequest) {
      const refreshToken = useAuthStore.getState().refreshToken
      
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', {
            refresh_token: refreshToken
          })
          
          const newToken = response.data.access_token
          useAuthStore.getState().setTokens(newToken, refreshToken)
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } catch {
          useAuthStore.getState().logout()
        }
      } else {
        useAuthStore.getState().logout()
      }
    }
    
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authApi = {
  login: (username: string, password: string, totpCode?: string) =>
    api.post('/auth/login', { username, password, totp_code: totpCode }),
  
  setup2FA: (username: string, password: string) =>
    api.post('/auth/setup-2fa', { username, password }),
  
  verify2FA: (username: string, password: string, totpCode: string) =>
    api.post('/auth/verify-2fa', { username, password, totp_code: totpCode }),
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
}

// Files API
export const filesApi = {
  list: (includeDeleted = false) =>
    api.get('/files', { params: { include_deleted: includeDeleted } }),
  
  listTrash: () =>
    api.get('/files/trash'),
  
  get: (id: number) =>
    api.get(`/files/${id}`),
  
  create: (data: { name: string; path: string; content?: string; language?: string }) =>
    api.post('/files', data),
  
  update: (id: number, data: { name?: string; path?: string; language?: string }) =>
    api.put(`/files/${id}`, data),
  
  save: (id: number, content: string, createSnapshot = false) =>
    api.post(`/files/${id}/save`, { content, create_snapshot: createSnapshot }),
  
  delete: (id: number, permanent = false) =>
    api.delete(`/files/${id}`, { params: { permanent } }),
  
  restore: (id: number) =>
    api.post(`/files/${id}/restore`),
  
  duplicate: (id: number) =>
    api.post(`/files/${id}/duplicate`),
  
  export: (id: number) =>
    api.get(`/files/${id}/export`, { responseType: 'blob' }),
  
  exportAll: () =>
    api.get('/files/export-all', { responseType: 'blob' }),
  
  import: (data: { files: Array<{ name: string; path: string; content: string; language?: string }> }) =>
    api.post('/files/import', data),
}

// History API
export const historyApi = {
  getVersions: (fileId: number) =>
    api.get(`/history/${fileId}/versions`),
  
  getVersionContent: (fileId: number, versionId: number) =>
    api.get(`/history/${fileId}/versions/${versionId}`),
  
  restoreVersion: (fileId: number, versionId: number) =>
    api.post(`/history/${fileId}/restore`, { version_id: versionId }),
}

// System API
export const systemApi = {
  health: () => api.get('/health'),
  
  version: () => api.get('/version'),
  
  checkUpdate: () => api.get('/check-update'),
  
  performUpdate: () => api.post('/update'),
  
  verifyTotp: (totpCode: string) => api.post('/auth/verify-totp', { totp_code: totpCode }),
}
