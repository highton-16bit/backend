import { useState, useEffect } from 'react'
import type { Post, UserStats } from '../types'
import { ProfileHeader, ProfileStats, BookmarkGrid } from '../components/profile'
import { PostDetail } from '../components/post'
import { postService, searchService } from '../services'
import { getErrorMessage } from '../services/api'

interface ProfilePageProps {
  username: string
  onLogout: () => void
}

export default function ProfilePage({ username, onLogout }: ProfilePageProps) {
  const [bookmarks, setBookmarks] = useState<Post[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoadingStats(true)
    try {
      // Load bookmarks
      const bookmarksData = await postService.getBookmarks()
      setBookmarks(bookmarksData)

      // TODO: Load stats from API when available
      // const statsData = await userService.getStats()
      // For now, calculate from available data
      setStats({
        travelCount: 0, // Will be updated when API is available
        snapshotCount: 0,
        bookmarkCount: bookmarksData.length,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingStats(false)
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
      loadData()
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const handleBookmark = async () => {
    if (!selectedPost) return
    try {
      await postService.toggleBookmark(selectedPost.id)
      loadData()
      setIsDetailOpen(false)
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const handleClone = async () => {
    if (!selectedPost) return
    try {
      const result = await searchService.clone(selectedPost.id)
      alert(`일정이 클론되었습니다!\n\n${JSON.stringify(result.planItems, null, 2)}`)
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      onLogout()
    }
  }

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500">
      <ProfileHeader username={username} />

      <ProfileStats stats={stats} isLoading={isLoadingStats} />

      <div className="space-y-6">
        <h3 className="text-xl font-black tracking-tighter px-1">Bookmarked</h3>
        <BookmarkGrid bookmarks={bookmarks} onPostClick={handlePostClick} />
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-5 rounded-2xl bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-colors"
      >
        Logout Account
      </button>

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
