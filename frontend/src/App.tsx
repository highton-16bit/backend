import { useState, useEffect } from 'react'
import { Header, BottomNav, type Tab } from './components/layout'
import { LoginPage, HomePage, DiscoveryPage, NewPage, TravelsPage, ProfilePage } from './pages'
import { travelService, postService, authService } from './services'
import type { Travel, Post } from './types'

export default function App() {
  const [user, setUser] = useState<string | null>(authService.getCurrentUser())
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [isLoading, setIsLoading] = useState(false)

  // Data States
  const [activeTravel, setActiveTravel] = useState<Travel | null>(null)
  const [feed, setFeed] = useState<Post[]>([])
  const [discoveryPosts, setDiscoveryPosts] = useState<Post[]>([])
  const [myTravels, setMyTravels] = useState<Travel[]>([])

  useEffect(() => {
    if (user) {
      refreshData()
    }
  }, [user, activeTab])

  const refreshData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'home') {
        const [travel, posts] = await Promise.all([
          travelService.getActive(),
          postService.getFeed(),
        ])
        setActiveTravel(travel)
        setFeed(posts)
      } else if (activeTab === 'discovery') {
        const posts = await postService.getFeed()
        setDiscoveryPosts(posts)
      } else if (activeTab === 'travels' || activeTab === 'new') {
        const travels = await travelService.getAll()
        setMyTravels(travels)
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (username: string) => {
    setUser(username)
  }

  const handleLogout = () => {
    authService.logout()
    setUser(null)
    window.location.reload()
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl relative overflow-hidden font-sans text-slate-900">
      <Header isLoading={isLoading} />

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {activeTab === 'home' && (
          <HomePage activeTravel={activeTravel} feed={feed} onRefresh={refreshData} />
        )}
        {activeTab === 'discovery' && (
          <DiscoveryPage posts={discoveryPosts} onRefresh={refreshData} />
        )}
        {activeTab === 'new' && (
          <NewPage myTravels={myTravels} onComplete={() => setActiveTab('home')} />
        )}
        {activeTab === 'travels' && (
          <TravelsPage travels={myTravels} onRefresh={refreshData} />
        )}
        {activeTab === 'profile' && (
          <ProfilePage username={user} onLogout={handleLogout} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
