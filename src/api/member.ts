import request from './request'

export interface AdminMember {
  id: number
  tenant_id: number
  openid: string
  unionid?: string
  nickname: string
  avatar: string
  gender: number
  birthday?: string | null
  phone: string
  level_id?: number | null
  level_name?: string
  level_color?: string
  level_expire_at?: string | null
  points: number
  growth_value: number
  parent_id: number
  level1_count: number
  level2_count: number
  status: number
  last_login_at?: string | null
  created_at: string
  updated_at: string
}

export interface AdminMemberListResp {
  list: AdminMember[]
  total: number
  page: number
  size: number
}

export interface MemberAddress {
  id: number
  member_id: number
  receiver_name: string
  receiver_phone: string
  province: string
  city: string
  district: string
  address: string
  postcode?: string
  is_default: number
  created_at: string
}

export interface PointsLog {
  id: number
  member_id: number
  change_type: string
  change_value: number
  balance_before: number
  balance_after: number
  source_desc: string
  remark: string
  created_at: string
}

export interface MemberCoupon {
  id: number
  member_id: number
  coupon_id: number
  coupon_name: string
  coupon_type: string
  threshold_amount?: string | number | null
  discount_value: string | number
  max_discount?: string | number | null
  use_limit: number
  received_at: string
  valid_start_at: string
  valid_end_at: string
  used_at?: string | null
  used_order_id: number
  status: string
  created_at: string
}

export interface AdminMemberDetailResp {
  member: AdminMember
  addresses: MemberAddress[]
  points_logs: PointsLog[]
  coupons: MemberCoupon[]
}

export function listMembers(params: { page?: number; size?: number; keyword?: string; status?: number; level_id?: number }) {
  return request.get<any, AdminMemberListResp>('/admin/members', { params })
}

export function getMemberDetail(id: number) {
  return request.get<any, AdminMemberDetailResp>(`/admin/members/${id}`)
}

export function updateMemberStatus(id: number, status: number) {
  return request.patch(`/admin/members/${id}/status`, { status })
}

export function updateMemberLevel(id: number, levelId: number | null, levelExpireAt?: string | null) {
  return request.patch(`/admin/members/${id}/level`, {
    level_id: levelId,
    level_expire_at: levelExpireAt || null,
  })
}

export function adjustMemberPoints(id: number, body: { change_value: number; source_desc?: string; remark?: string }) {
  return request.post<any, PointsLog>(`/admin/members/${id}/points/adjust`, body)
}

export function grantMemberCoupon(id: number, couponId: number) {
  return request.post<any, MemberCoupon>(`/admin/members/${id}/coupons`, { coupon_id: couponId })
}

export function updateMemberCouponStatus(id: number, memberCouponId: number, status: 'unused' | 'expired') {
  return request.patch(`/admin/members/${id}/coupons/${memberCouponId}/status`, { status })
}
