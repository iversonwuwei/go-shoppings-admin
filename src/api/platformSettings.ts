import request from './request'

export interface PlatformGlobalSettings {
  id: number
  platform_name: string
  platform_logo: string
  support_phone: string
  support_email: string
  wxpay_app_id: string
  wxpay_mch_id: string
  wxpay_apiv3_key: string
  wxpay_cert_serial: string
  wxpay_notify_url: string
  updated_at?: string
}

export function getPlatformSettings() {
  return request.get<any, PlatformGlobalSettings>('/platform/settings')
}

export function updatePlatformSettings(body: Partial<PlatformGlobalSettings>) {
  return request.put('/platform/settings', body)
}
