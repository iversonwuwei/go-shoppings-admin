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

// 通过租户编号（子域名）解析出租户 ID，避免用户直接输入数字主键
export interface TenantSummary {
  id: number
  code: string
  status: number
  company_name?: string
  brand_name?: string
}

export function resolveTenantByCode(code: string) {
  return request.get<TenantSummary, TenantSummary>('/public/tenant/resolve', { params: { code } })
}

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

// 入驻申请：公开接口（不需要登录态）
export interface ApplyTenantBody {
  code: string            // 租户编号 / 子域名
  company_name: string    // 公司名称
  brand_name?: string     // 品牌名（小程序展示）
  contact_name: string    // 联系人
  contact_phone: string   // 联系电话（同时作为管理员手机号）
  contact_email?: string  // 联系邮箱
  plan_id?: number        // 选购套餐
  billing_cycle?: 'monthly' | 'yearly'
  username: string        // 管理员账号
  password: string        // 管理员密码
  confirm?: string        // 再次输入密码（前端校验，后端忽略）
  verify_code: string     // 手机号验证码
}

export interface ApplyTenantResp {
  id: number
  code: string
  status: number
  admin_id?: number
  username?: string
}

export function applyTenant(body: ApplyTenantBody) {
  return request.post<ApplyTenantResp, ApplyTenantResp>('/public/apply', body)
}
