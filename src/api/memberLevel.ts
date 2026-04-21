import request from './request'

export interface MemberLevel {
  id: number
  tenant_id?: number
  name: string
  icon?: string
  color?: string
  min_growth: number
  discount_rate: string | number
  points_mult: string | number
  sort: number
  created_at?: string
}

export function listMemberLevels() {
  return request.get<any, MemberLevel[]>('/admin/member/levels')
}
export function createMemberLevel(body: Partial<MemberLevel>) {
  return request.post<any, MemberLevel>('/admin/member/levels', body)
}
export function updateMemberLevel(id: number, body: Partial<MemberLevel>) {
  return request.put<any, MemberLevel>(`/admin/member/levels/${id}`, body)
}
export function deleteMemberLevel(id: number) {
  return request.delete(`/admin/member/levels/${id}`)
}
