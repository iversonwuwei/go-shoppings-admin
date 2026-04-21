import request from './request'

export interface Product {
  id: number
  tenant_id: number
  category_id: number
  name: string
  subtitle: string
  cover_image: string
  images: string[]
  description: string
  price: string
  stock: number
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

export function listProducts(params: { page?: number; size?: number; keyword?: string; category_id?: number }) {
  return request.get<any, ProductListResp>('/admin/products', { params })
}

export function createProduct(p: Partial<Product>) {
  return request.post<any, Product>('/admin/products', p)
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
  sort: number
  status: number
}

export function listCategories() {
  return request.get<any, Category[]>('/admin/categories')
}

export function createCategory(c: Partial<Category>) {
  return request.post<any, Category>('/admin/categories', c)
}
