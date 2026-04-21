import request from './request'

export interface TenantSiteConfig {
  tenant_id: number
  custom_domain: string
  domain_verified: number
  ssl_status: string
  brand_name: string
  brand_logo: string
  primary_color: string
  hide_platform_brand: number
  footer_text: string
  deployment_mode: string
  private_endpoint: string
  private_notes: string
  updated_at?: string
}

export function listDomains() {
  return request.get<any, TenantSiteConfig[]>('/platform/domains')
}
export function verifyDomain(tid: number) {
  return request.post<any, null>(`/platform/domains/${tid}/verify`)
}
export function rejectDomain(tid: number) {
  return request.post<any, null>(`/platform/domains/${tid}/reject`)
}

export function listDeployments(params?: { mode?: string }) {
  return request.get<any, TenantSiteConfig[]>('/platform/deployments', { params })
}
export function updateDeployment(data: {
  tenant_id: number
  deployment_mode: string
  private_endpoint?: string
  private_notes?: string
}) {
  return request.put<any, null>('/platform/deployments', data)
}
