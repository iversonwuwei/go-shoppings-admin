import axios from 'axios'
import request from './request'
import { useUserStore } from '@/stores/user'

export interface Product {
  id: number
  tenant_id: number
  category_id: number | null
  name: string
  subtitle: string
  cover_image: string
  images: string[]
  video_url: string
  description: string
  price: string
  stock: number
  stock_warning: number
  has_sku: number
  delivery_type: string[]
  delivery_fee: string
  status: number
  is_hot: number
  is_recommend: number
  is_virtual: number
  sort: number
  sold_count: number
  view_count: number
  created_at: string
  updated_at: string
}

export interface ProductListResp {
  list: Product[]
  total: number
  page: number
  size: number
}

export interface ProductImportError {
  row: number
  message: string
}

export interface ProductImportResult {
  imported: number
  errors: ProductImportError[]
}

export function listProducts(params: { page?: number; size?: number; keyword?: string; category_id?: number }) {
  return request.get<any, ProductListResp>('/admin/products', { params })
}

export function createProduct(p: Partial<Product>) {
  return request.post<any, Product>('/admin/products', p)
}

function authHeaders() {
  const user = useUserStore()
  return {
    Authorization: user.token ? `Bearer ${user.token}` : '',
    'X-Tenant-ID': user.tenantId ? String(user.tenantId) : '',
  }
}

export async function downloadProductImportTemplate() {
  const resp = await axios.get('/api/v1/admin/products/import-template', {
    responseType: 'blob',
    headers: authHeaders(),
  })
  return resp.data as Blob
}

export async function uploadProductImport(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<any, ProductImportResult>('/admin/products/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function updateProduct(id: number, p: Partial<Product>) {
  return request.put<any, Product>(`/admin/products/${id}`, p)
}

export function updateProductStatus(id: number, status: number) {
  return request.patch(`/admin/products/${id}/status`, { status })
}

export function deleteProduct(id: number) {
  return request.delete(`/admin/products/${id}`)
}

export interface Category {
  id: number
  parent_id: number
  name: string
  icon: string
  cover_image: string
  sort: number
  status: number
}

export function listCategories() {
  return request.get<any, Category[]>('/admin/categories')
}

export function updateTenantCategoryMedia(id: number, payload: { cover_image?: string; icon?: string }) {
  return request.put<any, { id: number; cover_image: string; icon: string }>(`/admin/categories/${id}/media`, payload)
}

// 平台端：商品分类统一管理（tenant_id=0 共享给所有租户）
export function listPlatformCategories() {
  return request.get<any, Category[]>('/platform/categories')
}

export function createPlatformCategory(c: Partial<Category>) {
  return request.post<any, Category>('/platform/categories', c)
}

export function updatePlatformCategory(id: number, c: Partial<Category>) {
  return request.put<any, Category>(`/platform/categories/${id}`, c)
}

export function deletePlatformCategory(id: number) {
  return request.delete(`/platform/categories/${id}`)
}
