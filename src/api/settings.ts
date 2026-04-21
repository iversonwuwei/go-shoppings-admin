import request from './request'

export interface PaymentConfig {
  id: number
  tenant_id: number
  provider: string
  mch_id: string
  app_id: string
  api_v3_key: string
  cert_serial_no: string
  private_key_pem: string
  cert_pem: string
  notify_url: string
  enabled: number
  audit_status: number
  audit_remark: string
  submitted_at?: string | null
  audited_at?: string | null
}

export interface Carrier {
  id: number
  tenant_id: number
  code: string
  name: string
  api_provider: string
  api_customer: string
  api_key: string
  api_secret?: string
  priority: number
  enabled: number
  audit_status: number
  audit_remark: string
  submitted_at?: string | null
  audited_at?: string | null
}

// ==== 商户端 ====
export function getPaymentConfigs() {
  return request.get<any, PaymentConfig[]>('/admin/settings/payment')
}
export function submitPaymentConfig(payload: Partial<PaymentConfig>) {
  return request.put<any, PaymentConfig>('/admin/settings/payment', payload)
}

// 商户端：只读 + 物流查询
export function listCarriersForTenant() {
  return request.get<any, Carrier[]>('/admin/settings/carriers')
}
export interface TrackNode { time: string; context: string; status: string }
export interface TrackResult { carrier_code: string; carrier_name: string; api_provider: string; tracking_no: string; status: string; nodes: TrackNode[] }
export function queryTrack(carrierCode: string, trackingNo: string) {
  return request.get<any, TrackResult>('/admin/settings/carriers/track', {
    params: { carrier_code: carrierCode, tracking_no: trackingNo },
  })
}

// ==== 平台端 ====
export interface AuditListResp<T> { list: T[]; total: number; page: number; size: number }
export function listPaymentAudit(params: { page?: number; size?: number; status?: number }) {
  return request.get<any, AuditListResp<PaymentConfig>>('/platform/payment-configs', { params })
}
export function auditPayment(id: number, approve: boolean, remark = '') {
  return request.post(`/platform/payment-configs/${id}/audit`, { approve, remark })
}

// 平台端：物流承运商 CRUD
export function listAllCarriers() {
  return request.get<any, Carrier[]>('/platform/carriers')
}
export function createCarrier(payload: Partial<Carrier>) {
  return request.post<any, Carrier>('/platform/carriers', payload)
}
export function updateCarrier(id: number, payload: Partial<Carrier>) {
  return request.put<any, Carrier>(`/platform/carriers/${id}`, payload)
}
export function toggleCarrier(id: number, enabled: boolean) {
  return request.patch(`/platform/carriers/${id}/enabled`, { enabled })
}
export function deleteCarrier(id: number) {
  return request.delete(`/platform/carriers/${id}`)
}
