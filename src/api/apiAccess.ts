import request from './request'

export interface ApiToken {
  id: number
  tenant_id: number
  name: string
  app_key: string
  app_secret: string
  scopes: string
  ip_whitelist: string
  status: number
  last_used_at?: string | null
  expires_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiRequestLog {
  id: number
  tenant_id: number
  token_id: number
  app_key: string
  method: string
  path: string
  status_code: number
  ip: string
  cost_ms: number
  created_at: string
}

export interface PagedList<T> {
  list: T[]
  total: number
  page: number
  size: number
}

export function listApiTokens(params?: { tenant_id?: number }) {
  return request.get<any, ApiToken[]>('/platform/api-tokens', { params })
}
export function createApiToken(data: Partial<ApiToken> & { tenant_id: number; name: string }) {
  return request.post<any, ApiToken>('/platform/api-tokens', data)
}
export function updateApiToken(id: number, data: Partial<ApiToken>) {
  return request.put<any, { id: number }>(`/platform/api-tokens/${id}`, data)
}
export function deleteApiToken(id: number) {
  return request.delete<any, null>(`/platform/api-tokens/${id}`)
}
export function regenerateApiToken(id: number) {
  return request.post<any, ApiToken>(`/platform/api-tokens/${id}/regenerate`)
}
export function listApiLogs(params: { page?: number; size?: number; tenant_id?: number; token_id?: number }) {
  return request.get<any, PagedList<ApiRequestLog>>('/platform/api-tokens/logs', { params })
}
