import request from './request'

export interface Region {
  id: number
  parent_id: number
  code: string
  name: string
  level: number
  sort: number
  enabled: number
  children?: Region[]
  created_at?: string
  updated_at?: string
}

export function listRegions() {
  return request.get<any, Region[]>('/platform/regions')
}

export function listRegionTree() {
  return request.get<any, Region[]>('/platform/regions/tree')
}

export function createRegion(body: Partial<Region>) {
  return request.post<any, Region>('/platform/regions', body)
}

export function updateRegion(id: number, body: Partial<Region>) {
  return request.put<any, Region>(`/platform/regions/${id}`, body)
}

export function deleteRegion(id: number) {
  return request.delete(`/platform/regions/${id}`)
}