import { MapPin } from 'lucide-react'
import type { Travel, Post } from '../types'
import { PostCard } from '../components/post'
import { ActiveTravelSkeleton, FeedSkeleton } from '../components/common'
import { postService } from '../services'
import { getErrorMessage } from '../services/api'

interface HomePageProps {
  activeTravel: Travel | null
  feed: Post[]
  setFeed: React.Dispatch<React.SetStateAction<Post[]>>
  onRefresh: () => void
  isLoading?: boolean
}

export default function HomePage({ activeTravel, feed, setFeed, onRefresh, isLoading }: HomePageProps) {
  // Optimistic UI Update for Like
  const handleLike = async (postId: string) => {
    const post = feed.find(p => p.id === postId)
    if (!post) return

    // Optimistic update
    setFeed(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1
        }
      }
      return p
    }))

    try {
      await postService.toggleLike(postId)
    } catch (error) {
      // Rollback on error
      setFeed(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: post.isLiked,
            likeCount: post.likeCount
          }
        }
        return p
      }))
      alert(getErrorMessage(error))
    }
  }

  // Optimistic UI Update for Bookmark
  const handleBookmark = async (postId: string) => {
    const post = feed.find(p => p.id === postId)
    if (!post) return

    // Optimistic update
    setFeed(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, isBookmarked: !p.isBookmarked }
      }
      return p
    }))

    try {
      await postService.toggleBookmark(postId)
    } catch (error) {
      // Rollback on error
      setFeed(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, isBookmarked: post.isBookmarked }
        }
        return p
      }))
      alert(getErrorMessage(error))
    }
  }

  // Show skeleton during initial loading
  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-300">
        <section className="p-6">
          <ActiveTravelSkeleton />
        </section>
        <section className="px-6 pb-10 space-y-10">
          <div className="flex justify-between items-center px-1">
            <div className="w-32 h-8 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-16 h-6 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <FeedSkeleton />
        </section>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Active Travel Card */}
      <section className="p-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
                Active Now
              </span>
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">
              {activeTravel?.title || '여행을 떠나보세요'}
            </h2>
            <div className="flex items-center gap-2 text-blue-100/90 font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              <MapPin size={14} />
              <span className="text-xs">
                {activeTravel?.regionName || '나만의 기록을 시작할 시간'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="px-6 pb-10 space-y-10">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-2xl font-black tracking-tighter">Moments</h3>
          <button
            onClick={onRefresh}
            className="text-blue-600 font-black text-[10px] uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full"
          >
            Refresh
          </button>
        </div>

        {feed.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 font-bold">아직 게시글이 없습니다</p>
            <p className="text-slate-300 text-sm mt-1">첫 여행을 공유해보세요!</p>
          </div>
        ) : (
          feed.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => handleLike(post.id)}
              onBookmark={() => handleBookmark(post.id)}
            />
          ))
        )}
      </section>
    </div>
  )
}
