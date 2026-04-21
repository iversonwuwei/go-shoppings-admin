import request from './request'

export interface PlatformUser {
  id: number
  username: string
  real_name: string
  phone: string
  email: string
  role: string
  tenant_id: number
  status: number
  last_login_at?: string
  last_login_ip?: string
  created_at?: string
}

export const PLATFORM_ROLES = [
  { value: 'super', label: '超级管理员', desc: '拥有平台所有权限（含用户管理）' },
  { value: 'operator', label: '运营', desc: '租户审核 / 套餐 / 域名 / 部署等日常运营' },
  { value: 'finance', label: '财务', desc: '订阅订单与收款审核（主要为读）' },
  { value: 'support', label: '客服', desc: '只读查看租户与订单信息' },
]

export function listPlatformUsers(params?: { keyword?: string; page?: number; page_size?: number }) {
  return request.get<any, { list: PlatformUser[]; total: number }>('/platform/users', { params })
}

export function createPlatformUser(body: Partial<PlatformUser> & { password: string }) {
  return request.post<any, PlatformUser>('/platform/users', body)
}

export function updatePlatformUser(id: number, body: Partial<PlatformUser>) {
  return request.put(`/platform/users/${id}`, body)
}

export function resetPlatformUserPassword(id: number, password: string) {
  return request.post(`/platform/users/${id}/reset-password`, { password })
}

export function deletePlatformUser(id: number) {
  return request.delete(`/platform/users/${id}`)
}

export function getMe() {
  return request.get<any, PlatformUser>('/platform/me')
}
