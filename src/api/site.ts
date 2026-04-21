import request from './request'

export interface SiteConfig {
  tenant_id?: number
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

export function getSiteConfig() {
  return request.get<any, SiteConfig>('/admin/site/config')
}
export function updateSiteDomain(data: { custom_domain: string }) {
  return request.put<any, SiteConfig>('/admin/site/domain', data)
}
export function updateSiteBrand(data: {
  brand_name?: string
  brand_logo?: string
  primary_color?: string
  hide_platform_brand?: number
  footer_text?: string
}) {
  return request.put<any, SiteConfig>('/admin/site/brand', data)
}
export function updateSiteDeployment(data: {
  deployment_mode?: string
  private_endpoint?: string
  private_notes?: string
}) {
  return request.put<any, SiteConfig>('/admin/site/deployment', data)
}
