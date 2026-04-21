import request from './request'

export interface PointsSetting {
  tenant_id?: number
  enabled: number
  earn_rate: string | number
  min_amount: string | number
  redeem_rate: number
  remark: string
  updated_at?: string
}

export function getPointsSettings() {
  return request.get<any, PointsSetting>('/admin/points/settings')
}

export function updatePointsSettings(body: Partial<PointsSetting>) {
  return request.put<any, PointsSetting>('/admin/points/settings', body)
}
