import request from './request'

export interface DeliverySettings {
  tenant_id?: number
  express_enabled: number
  express_free_amount: number
  express_default_fee: number
  city_enabled: number
  city_radius_km: number
  city_base_fee: number
  city_per_km_fee: number
  city_min_order: number
  pickup_enabled: number
  pickup_address: string
  pickup_hours: string
  pickup_phone: string
  remark: string
  updated_at?: string
}

export function getDeliverySettings() {
  return request.get<any, DeliverySettings>('/admin/delivery/settings')
}
export function updateDeliverySettings(data: Partial<DeliverySettings>) {
  return request.put<any, DeliverySettings>('/admin/delivery/settings', data)
}
