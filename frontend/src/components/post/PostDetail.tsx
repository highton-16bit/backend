import { useState } from 'react'
import { Heart, Bookmark, Share2, PlusSquare, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
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

export default function PostDetail({
  post,
  isOpen,
  onClose,
  onLike,
  onBookmark,
  onClone,
}: PostDetailProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  if (!post) return null

  const photos = post.photos || []
  const hasMultiplePhotos = photos.length > 1

  const nextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    }
  }

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Photo Slider */}
        <div className="relative aspect-square bg-slate-100">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[currentPhotoIndex].url}
                alt={post.title}
                className="w-full h-full object-cover"
              />

              {/* Photo Navigation */}
              {hasMultiplePhotos && (
                <>
                  {currentPhotoIndex > 0 && (
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  {currentPhotoIndex < photos.length - 1 && (
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}

                  {/* Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              No Image
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
                <Heart size={24} className="text-slate-700" />
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
              <Bookmark size={24} className="text-slate-700" />
            </button>
          </div>

          {/* Title & Author */}
          <div>
            <h3 className="font-black text-xl text-slate-900">{post.title}</h3>
            <p className="text-blue-600 text-xs font-black uppercase tracking-widest mt-1">
              by {post.username || 'Plog User'}
            </p>
          </div>

          {/* AI Summary */}
          {post.contentSummary && (
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
                AI Summary
              </p>
              <p className="text-slate-700 text-sm leading-relaxed font-medium">
                {post.contentSummary}
              </p>
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
