import router from '@/router'
import { useUserStore } from '@/stores/user'
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

export interface ApiResult<T = any> {
  code: number
  message: string
  data: T
}

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

request.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const user = useUserStore()
  if (user.token) {
    cfg.headers.set('Authorization', `Bearer ${user.token}`)
  }
  if (user.tenantId) {
    cfg.headers.set('X-Tenant-ID', String(user.tenantId))
  }
  return cfg
})

request.interceptors.response.use(
  (resp: AxiosResponse<ApiResult>) => {
    const body = resp.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) return body.data as any
      ElMessage.error(body.message || `业务错误 ${body.code}`)
      return Promise.reject(body)
    }
    return body as any
  },
  (err: AxiosError<ApiResult>) => {
    const status = err.response?.status
    const msg = err.response?.data?.message || err.message || '网络错误'
    if (status === 401) {
      const user = useUserStore()
      user.logout()
      router.replace('/login')
    }
    ElMessage.error(msg)
    return Promise.reject(err)
  },
)

export default request
