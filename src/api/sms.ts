import request from './request'

export interface SmsSettings {
  tenant_id?: number
  enabled: number
  provider: string
  access_key: string
  access_secret: string
  sign_name: string
  region: string
  remark: string
}

export interface SmsTemplate {
  id: number
  tenant_id: number
  code: string
  name: string
  template_id: string
  content: string
  enabled: number
  created_at?: string
  updated_at?: string
}

export interface SmsLog {
  id: number
  tenant_id: number
  phone: string
  code: string
  content: string
  status: number
  error: string
  biz_id: string
  created_at: string
}

export interface PagedList<T> {
  list: T[]
  total: number
  page: number
  size: number
}

export function getSmsSettings() {
  return request.get<any, SmsSettings>('/platform/sms/settings')
}
export function updateSmsSettings(data: Partial<SmsSettings>) {
  return request.put<any, SmsSettings>('/platform/sms/settings', data)
}
export function listSmsTemplates(params?: { tenant_id?: number }) {
  return request.get<any, SmsTemplate[]>('/platform/sms/templates', { params })
}
export function updateSmsTemplate(id: number, data: Partial<SmsTemplate>) {
  return request.put<any, { id: number }>(`/platform/sms/templates/${id}`, data)
}
export function deleteSmsTemplate(id: number) {
  return request.delete<any, null>(`/platform/sms/templates/${id}`)
}
export function listSmsLogs(params: { tenant_id?: number; page?: number; size?: number; phone?: string }) {
  return request.get<any, PagedList<SmsLog>>('/platform/sms/logs', { params })
}
