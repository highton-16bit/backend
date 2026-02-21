export interface Post {
  id: string
  title: string
  contentSummary: string | null
  likeCount: number
  cloneCount: number
  username?: string
  photos?: PostPhoto[]
  createdAt: string
  isLiked: boolean
  isBookmarked: boolean
}

export interface PostPhoto {
  id: string
  url: string
}

export interface CreatePostRequest {
  travelId: string
  title: string
  photoIds: string[]
}

export interface UpdatePostRequest {
  title?: string
  contentSummary?: string
  photoIds?: string[]
}

export interface AISearchResponse {
  answer: string
  related_posts: Array<{
    id: string
    title: string
    summary: string | null
  }>
}

export interface MapPin {
  postId: string
  title: string
  latitude: number
  longitude: number
  photoUrl?: string
}

export interface SearchPostItem {
  id: string
  title: string
  summary?: string
  regionName?: string
  latitude?: number
  longitude?: number
  likeCount: number
  photoUrl?: string
}

export interface RegionSearchResponse {
  query: string
  regionName?: string
  posts: SearchPostItem[]
  mapPins: MapPin[]
}
