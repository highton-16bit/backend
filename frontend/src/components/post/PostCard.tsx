import { Heart, PlusSquare, Share2, Bookmark, MoreHorizontal } from 'lucide-react'
import type { Post } from '../../types'

interface PostCardProps {
  post: Post
  onLike?: () => void
  onBookmark?: () => void
  onShare?: () => void
  onClone?: () => void
}

export default function PostCard({ post, onLike, onBookmark, onShare, onClone }: PostCardProps) {
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

      {/* Image */}
      <div className="aspect-[4/5] bg-slate-50 rounded-[2rem] overflow-hidden">
        {post.photos?.[0] ? (
          <img
            src={post.photos[0].url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">
            No Image
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
              <Heart size={22} className="text-slate-700" />
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
            <Bookmark size={22} className="text-slate-700" />
          </button>
        </div>

        <h4 className="font-black text-lg text-slate-900 leading-tight">{post.title}</h4>

        {post.contentSummary && (
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-slate-600 text-[11px] leading-relaxed font-medium italic">
              "{post.contentSummary}"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
