import request from './request'

export interface GrouponActivity {
  id?: number
  name: string
  product_id: number
  sku_id?: number
  group_price: string | number
  original_price: string | number
  require_num: number
  expire_hours: number
  total_stock: number
  sold_count?: number
  start_at: string
  end_at: string
  status: number
  created_at?: string
}

export interface Groupon {
  id: number
  activity_id: number
  leader_id: number
  require_num: number
  current_num: number
  status: number
  expires_at: string
  succeed_at?: string
  created_at: string
}

export interface PagedList<T> { list: T[]; total: number; page: number; size: number }

export function listGrouponActivities(params: { page?: number; size?: number } = {}) {
  return request.get<any, PagedList<GrouponActivity>>('/admin/groupon/activities', { params })
}

export function createGrouponActivity(body: GrouponActivity) {
  return request.post<any, GrouponActivity>('/admin/groupon/activities', body)
}

export function updateGrouponActivity(id: number, body: GrouponActivity) {
  return request.put<any, any>(`/admin/groupon/activities/${id}`, body)
}

export function deleteGrouponActivity(id: number) {
  return request.delete<any, any>(`/admin/groupon/activities/${id}`)
}

export function listGroupons(params: { activity_id?: number; page?: number; size?: number } = {}) {
  return request.get<any, PagedList<Groupon>>('/admin/groupon/groupons', { params })
}
