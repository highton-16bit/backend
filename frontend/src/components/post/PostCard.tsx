import { useState, useRef } from 'react'
import { Heart, PlusSquare, Share2, Bookmark, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import type { Post } from '../../types'

interface PostCardProps {
  post: Post
  onLike?: () => void
  onBookmark?: () => void
  onShare?: () => void
  onClone?: () => void
}

const MAX_CONTENT_LENGTH = 100 // 접히는 기준 글자 수

export default function PostCard({ post, onLike, onBookmark, onShare, onClone }: PostCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const photos = post.photos || []
  const hasMultiplePhotos = photos.length > 1

  // 스크롤 시 현재 이미지 인덱스 업데이트
  const handleScroll = () => {
    if (!carouselRef.current) return
    const scrollLeft = carouselRef.current.scrollLeft
    const width = carouselRef.current.offsetWidth
    const index = Math.round(scrollLeft / width)
    setCurrentImageIndex(index)
  }

  // 설명 접기/펼치기
  const contentSummary = post.contentSummary || ''
  const shouldTruncate = contentSummary.length > MAX_CONTENT_LENGTH
  const displayContent = shouldTruncate && !isExpanded
    ? contentSummary.slice(0, MAX_CONTENT_LENGTH) + '...'
    : contentSummary

  return (
    <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-50 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-blue-600 border border-blue-50">
            {post.username?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800">{post.username || 'Plog User'}</p>
            <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Explorer</p>
          </div>
        </div>
        <MoreHorizontal className="text-slate-400 cursor-pointer" size={18} />
      </div>

      {/* Image Carousel */}
      <div className="relative">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="aspect-[4/5] bg-slate-50 rounded-[2rem] overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide flex"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {photos.length > 0 ? (
            photos.map((photo, index) => (
              <div
                key={photo.id}
                className="w-full h-full flex-shrink-0 snap-center"
              >
                <img
                  src={photo.url}
                  alt={`${post.title} ${index + 1}`}
                  className="w-full h-full object-cover rounded-[2rem]"
                  draggable={false}
                />
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">
              No Image
            </div>
          )}
        </div>

        {/* Image Indicator Dots */}
        {hasMultiplePhotos && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentImageIndex
                    ? 'bg-white w-3'
                    : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Image Counter */}
        {hasMultiplePhotos && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            {currentImageIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Actions & Content */}
      <div className="px-2 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-5 items-center">
            <button
              onClick={onLike}
              className="flex items-center gap-1.5 hover:scale-110 transition-transform"
            >
              <Heart
                size={22}
                className={post.isLiked ? 'text-red-500 fill-red-500' : 'text-slate-700'}
              />
              <span className="text-[10px] font-black">{post.likeCount}</span>
            </button>
            <button
              onClick={onClone}
              className="flex items-center gap-1.5 hover:scale-110 transition-transform"
            >
              <PlusSquare size={22} className="text-slate-700" />
              <span className="text-[10px] font-black">{post.cloneCount}</span>
            </button>
            <button onClick={onShare} className="hover:scale-110 transition-transform">
              <Share2 size={20} className="text-slate-700" />
            </button>
          </div>
          <button onClick={onBookmark} className="hover:scale-110 transition-transform">
            <Bookmark
              size={22}
              className={post.isBookmarked ? 'text-blue-600 fill-blue-600' : 'text-slate-700'}
            />
          </button>
        </div>

        <h4 className="font-black text-lg text-slate-900 leading-tight">{post.title}</h4>

        {contentSummary && (
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-slate-600 text-[11px] leading-relaxed font-medium whitespace-pre-wrap">
              {displayContent}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 mt-2 text-blue-600 text-[10px] font-bold"
              >
                {isExpanded ? (
                  <>접기 <ChevronUp size={12} /></>
                ) : (
                  <>자세히 보기 <ChevronDown size={12} /></>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
