import type { ApiToken } from '@/api/apiAccess'
import { listApiTokens } from '@/api/apiAccess'
import type { AdminMember } from '@/api/member'
import type { TenantRow } from '@/api/platform'
import { listTenants } from '@/api/platform'
import type { Product } from '@/api/product'

export interface RelatedInfoDisplay {
  title: string
  subtitle?: string
}

export function uniquePositiveIds(values: Array<number | null | undefined>) {
  return Array.from(new Set(values.map((value) => Number(value || 0)).filter((value) => value > 0)))
}

function compactJoin(parts: Array<string | number | null | undefined>) {
  return parts
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' · ')
}

export function memberInfo(member: AdminMember | undefined, id: number | null | undefined): RelatedInfoDisplay {
  const targetId = Number(id || 0)
  if (!targetId) return { title: '-' }
  if (!member) return { title: `未找到会员 #${targetId}` }
  return {
    title: member.nickname || member.phone || `会员 #${member.id}`,
    subtitle: compactJoin([member.phone || '未绑定手机', member.level_name, `ID ${member.id}`]),
  }
}

export function tenantInfo(tenant: TenantRow | undefined, id: number | null | undefined): RelatedInfoDisplay {
  const targetId = Number(id || 0)
  if (!targetId) return { title: '-' }
  if (!tenant) return { title: `未找到租户 #${targetId}` }
  return {
    title: tenant.company_name || tenant.code || `租户 #${tenant.id}`,
    subtitle: compactJoin([tenant.code ? `编号 ${tenant.code}` : '', tenant.contact_name, tenant.contact_phone, `ID ${tenant.id}`]),
  }
}

export function productInfo(product: Product | undefined, id: number | null | undefined): RelatedInfoDisplay {
  const targetId = Number(id || 0)
  if (!targetId) return { title: '-' }
  if (!product) return { title: `未找到商品 #${targetId}` }
  return {
    title: product.name || `商品 #${product.id}`,
    subtitle: compactJoin([product.subtitle, product.price ? `价格 ${product.price}` : '', `ID ${product.id}`]),
  }
}

export function tokenInfo(token: ApiToken | undefined, id: number | null | undefined): RelatedInfoDisplay {
  const targetId = Number(id || 0)
  if (!targetId) return { title: '-' }
  if (!token) return { title: `未找到 Token #${targetId}` }
  return {
    title: token.name || `Token #${token.id}`,
    subtitle: compactJoin([token.app_key, `ID ${token.id}`]),
  }
}

export async function loadTenantLookup(ids: Array<number | null | undefined>, current = new Map<number, TenantRow>()) {
  const missing = uniquePositiveIds(ids).filter((id) => !current.has(id))
  if (!missing.length) return current
  const next = new Map(current)
  await Promise.all(missing.map(async (id) => {
    const resp = await listTenants({ page: 1, size: 5, keyword: String(id) })
    const tenant = (resp.list || []).find((item) => item.id === id)
    if (tenant) next.set(id, tenant)
  }))
  return next
}

export async function loadTokenLookup(ids: Array<number | null | undefined>, current = new Map<number, ApiToken>()) {
  const missing = uniquePositiveIds(ids).filter((id) => !current.has(id))
  if (!missing.length) return current
  const tokens = await listApiTokens()
  const next = new Map(current)
  for (const token of tokens || []) {
    if (missing.includes(token.id)) next.set(token.id, token)
  }
  return next
}