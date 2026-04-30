import request from './request';
import type { StorefrontQuickEntry } from './site';

export function getDashboard() {
  return request.get<any, { tenants_total: number; revenue_total: number }>('/platform/dashboard')
}

export interface TenantRow {
  id: number
  code: string
  company_name: string
  contact_name: string
  contact_phone: string
  contact_email: string
  plan_id: number
  plan_expire_at?: string
  is_paid?: boolean
  membership_start_at?: string
  membership_end_at?: string
  status: number
  extra_features?: string[]
  reject_reason?: string
  created_at: string
}

export function listTenants(params: { page?: number; size?: number; keyword?: string; status?: number }) {
  return request.get<any, { list: TenantRow[]; total: number; page: number; size: number }>(
    '/platform/tenants',
    { params },
  )
}

export function auditTenant(id: number, approve: boolean, reason = '') {
  return request.post(`/platform/tenants/${id}/audit`, { approve, reason })
}

// 平台手动封禁 / 恢复（status: 1=正常, 3=封禁）
export function updateTenantStatus(id: number, status: number, reason = '') {
  return request.patch(`/platform/tenants/${id}/status`, { status, reason })
}

// 平台修改套餐 / 续期
export function updateTenantPlan(id: number, planID: number, planExpireAt?: string) {
  const body: Record<string, unknown> = { plan_id: planID }
  if (planExpireAt) body.plan_expire_at = planExpireAt
  return request.patch(`/platform/tenants/${id}/plan`, body)
}

// 平台为租户单独授予/撤销附加功能
export function updateTenantFeatures(id: number, extraFeatures: string[]) {
  return request.patch(`/platform/tenants/${id}/features`, { extra_features: extraFeatures })
}

export function getTenantQuickEntries(id: number) {
  return request.get<any, { storefront_quick_entries: StorefrontQuickEntry[] }>(`/platform/tenants/${id}/storefront/quick-entries`)
}

export function updateTenantQuickEntries(id: number, storefrontQuickEntries: StorefrontQuickEntry[]) {
  return request.put<any, { storefront_quick_entries: StorefrontQuickEntry[] }>(`/platform/tenants/${id}/storefront/quick-entries`, {
    storefront_quick_entries: storefrontQuickEntries,
  })
}
