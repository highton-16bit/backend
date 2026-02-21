import { useState } from 'react'
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk'
import { Search, Send, Loader2, MapPin, X } from 'lucide-react'
import type { MapPin as MapPinType, SearchPostItem, Post } from '../types'
import { PostDetail } from '../components/post'
import { Skeleton } from '../components/common'
import { searchService } from '../services'
import { getErrorMessage } from '../services/api'

interface DiscoveryPageProps {
  posts: Post[]
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>
  onRefresh: () => void
  isLoading?: boolean
}

// 서울 시청 기본 좌표
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

export default function DiscoveryPage({ isLoading: _isLoading }: DiscoveryPageProps) {
  const [loading] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_KEY || '',
    libraries: ['services'],
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [mapPins, setMapPins] = useState<MapPinType[]>([])
  const [searchResults, setSearchResults] = useState<SearchPostItem[]>([])
  const [selectedPin, setSelectedPin] = useState<MapPinType | null>(null)
  const [selectedPost, setSelectedPost] = useState<SearchPostItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)

  // 검색 실행
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSelectedPin(null)

    try {
      const response = await searchService.searchByRegion(searchQuery)
      setMapPins(response.mapPins)
      setSearchResults(response.posts)

      // 첫 번째 결과로 지도 중심 이동
      if (response.mapPins.length > 0) {
        const firstPin = response.mapPins[0]
        setMapCenter({ lat: firstPin.latitude, lng: firstPin.longitude })
      }
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setIsSearching(false)
    }
  }

  // 마커 클릭
  const handleMarkerClick = (pin: MapPinType) => {
    setSelectedPin(pin)
    setMapCenter({ lat: pin.latitude, lng: pin.longitude })
  }

  // 결과 카드 클릭 -> PostDetail 열기
  const handleResultClick = (post: SearchPostItem) => {
    setSelectedPost(post)
    setIsDetailOpen(true)
    if (post.latitude && post.longitude) {
      setMapCenter({ lat: post.latitude, lng: post.longitude })
    }
  }

  // PostDetail용 Post 객체 변환
  const getPostForDetail = () => {
    if (!selectedPost) return null
    return {
      id: selectedPost.id,
      title: selectedPost.title,
      contentSummary: selectedPost.summary || null,
      likeCount: selectedPost.likeCount,
      cloneCount: 0,
      username: undefined,
      photos: selectedPost.photoUrl
        ? [{ id: '1', url: selectedPost.photoUrl }]
        : [],
      createdAt: '',
      isLiked: false,
      isBookmarked: false,
    }
  }

  const handleClone = async () => {
    if (!selectedPost) return
    try {
      const result = await searchService.clone(selectedPost.id)
      alert(`일정이 클론되었습니다! (${result.planItems.length}개 일정)`)
      setIsDetailOpen(false)
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col p-6 space-y-4">
        <Skeleton className="w-full h-14 rounded-2xl" />
        <Skeleton className="flex-1 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="relative">
          <input
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm pl-12 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="전주, 부산 광안리..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2.5 rounded-xl shadow-lg active:scale-90 transition-transform disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          center={mapCenter}
          style={{ width: '100%', height: '100%' }}
          level={7}
        >
          {mapPins.map((pin) => (
            <MapMarker
              key={pin.postId}
              position={{ lat: pin.latitude, lng: pin.longitude }}
              onClick={() => handleMarkerClick(pin)}
            />
          ))}
        </Map>

        {/* Selected Pin Info */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl p-4 animate-in slide-in-from-bottom-4">
            <button
              onClick={() => setSelectedPin(null)}
              className="absolute top-2 right-2 p-1 hover:bg-slate-100 rounded-full"
            >
              <X size={16} className="text-slate-400" />
            </button>
            <div
              className="flex gap-3 cursor-pointer"
              onClick={() => {
                const post = searchResults.find(p => p.id === selectedPin.postId)
                if (post) handleResultClick(post)
              }}
            >
              {selectedPin.photoUrl && (
                <img
                  src={selectedPin.photoUrl}
                  alt={selectedPin.title}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-slate-900 truncate">
                  {selectedPin.title}
                </p>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">
                  탭하여 자세히 보기
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {searchQuery && !isSearching && mapPins.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="text-center p-6">
              <MapPin size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-500">검색 결과가 없습니다</p>
              <p className="text-sm text-slate-400 mt-1">다른 지역을 검색해보세요</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && mapPins.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-6 bg-white/90 rounded-3xl shadow-lg">
              <Search size={32} className="text-blue-600 mx-auto mb-3" />
              <p className="font-black text-slate-700">지역을 검색해보세요</p>
              <p className="text-xs text-slate-400 mt-1">예: 전주, 부산 광안리, 제주도</p>
            </div>
          </div>
        )}
      </div>

      {/* Results List (Bottom Sheet) */}
      {searchResults.length > 0 && (
        <div className="bg-white border-t border-gray-100 max-h-[30vh] overflow-y-auto">
          <div className="p-3">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 mb-2">
              검색 결과 ({searchResults.length}개)
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {searchResults.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handleResultClick(post)}
                  className="flex-shrink-0 w-32 cursor-pointer group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                    {post.photoUrl ? (
                      <img
                        src={post.photoUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <MapPin size={24} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate px-1">
                    {post.title}
                  </p>
                  {post.regionName && (
                    <p className="text-[10px] text-slate-400 truncate px-1">
                      {post.regionName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      <PostDetail
        post={getPostForDetail()}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onClone={handleClone}
      />
    </div>
  )
}
