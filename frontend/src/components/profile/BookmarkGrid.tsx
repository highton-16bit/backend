import type { Post } from '../../types'

interface BookmarkGridProps {
  bookmarks: Post[]
  onPostClick?: (post: Post) => void
}

export default function BookmarkGrid({ bookmarks, onPostClick }: BookmarkGridProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 font-bold text-sm">No bookmarks yet</p>
        <p className="text-slate-300 text-xs mt-1">Save posts you love!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {bookmarks.map((post) => (
        <div
          key={post.id}
          onClick={() => onPostClick?.(post)}
          className="aspect-[4/5] bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:scale-[1.02] transition-transform"
        >
          {post.photos?.[0] ? (
            <img
              src={post.photos[0].url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-sm">
              {post.title}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
