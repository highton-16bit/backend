import { apiClient } from './api'
import type { RegionSearchResponse } from '../types'

export interface CloneResult {
  planItems: Array<{
    date: string
    startTime?: string
    endTime?: string
    memo: string
  }>
}

export const searchService = {
  // 지역 기반 검색 (최대 10개, 첫 번째 사진 좌표 기준)
  searchByRegion: async (query: string): Promise<RegionSearchResponse> => {
    const response = await apiClient.get<RegionSearchResponse>('/search', {
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
