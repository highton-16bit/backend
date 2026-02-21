import { apiClient } from './api'
import type {
  Travel,
  TravelPlanItem,
  TravelPhoto,
  CreateTravelRequest,
  CreatePlanItemRequest,
  UpdateTravelRequest,
} from '../types'

export const travelService = {
  // 여행 목록 조회
  getAll: async (): Promise<Travel[]> => {
    const response = await apiClient.get<Travel[]>('/travels')
    return response.data
  },

  // 활성 여행 조회 (현재 진행 중)
  getActive: async (): Promise<Travel | null> => {
    try {
      const response = await apiClient.get<Travel>('/travels/active')
      return response.data
    } catch {
      return null
    }
  },

  // 여행 상세 조회
  getById: async (id: string): Promise<Travel> => {
    const response = await apiClient.get<Travel>(`/travels/${id}`)
    return response.data
  },

  // 여행 생성
  create: async (data: CreateTravelRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>('/travels', data)
    return response.data
  },

  // 여행 삭제
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/travels/${id}`)
  },

  // 여행 수정
  update: async (id: string, data: UpdateTravelRequest): Promise<void> => {
    await apiClient.patch(`/travels/${id}`, data)
  },

  // === 여행 일정 ===

  // 일정 목록 조회
  getPlans: async (travelId: string): Promise<TravelPlanItem[]> => {
    const response = await apiClient.get<TravelPlanItem[]>(`/travels/${travelId}/plans`)
    return response.data
  },

  // 일정 추가
  createPlan: async (travelId: string, data: CreatePlanItemRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>(`/travels/${travelId}/plans`, data)
    return response.data
  },

  // 일정 삭제
  deletePlan: async (travelId: string, planId: string): Promise<void> => {
    await apiClient.delete(`/travels/${travelId}/plans/${planId}`)
  },

  // === 여행 사진 ===

  // 사진 목록 조회
  getPhotos: async (travelId: string): Promise<TravelPhoto[]> => {
    const response = await apiClient.get<TravelPhoto[]>(`/travels/${travelId}/photos`)
    return response.data
  },
}
