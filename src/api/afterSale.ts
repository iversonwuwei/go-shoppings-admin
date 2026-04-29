import request from './request'

export interface AfterSaleOrder {
  id: number
  tenant_id: number
  after_sale_no: string
  order_id: number
  order_no: string
  order_item_id: number
  member_id: number
  type: string
  status: string
  amount: string
  reason: string
  description: string
  images: string[]
  order_status_before: string
  audit_remark: string
  refund_remark: string
  return_express_code: string
  return_express_company: string
  return_express_no: string
  refund_no: string
  applied_at: string
  audited_at?: string | null
  returned_at?: string | null
  received_at?: string | null
  refunded_at?: string | null
  cancelled_at?: string | null
  created_at: string
  updated_at: string
}

export interface AfterSaleListResp {
  list: AfterSaleOrder[]
  total: number
  page: number
  size: number
}

export function listAfterSales(params: { page?: number; size?: number; status?: string; order_id?: number; member_id?: number }) {
  return request.get<any, AfterSaleListResp>('/admin/after-sales', { params })
}

export function getAfterSale(id: number) {
  return request.get<any, AfterSaleOrder>(`/admin/after-sales/${id}`)
}

export function approveAfterSale(id: number, remark = '') {
  return request.post(`/admin/after-sales/${id}/approve`, { remark })
}

export function rejectAfterSale(id: number, remark = '') {
  return request.post(`/admin/after-sales/${id}/reject`, { remark })
}

export function receiveAfterSale(id: number, remark = '') {
  return request.post(`/admin/after-sales/${id}/receive`, { remark })
}

export function refundAfterSale(id: number, remark = '') {
  return request.post(`/admin/after-sales/${id}/refund`, { remark })
}
