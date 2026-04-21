import { defineStore } from 'pinia'

export type LoginRole = 'platform' | 'tenant'

export interface AdminInfo {
  id: number
  username: string
  real_name: string
  phone: string
  email: string
  role: string
  tenant_id: number
  status: number
}

interface UserState {
  token: string
  refreshToken: string
  role: LoginRole | ''
  tenantId: number
  admin: AdminInfo | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: '',
    refreshToken: '',
    role: '',
    tenantId: 0,
    admin: null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isPlatform: (s) => s.role === 'platform',
    isTenant: (s) => s.role === 'tenant',
  },
  actions: {
    setSession(token: string, refreshToken: string, admin: AdminInfo, role: LoginRole, tenantId = 0) {
      this.token = token
      this.refreshToken = refreshToken
      this.admin = admin
      this.role = role
      this.tenantId = tenantId || admin.tenant_id || 0
    },
    logout() {
      this.token = ''
      this.refreshToken = ''
      this.role = ''
      this.tenantId = 0
      this.admin = null
    },
  },
  persist: { key: 'shopadmin_user' },
})
