import request from './request'

export interface SubscriptionOrder {
  id: number
  tenant_id: number
  plan_id: number
  billing_cycle: string
  amount: string | number
  status: number
  order_no: string
  pay_transaction_id?: string
  pay_at?: string
  expire_before?: string
  expire_after?: string
  created_at?: string
  updated_at?: string
}

export interface CreateSubOrderReq {
  plan_id?: number
  billing_cycle: 'monthly' | 'yearly'
  openid?: string
}

export interface CreateSubOrderResp {
  order: SubscriptionOrder
  pay: any
}

export function createSubscriptionOrder(body: CreateSubOrderReq) {
  return request.post<any, CreateSubOrderResp>('/admin/subscription/orders', body)
}

export function listSubscriptionOrders(params?: { page?: number; page_size?: number }) {
  return request.get<any, { list: SubscriptionOrder[]; total: number }>(
    '/admin/subscription/orders',
    { params }
  )
}
