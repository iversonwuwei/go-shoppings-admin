import request from './request'

export interface Plan {
  id: number
  name: string
  code: string
  monthly_fee: string | number
  yearly_fee: string | number
  product_limit: number
  order_limit: number
  user_limit: number
  features: string[]
  is_default: number
  status: number
  created_at?: string
  updated_at?: string
}

export interface PlanFeature {
  id: number
  code: string
  name: string
  description: string
  group_name: string
  sort: number
  status: number
  created_at?: string
  updated_at?: string
}

export function listPlans() {
  return request.get<any, Plan[]>('/platform/plans')
}
export function createPlan(body: Partial<Plan>) {
  return request.post<any, Plan>('/platform/plans', body)
}
export function updatePlan(id: number, body: Partial<Plan>) {
  return request.put<any, Plan>(`/platform/plans/${id}`, body)
}
export function deletePlan(id: number) {
  return request.delete(`/platform/plans/${id}`)
}

export function listFeatures() {
  return request.get<any, PlanFeature[]>('/platform/features')
}
export function createFeature(body: Partial<PlanFeature>) {
  return request.post<any, PlanFeature>('/platform/features', body)
}
export function updateFeature(id: number, body: Partial<PlanFeature>) {
  return request.put<any, PlanFeature>(`/platform/features/${id}`, body)
}
export function deleteFeature(id: number) {
  return request.delete(`/platform/features/${id}`)
}
export function listPublicFeatures() {
  return request.get<any, PlanFeature[]>('/public/features')
}

export function listPublicPlans() {
  return request.get<any, Plan[]>('/public/plans')
}