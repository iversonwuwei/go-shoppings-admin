import request from './request'

export type CouponType = 'cash' | 'discount' | 'shipping'

export interface Coupon {
  id: number
  tenant_id?: number
  name: string
  type: CouponType
  threshold_amount?: string | number | null
  discount_value: string | number
  max_discount?: string | number | null
  total_count: number
  remain_count: number
  per_limit: number
  receive_start_at?: string | null
  receive_end_at?: string | null
  valid_start_at?: string | null
  valid_end_at?: string | null
  valid_days: number
  applicable_type: string
  status: number
  created_at?: string
}

export function listCoupons() {
  return request.get<any, Coupon[]>('/admin/coupons')
}
export function createCoupon(body: Partial<Coupon>) {
  return request.post<any, Coupon>('/admin/coupons', body)
}
export function updateCoupon(id: number, body: Partial<Coupon>) {
  return request.put<any, any>(`/admin/coupons/${id}`, body)
}
export function deleteCoupon(id: number) {
  return request.delete(`/admin/coupons/${id}`)
}
