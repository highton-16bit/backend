import { apiClient } from './api'
import type { AISearchResponse } from '../types'

export interface CloneResult {
  planItems: Array<{
    date: string
    startTime?: string
    endTime?: string
    memo: string
  }>
}

export const searchService = {
  // AI 자연어 검색
  aiSearch: async (query: string): Promise<AISearchResponse> => {
    const response = await apiClient.get<AISearchResponse>('/search/ai', {
      params: { q: query },
    })
    return response.data
  },

  // 스마트 클로닝 (게시글 요약 -> JSON 일정)
  clone: async (postId: string): Promise<CloneResult> => {
    const response = await apiClient.post<CloneResult>(`/search/clone/${postId}`)
    return response.data
  },
}
