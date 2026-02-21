import { apiClient } from './api'

export interface UploadPhotoResponse {
  id: string
  url: string
  latitude: number | null
  longitude: number | null
  capturedAt: string | null
}

export const photoService = {
  // 사진 업로드 (멀티파트)
  upload: async (
    file: File,
    travelId: string,
    isSnapshot: boolean = false
  ): Promise<UploadPhotoResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('travelId', travelId)
    formData.append('isSnapshot', String(isSnapshot))

    const response = await apiClient.post<UploadPhotoResponse>('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // 사진 메타데이터 직접 등록 (URL 기반)
  register: async (
    travelId: string,
    data: {
      imageUrl: string
      isSnapshot?: boolean
      latitude?: number
      longitude?: number
      capturedAt?: string
    }
  ): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>(`/travels/${travelId}/photos`, data)
    return response.data
  },

  // 사진 삭제
  delete: async (travelId: string, photoId: string): Promise<void> => {
    await apiClient.delete(`/travels/${travelId}/photos/${photoId}`)
  },
}
