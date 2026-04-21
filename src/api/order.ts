import request from './request'

export interface Order {
  id: number
  order_no: string
  member_id: number
  total_amount: string
  pay_amount: string
  status: string
  pay_status: string
  contact_name: string
  contact_phone: string
  address_detail: string
  express_company: string
  express_no: string
  created_at: string
  paid_at?: string | null
  shipped_at?: string | null
}

export interface OrderListResp {
  list: Order[]
  total: number
  page: number
  size: number
}

export function listOrders(params: { page?: number; size?: number; status?: string }) {
  return request.get<any, OrderListResp>('/admin/orders', { params })
}

export function shipOrder(id: number, company: string, no: string) {
  return request.post(`/admin/orders/${id}/ship`, { express_company: company, express_no: no })
}
