import { useUserStore } from '@/stores/user'
import axios from 'axios'

export interface UploadResult {
  url: string
  file_key: string
  size: number
  ext: string
  name: string
}

/**
 * 上传单张图片
 * @param file   File 对象
 * @param folder 文件夹分类（products/logo/banner/avatar/...）
 * @param scope  "admin" (租户) 或 "platform" (平台)，默认根据登录角色自动判断
 */
export async function uploadImage(file: File, folder = 'common', scope?: 'admin' | 'platform'): Promise<UploadResult> {
  const user = useUserStore()
  const effective = scope || (user.role === 'platform' ? 'platform' : 'admin')
  const form = new FormData()
  form.append('file', file)
  const resp = await axios.post(`/api/v1/${effective}/upload/image`, form, {
    params: { folder },
    headers: {
      Authorization: user.token ? `Bearer ${user.token}` : '',
      'X-Tenant-ID': user.tenantId ? String(user.tenantId) : '',
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  })
  const body = resp.data
  if (body && body.code === 0) return body.data as UploadResult
  throw new Error(body?.message || '上传失败')
}
