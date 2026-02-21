import { apiClient } from './api'
import type { Post, CreatePostRequest } from '../types'

interface PostListResponse {
  posts: Post[]
}

export const postService = {
  // 피드 조회 (전체 공개 게시글)
  getFeed: async (): Promise<Post[]> => {
    const response = await apiClient.get<PostListResponse>('/posts')
    return response.data.posts
  },

  // 게시글 상세 조회
  getById: async (id: string): Promise<Post> => {
    const response = await apiClient.get<Post>(`/posts/${id}`)
    return response.data
  },

  // 게시글 생성 (AI 요약 자동 생성)
  create: async (data: CreatePostRequest): Promise<{ id: string; summary: string }> => {
    const response = await apiClient.post<{ id: string; summary: string }>('/posts', data)
    return response.data
  },

  // 좋아요 토글
  toggleLike: async (id: string): Promise<void> => {
    await apiClient.post(`/posts/${id}/like`)
  },

  // 북마크 토글
  toggleBookmark: async (id: string): Promise<void> => {
    await apiClient.post(`/posts/${id}/bookmark`)
  },

  // 북마크한 게시글 목록
  getBookmarks: async (): Promise<Post[]> => {
    const response = await apiClient.get<PostListResponse>('/posts/bookmarks')
    return response.data.posts
  },
}
