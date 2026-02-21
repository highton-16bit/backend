import { apiClient } from './api'

export interface UploadPhotoResponse {
  id: string
  url: string
  latitude: number | null
  longitude: number | null
  capturedAt: string | null
}

export const photoService = {
  /**
   * 사진 업로드 + DB 저장 (2단계 자동 처리)
   * 1. S3 업로드 → URL 반환
   * 2. 여행에 사진 등록 (메타데이터 추출)
   */
  upload: async (
    file: File,
    travelId: string,
    isSnapshot: boolean = false
  ): Promise<UploadPhotoResponse> => {
    // Step 1: S3 업로드
    const formData = new FormData()
    formData.append('file', file)

    const s3Response = await apiClient.post<{ url: string }>('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    const imageUrl = s3Response.data.url

    // Step 2: 여행에 사진 등록 (백엔드에서 메타데이터 추출)
    const registerResponse = await apiClient.post<{ id: string }>(`/travels/${travelId}/photos`, {
      imageUrl,
      isSnapshot,
    })

    return {
      id: registerResponse.data.id,
      url: imageUrl,
      latitude: null,
      longitude: null,
      capturedAt: null,
    }
  },

  // 사진 삭제
  delete: async (travelId: string, photoId: string): Promise<void> => {
    await apiClient.delete(`/travels/${travelId}/photos/${photoId}`)
  },
}
