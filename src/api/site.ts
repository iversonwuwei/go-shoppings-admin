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
  storefront_notice: string
  storefront_hero_title: string
  storefront_hero_subtitle: string
  storefront_search_placeholder: string
  storefront_category_title: string
  storefront_coupon_title: string
  storefront_hot_title: string
  storefront_recommend_title: string
  storefront_quick_entries: StorefrontQuickEntry[]
  storefront_service_cards: StorefrontServiceCard[]
  storefront_banners: StorefrontBanner[]
  storefront_promo_cards: StorefrontPromoCard[]
  storefront_member_entries: StorefrontMemberEntry[]
  storefront_home_sections: string[]
  storefront_profile_sections: string[]
  storefront_search_keywords: string[]
  updated_at?: string
}

export interface StorefrontQuickEntry {
  title: string
  subtitle: string
  path: string
}

export interface StorefrontServiceCard {
  title: string
  desc: string
}

export interface StorefrontBanner {
  title: string
  subtitle: string
  image: string
  path: string
}

export interface StorefrontPromoCard {
  title: string
  subtitle: string
  tag: string
  path: string
}

export interface StorefrontMemberEntry {
  title: string
  subtitle: string
  path: string
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

export function updateSiteStorefront(data: {
  primary_color?: string
  storefront_notice?: string
  storefront_hero_title?: string
  storefront_hero_subtitle?: string
  storefront_search_placeholder?: string
  storefront_category_title?: string
  storefront_coupon_title?: string
  storefront_hot_title?: string
  storefront_recommend_title?: string
  storefront_quick_entries?: StorefrontQuickEntry[]
  storefront_service_cards?: StorefrontServiceCard[]
  storefront_banners?: StorefrontBanner[]
  storefront_promo_cards?: StorefrontPromoCard[]
  storefront_member_entries?: StorefrontMemberEntry[]
  storefront_home_sections?: string[]
  storefront_profile_sections?: string[]
  storefront_search_keywords?: string[]
}) {
  return request.put<any, SiteConfig>('/admin/site/storefront', data)
}
