import request from './request'

export interface LoginResp {
  token: string
  refresh_token: string
  admin: {
    id: number
    username: string
    real_name: string
    phone: string
    email: string
    role: string
    tenant_id: number
    status: number
  }
}

export interface SendCodeResp {
  sent: boolean
  dev_code?: string
}

export type VerifyPurpose = 'apply' | 'login' | 'reset_password'

export function platformLogin(username: string, password: string) {
  return request.post<LoginResp, LoginResp>('/platform/auth/login', { username, password })
}

export function tenantLogin(username: string, password: string, tenantId: number) {
  return request.post<LoginResp, LoginResp>(
    '/admin/auth/login',
    { username, password },
    { headers: { 'X-Tenant-ID': String(tenantId) } },
  )
}

// 发送短信验证码（入驻申请 / 手机号登录 / 忘记密码复用）
export function sendVerifyCode(phone: string, purpose: VerifyPurpose, opts?: { scope?: 'platform' | 'tenant' | 'public'; tenantId?: number }) {
  const scope = opts?.scope || 'public'
  const url =
    scope === 'platform'
      ? '/platform/auth/verify-code/send'
      : scope === 'tenant'
        ? '/admin/auth/verify-code/send'
        : '/public/verify-code/send'
  const config = opts?.tenantId ? { headers: { 'X-Tenant-ID': String(opts.tenantId) } } : undefined
  return request.post<SendCodeResp, SendCodeResp>(url, { phone, purpose }, config)
}

// 手机号 + 验证码登录
export function platformLoginBySMS(phone: string, code: string) {
  return request.post<LoginResp, LoginResp>('/platform/auth/login-sms', { phone, code })
}

export function tenantLoginBySMS(phone: string, code: string, tenantId: number) {
  return request.post<LoginResp, LoginResp>(
    '/admin/auth/login-sms',
    { phone, code },
    { headers: { 'X-Tenant-ID': String(tenantId) } },
  )
}

// 忘记密码：通过手机号 + 验证码重置
export function platformResetPassword(phone: string, code: string, newPassword: string) {
  return request.post<{ reset: boolean }, { reset: boolean }>('/platform/auth/reset-password', {
    phone,
    code,
    new_password: newPassword,
  })
}

export function tenantResetPassword(phone: string, code: string, newPassword: string, tenantId: number) {
  return request.post<{ reset: boolean }, { reset: boolean }>(
    '/admin/auth/reset-password',
    { phone, code, new_password: newPassword },
    { headers: { 'X-Tenant-ID': String(tenantId) } },
  )
}
