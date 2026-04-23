import request from './request'

export interface Order {
  id: number
  order_no: string
  member_id: number
  total_amount: string
  actual_amount: string
  status: string
  receiver_name: string
  receiver_phone: string
  receiver_address: string
  express_company: string
  express_no: string
  created_at: string
  paid_at?: string | null
  shipped_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
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

export interface OrderLog {
  id: number
  action: string
  before_status: string
  after_status: string
  operator_type: string
  operator_id: number
  remark: string
  created_at: string
}

export function listOrderLogs(id: number) {
  return request.get<any, OrderLog[]>(`/admin/orders/${id}/logs`)
}

export interface OrderMessage {
  id: number
  order_id: number
  order_no: string
  event_type: string
  title: string
  content: string
  status: string
  read_at?: string | null
  created_at: string
}

export interface OrderMessageListResp {
  list: OrderMessage[]
  total: number
  unread: number
  page: number
  size: number
}

export function listOrderMessages(params: { page?: number; size?: number; status?: string }) {
  return request.get<any, OrderMessageListResp>('/admin/order-messages', { params })
}

export function markOrderMessageRead(id: number) {
  return request.post(`/admin/order-messages/${id}/read`)
}

export function markAllOrderMessagesRead() {
  return request.post('/admin/order-messages/read-all')
}
