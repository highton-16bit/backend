import { useState, useRef } from 'react'
import { Heart, Bookmark, Share2, PlusSquare, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import type { Post } from '../../types'
import Modal from '../common/Modal'

interface PostDetailProps {
  post: Post | null
  isOpen: boolean
  onClose: () => void
  onLike?: () => void
  onBookmark?: () => void
  onClone?: () => void
}

const MAX_CONTENT_LENGTH = 150

export default function PostDetail({
  post,
  isOpen,
  onClose,
  onLike,
  onBookmark,
  onClone,
}: PostDetailProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  if (!post) return null

  const photos = post.photos || []
  const hasMultiplePhotos = photos.length > 1

  // 스크롤 시 현재 이미지 인덱스 업데이트
  const handleScroll = () => {
    if (!carouselRef.current) return
    const scrollLeft = carouselRef.current.scrollLeft
    const width = carouselRef.current.offsetWidth
    const index = Math.round(scrollLeft / width)
    setCurrentPhotoIndex(index)
  }

  // 설명 접기/펼치기
  const contentSummary = post.contentSummary || ''
  const shouldTruncate = contentSummary.length > MAX_CONTENT_LENGTH
  const displayContent = shouldTruncate && !isExpanded
    ? contentSummary.slice(0, MAX_CONTENT_LENGTH) + '...'
    : contentSummary

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Photo Carousel - Swipeable */}
        <div className="relative aspect-square bg-slate-100 overflow-hidden">
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide flex"
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
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                No Image
              </div>
            )}
          </div>

          {/* Indicator Dots */}
          {hasMultiplePhotos && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentPhotoIndex
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
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-5 items-center">
              <button
                onClick={onLike}
                className="flex items-center gap-1.5 hover:scale-110 transition-transform"
              >
                <Heart
                  size={24}
                  className={post.isLiked ? 'text-red-500 fill-red-500' : 'text-slate-700'}
                />
                <span className="text-xs font-black">{post.likeCount}</span>
              </button>
              <button
                onClick={onClone}
                className="flex items-center gap-1.5 hover:scale-110 transition-transform"
              >
                <Copy size={22} className="text-slate-700" />
                <span className="text-xs font-black">{post.cloneCount}</span>
              </button>
              <Share2 size={22} className="text-slate-700 cursor-pointer hover:scale-110 transition-transform" />
            </div>
            <button onClick={onBookmark} className="hover:scale-110 transition-transform">
              <Bookmark
                size={24}
                className={post.isBookmarked ? 'text-blue-600 fill-blue-600' : 'text-slate-700'}
              />
            </button>
          </div>

          {/* Title & Author */}
          <div>
            <h3 className="font-black text-xl text-slate-900">{post.title}</h3>
            <p className="text-blue-600 text-xs font-black uppercase tracking-widest mt-1">
              by {post.username || 'Plog User'}
            </p>
          </div>

          {/* Content */}
          {contentSummary && (
            <div className="bg-slate-50 p-5 rounded-2xl">
              <p className="text-slate-700 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                {displayContent}
              </p>
              {shouldTruncate && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 mt-2 text-blue-600 text-xs font-bold"
                >
                  {isExpanded ? (
                    <>접기 <ChevronUp size={14} /></>
                  ) : (
                    <>자세히 보기 <ChevronDown size={14} /></>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Clone Button */}
          <button
            onClick={onClone}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:shadow-xl transition-shadow"
          >
            <PlusSquare size={18} />
            Clone this Journey
          </button>
        </div>
      </div>
    </Modal>
  )
}
