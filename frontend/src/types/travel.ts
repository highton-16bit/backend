export interface Travel {
  id: string
  title: string
  startDate: string
  endDate: string
  regionName: string | null
  isPublic: boolean
}

export interface TravelPlanItem {
  id: string
  date: string
  startTime: string | null
  endTime: string | null
  memo: string | null
}

export interface TravelPhoto {
  id: string
  imageUrl: string
  isSnapshot: boolean
  latitude?: number
  longitude?: number
  capturedAt?: string
}

export interface CreateTravelRequest {
  title: string
  startDate: string
  endDate: string
  regionName?: string
  isPublic?: boolean
}

export interface CreatePlanItemRequest {
  date: string
  startTime?: string
  endTime?: string
  memo?: string
  orderIndex?: number
}

export interface UpdateTravelRequest {
  title?: string
  startDate?: string
  endDate?: string
  regionName?: string
  isPublic?: boolean
}
