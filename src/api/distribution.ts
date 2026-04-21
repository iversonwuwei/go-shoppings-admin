import request from './request'

export interface DistributionSettings {
  tenant_id?: number
  enabled: number
  level1_rate: string | number
  level2_rate: string | number
  min_withdraw: string | number
  auto_become: number
  remark: string
  updated_at?: string
}

export interface Distributor {
  id: number
  member_id: number
  parent_id: number
  grandparent_id: number
  status: number
  total_commission: string
  pending_commission: string
  withdrawn: string
  invite_count: number
  created_at: string
  approved_at?: string
}

export interface CommissionLog {
  id: number
  distributor_id: number
  member_id: number
  order_id: number
  order_no: string
  buyer_id: number
  level: number
  amount: string
  rate: string
  status: number
  settled_at?: string
  created_at: string
}

export interface PagedList<T> { list: T[]; total: number; page: number; size: number }

export function getDistributionSettings() {
  return request.get<any, DistributionSettings>('/admin/distribution/settings')
}
export function updateDistributionSettings(body: Partial<DistributionSettings>) {
  return request.put<any, DistributionSettings>('/admin/distribution/settings', body)
}
export function listDistributors(params: { status?: number; page?: number; size?: number } = {}) {
  return request.get<any, PagedList<Distributor>>('/admin/distribution/distributors', { params })
}
export function auditDistributor(id: number, status: number) {
  return request.put<any, any>(`/admin/distribution/distributors/${id}/audit`, { status })
}
export function listCommissions(params: { distributor_id?: number; page?: number; size?: number } = {}) {
  return request.get<any, PagedList<CommissionLog>>('/admin/distribution/commissions', { params })
}
