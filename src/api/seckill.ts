import request from './request'

export interface SeckillProduct {
  id?: number
  product_id: number
  sku_id?: number
  seckill_price: string | number
  stock: number
  sold_count?: number
}

export interface SeckillActivity {
  id: number
  tenant_id?: number
  name: string
  start_at: string
  end_at: string
  per_limit: number
  total_stock: number
  status: number
  created_at?: string
  products: SeckillProduct[]
}

export function listSeckillActivities() {
  return request.get<any, SeckillActivity[]>('/admin/seckill/activities')
}
export function createSeckillActivity(body: Partial<SeckillActivity>) {
  return request.post<any, SeckillActivity>('/admin/seckill/activities', body)
}
export function updateSeckillActivity(id: number, body: Partial<SeckillActivity>) {
  return request.put<any, any>(`/admin/seckill/activities/${id}`, body)
}
export function deleteSeckillActivity(id: number) {
  return request.delete(`/admin/seckill/activities/${id}`)
}
