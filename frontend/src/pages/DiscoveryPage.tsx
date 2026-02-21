import { useState } from 'react'
import { Search, Send, Loader2, User } from 'lucide-react'
import type { Post, AISearchResponse } from '../types'
import { PostGrid, PostDetail } from '../components/post'
import { searchService, postService } from '../services'
import { getErrorMessage } from '../services/api'

interface DiscoveryPageProps {
  posts: Post[]
  onRefresh: () => void
}

export default function DiscoveryPage({ posts, onRefresh }: DiscoveryPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [aiResponse, setAiResponse] = useState<AISearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await searchService.aiSearch(searchQuery)
      setAiResponse(response)
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setIsSearching(false)
    }
  }

  const handlePostClick = (post: Post) => {
    setSelectedPost(post)
    setIsDetailOpen(true)
  }

  const handleLike = async () => {
    if (!selectedPost) return
    try {
      await postService.toggleLike(selectedPost.id)
      onRefresh()
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const handleBookmark = async () => {
    if (!selectedPost) return
    try {
      await postService.toggleBookmark(selectedPost.id)
      onRefresh()
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const handleClone = async () => {
    if (!selectedPost) return
    try {
      const result = await searchService.clone(selectedPost.id)
      alert(`일정이 클론되었습니다!\n\n${JSON.stringify(result.planItems, null, 2)}`)
      onRefresh()
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-4 duration-500">
      {/* Search */}
      <div className="space-y-4">
        <h2 className="text-3xl font-black italic tracking-tighter">Explore</h2>
        <div className="relative">
          <input
            className="w-full p-5 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all pl-12 font-bold text-sm outline-none"
            placeholder="제주도 감성 숙소 추천해줘"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2.5 rounded-xl shadow-lg active:scale-90 transition-transform disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>

      {/* AI Response */}
      {aiResponse && (
        <div className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-100 space-y-3 animate-in zoom-in-95">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 rounded-lg">
              <User size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              Plog AI Discovery
            </span>
          </div>
          <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">
            "{aiResponse.answer}"
          </p>
        </div>
      )}

      {/* Post Grid */}
      <PostGrid posts={posts} onPostClick={handlePostClick} />

      {/* Post Detail Modal */}
      <PostDetail
        post={selectedPost}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onLike={handleLike}
        onBookmark={handleBookmark}
        onClone={handleClone}
      />
    </div>
  )
}
