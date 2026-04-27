import type { Product, ProductListResp } from './product'
import request from './request'

export type InventoryStockStatus = '' | 'out' | 'low' | 'normal'
export type InventoryChangeType = 'in' | 'out' | 'set' | 'warning'

export interface InventoryListParams {
  page?: number
  size?: number
  keyword?: string
  stock_status?: InventoryStockStatus
}

export interface InventoryAdjustPayload {
  change_type: InventoryChangeType
  quantity?: number
  stock_warning?: number
  remark?: string
}

export interface InventoryAdjustResult {
  product: Product
  change_type: InventoryChangeType
  quantity: number
  before_stock: number
  after_stock: number
  before_warning: number
  after_warning: number
  remark: string
}

export function listInventoryProducts(params: InventoryListParams) {
  return request.get<any, ProductListResp>('/admin/inventory/products', { params })
}

export function adjustProductInventory(id: number, payload: InventoryAdjustPayload) {
  return request.patch<any, InventoryAdjustResult>(`/admin/inventory/products/${id}`, payload)
}
