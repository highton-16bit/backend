import axios, { AxiosError } from 'axios'
import { API_URL, STORAGE_KEYS } from '../config/env'

// 독립적인 axios 인스턴스 생성 (전역 오염 방지)
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request 인터셉터: Authorization 헤더 자동 주입
apiClient.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem(STORAGE_KEYS.USER)
    if (user) {
      config.headers.Authorization = user
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response 인터셉터: 에러 핸들링
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as { message?: string }

      switch (status) {
        case 401:
          console.error('[API] Unauthorized - Please login again')
          break
        case 400:
          console.error('[API] Bad Request:', data?.message || 'Invalid request')
          break
        case 404:
          console.error('[API] Not Found')
          break
        case 500:
          console.error('[API] Server Error')
          break
        default:
          console.error('[API] Error:', data?.message || error.message)
      }
    } else if (error.request) {
      console.error('[API] Network Error - No response received')
    } else {
      console.error('[API] Request Error:', error.message)
    }

    return Promise.reject(error)
  }
)

// 에러 메시지 추출 헬퍼
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string }
    return data?.message || error.message || '요청에 실패했습니다'
  }
  if (error instanceof Error) {
    return error.message
  }
  return '알 수 없는 오류가 발생했습니다'
}
