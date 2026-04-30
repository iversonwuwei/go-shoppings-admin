import { useUserStore } from '@/stores/user'
import axios from 'axios'
import { apiURL } from './request'

export interface UploadResult {
  url: string
  file_key: string
  size: number
  ext: string
  name: string
  model?: string
  revised_prompt?: string
}

export interface GenerateAIImageBody {
  prompt: string
  usage?: string
  folder?: string
  width?: number
  height?: number
  aspect_ratio?: string
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
  const resp = await axios.post(apiURL(`/${effective}/upload/image`), form, {
    params: { folder },
    headers: {
      Authorization: user.token ? `Bearer ${user.token}` : '',
      'X-Tenant-ID': user.tenantId ? String(user.tenantId) : '',
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
    validateStatus: () => true,
  })
  const body = resp.data
  if (resp.status < 200 || resp.status >= 300) throw new Error(uploadErrorMessage(body, `上传失败(${resp.status})`))
  if (body && body.code === 0) return body.data as UploadResult
  throw new Error(uploadErrorMessage(body, '上传失败'))
}

export async function generateAIImage(body: GenerateAIImageBody, scope?: 'admin' | 'platform'): Promise<UploadResult> {
  const user = useUserStore()
  const effective = scope || (user.role === 'platform' ? 'platform' : 'admin')
  const resp = await axios.post(apiURL(`/${effective}/upload/ai-image`), body, {
    headers: {
      Authorization: user.token ? `Bearer ${user.token}` : '',
      'X-Tenant-ID': user.tenantId ? String(user.tenantId) : '',
    },
    timeout: 180000,
    validateStatus: () => true,
  })
  const result = resp.data
  if (resp.status < 200 || resp.status >= 300) throw new Error(uploadErrorMessage(result, `AI 图片生成失败(${resp.status})`))
  if (result && result.code === 0) return result.data as UploadResult
  throw new Error(uploadErrorMessage(result, 'AI 图片生成失败'))
}

function uploadErrorMessage(body: any, fallback: string) {
  const message = body?.message || body?.detail || body?.error
  if (!message) return fallback
  if (typeof message === 'string') return message
  try {
    return JSON.stringify(message)
  } catch {
    return fallback
  }
}
