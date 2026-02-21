import { useState, useEffect, useCallback, useRef } from 'react'
import { Header, BottomNav, type Tab } from './components/layout'
import { LoginPage, HomePage, DiscoveryPage, NewPage, TravelsPage, ProfilePage } from './pages'
import { travelService, postService, authService } from './services'
import type { Travel, Post } from './types'

export default function App() {
  const [user, setUser] = useState<string | null>(authService.getCurrentUser())
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const loadedTabsRef = useRef<Set<Tab>>(new Set())

  // Data States
  const [activeTravel, setActiveTravel] = useState<Travel | null>(null)
  const [feed, setFeed] = useState<Post[]>([])
  const [discoveryPosts, setDiscoveryPosts] = useState<Post[]>([])
  const [myTravels, setMyTravels] = useState<Travel[]>([])

  const loadTabData = useCallback(async (tab: Tab, isInitial: boolean) => {
    if (isInitial) setIsInitialLoading(true)

    try {
      if (tab === 'home') {
        const [travel, posts] = await Promise.all([
          travelService.getActive(),
          postService.getFeed(),
        ])
        setActiveTravel(travel)
        setFeed(posts)
      } else if (tab === 'discovery') {
        const posts = await postService.getFeed()
        setDiscoveryPosts(posts)
      } else if (tab === 'travels' || tab === 'new') {
        const travels = await travelService.getAll()
        setMyTravels(travels)
      }
      loadedTabsRef.current.add(tab)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      if (isInitial) setIsInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      const isInitial = !loadedTabsRef.current.has(activeTab)
      loadTabData(activeTab, isInitial)
    }
  }, [user, activeTab, loadTabData])

  // Background refresh without loading overlay
  const refreshData = useCallback(async () => {
    await loadTabData(activeTab, false)
  }, [activeTab, loadTabData])

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

  const isTabLoading = isInitialLoading && !loadedTabsRef.current.has(activeTab)

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl relative overflow-hidden font-sans text-slate-900">
      <Header isLoading={false} />

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide relative">
        {activeTab === 'home' && (
          <HomePage
            activeTravel={activeTravel}
            feed={feed}
            setFeed={setFeed}
            onRefresh={refreshData}
            isLoading={isTabLoading}
          />
        )}
        {activeTab === 'discovery' && (
          <DiscoveryPage
            posts={discoveryPosts}
            setPosts={setDiscoveryPosts}
            onRefresh={refreshData}
            isLoading={isTabLoading}
          />
        )}
        {activeTab === 'new' && (
          <NewPage myTravels={myTravels} onComplete={() => setActiveTab('home')} />
        )}
        {activeTab === 'travels' && (
          <TravelsPage travels={myTravels} onRefresh={refreshData} isLoading={isTabLoading} />
        )}
        {activeTab === 'profile' && (
          <ProfilePage username={user} onLogout={handleLogout} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
