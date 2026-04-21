import request from './request'

export interface LoginResp {
  token: string
  refresh_token: string
  admin: {
    id: number
    username: string
    real_name: string
    phone: string
    email: string
    role: string
    tenant_id: number
    status: number
  }
}

export function platformLogin(username: string, password: string) {
  return request.post<LoginResp, LoginResp>('/platform/auth/login', { username, password })
}

export function tenantLogin(username: string, password: string, tenantId: number) {
  return request.post<LoginResp, LoginResp>(
    '/admin/auth/login',
    { username, password },
    { headers: { 'X-Tenant-ID': String(tenantId) } },
  )
}
