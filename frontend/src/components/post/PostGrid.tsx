import type { Post } from '../../types'

interface PostGridProps {
  posts: Post[]
  onPostClick?: (post: Post) => void
}

export default function PostGrid({ posts, onPostClick }: PostGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {posts.map((post) => (
        <div
          key={post.id}
          onClick={() => onPostClick?.(post)}
          className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
        >
          {post.photos?.[0] ? (
            <img
              src={post.photos[0].url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <span className="text-slate-300 text-xs">{post.title.charAt(0)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
