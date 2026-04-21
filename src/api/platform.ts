import request from './request';

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
  status: number
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
