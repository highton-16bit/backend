import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Home, Compass, PlusSquare, Image, User, Camera, Heart, Bookmark, MapPin, Calendar, 
  Upload, Loader2, MoreHorizontal, Share2, Search, Send, Clock, ChevronRight, X, Check, Plus
} from 'lucide-react'

// Backend URL
const API_URL = 'https://16bit-api-production.up.railway.app'

// --- Types ---
type Tab = 'home' | 'discovery' | 'new' | 'travels' | 'profile'

export default function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem('plog_user'))
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [isLoading, setIsLoading] = useState(false)
  
  // Data States
  const [activeTravel, setActiveTravel] = useState<any>(null)
  const [feed, setFeed] = useState<any[]>([])
  const [discoveryPosts, setDiscoveryPosts] = useState<any[]>([])
  const [myTravels, setMyTravels] = useState<any[]>([])
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      axios.defaults.headers.common['Authorization'] = user
      refreshData()
    }
  }, [user, activeTab])

  const refreshData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'home') {
        const [at, f] = await Promise.all([
          axios.get(`${API_URL}/travels/active`),
          axios.get(`${API_URL}/posts`)
        ])
        setActiveTravel(at.data)
        setFeed(f.data)
      } else if (activeTab === 'discovery') {
        const res = await axios.get(`${API_URL}/posts`)
        setDiscoveryPosts(res.data)
      } else if (activeTab === 'travels') {
        const res = await axios.get(`${API_URL}/travels`)
        setMyTravels(res.data)
      } else if (activeTab === 'profile') {
        // Bookmarks (실제 API 명세엔 없지만 피드 필터링 등으로 구현 가능)
        const res = await axios.get(`${API_URL}/posts`) 
        setBookmarkedPosts(res.data.slice(0, 2)) // Mocking for now
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return <LoginScreen onLogin={setUser} />

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl relative overflow-hidden font-sans text-slate-900">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white/90 backdrop-blur-xl sticky top-0 z-30 border-b border-gray-100">
        <h1 className="text-2xl font-black text-blue-600 tracking-tighter italic">Plog</h1>
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="animate-spin text-blue-500" size={18} />}
          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
            <User size={16} className="text-blue-600" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {activeTab === 'home' && <HomeTab activeTravel={activeTravel} feed={feed} onRefresh={refreshData} />}
        {activeTab === 'discovery' && <DiscoveryTab posts={discoveryPosts} onRefresh={refreshData} />}
        {activeTab === 'new' && <NewTab myTravels={myTravels} onComplete={() => setActiveTab('home')} />}
        {activeTab === 'travels' && <TravelsTab travels={myTravels} onRefresh={refreshData} />}
        {activeTab === 'profile' && <ProfileTab user={user} bookmarks={bookmarkedPosts} onLogout={() => {localStorage.removeItem('plog_user'); window.location.reload();}} />}
      </main>

      {/* Bottom Nav (5 Tabs per Spec) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-[400px] bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl flex justify-around items-center p-2 z-40 border border-white/10">
        <NavButton icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavButton icon={<Compass />} label="Explore" active={activeTab === 'discovery'} onClick={() => setActiveTab('discovery')} />
        <NavButton icon={<PlusSquare />} label="New" active={activeTab === 'new'} onClick={() => setActiveTab('new')} />
        <NavButton icon={<Image />} label="Travels" active={activeTab === 'travels'} onClick={() => setActiveTab('travels')} />
        <NavButton icon={<User />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </nav>
    </div>
  )
}

// --- Tab Components ---

function HomeTab({ activeTravel, feed, onRefresh }: any) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <section className="p-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Active Now</span>
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">
              {activeTravel?.title || '여행을 떠나보세요'}
            </h2>
            <div className="flex items-center gap-2 text-blue-100/90 font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              <MapPin size={14} /> 
              <span className="text-xs">{activeTravel?.regionName || '나만의 기록을 시작할 시간'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10 space-y-10">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-2xl font-black tracking-tighter">Moments</h3>
          <button onClick={onRefresh} className="text-blue-600 font-black text-[10px] uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">Refresh</button>
        </div>
        
        {feed.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>
    </div>
  )
}

function DiscoveryTab({ posts, onRefresh }: any) {
  const [searchQuery, setSearchQuery] = useState('')
  const [aiResponse, setAiResponse] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery) return
    setIsSearching(true)
    try {
      const res = await axios.get(`${API_URL}/search/ai?q=${encodeURIComponent(searchQuery)}`)
      setAiResponse(res.data)
    } catch (e) { console.error(e) } finally { setIsSearching(false) }
  }

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="space-y-4">
        <h2 className="text-3xl font-black italic tracking-tighter">Explore</h2>
        <div className="relative">
          <input 
            className="w-full p-5 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all pl-12 font-bold text-sm"
            placeholder="제주도 감성 숙소 추천해줘"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2.5 rounded-xl shadow-lg active:scale-90 transition-transform">
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      {aiResponse && (
        <div className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-100 space-y-3 animate-in zoom-in-95">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 rounded-lg"><User size={14} /></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Plog AI Discovery</span>
          </div>
          <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">"{aiResponse.answer || aiResponse.summary}"</p>
          {aiResponse.recommendations && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {aiResponse.recommendations.map((rec: any, i: number) => (
                <div key={i} className="bg-white/10 px-3 py-1 rounded-full text-[10px] whitespace-nowrap border border-white/20">#{rec}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {posts.map((post: any) => (
          <div key={post.id} className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:scale-105 transition-transform active:scale-95">
            {post.photos?.[0] ? <img src={post.photos[0].url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function NewTab({ myTravels, onComplete }: any) {
  const [mode, setMode] = useState<'create_travel' | 'share_post' | null>(null)
  
  // Create Travel State
  const [title, setTitle] = useState('')
  const [region, setRegion] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Share Post State
  const [selectedTravelId, setSelectedTravelId] = useState('')
  const [postTitle, setPostTitle] = useState('')
  const [travelPhotos, setTravelPhotos] = useState<any[]>([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])

  const handleCreateTravel = async () => {
    try {
      await axios.post(`${API_URL}/travels`, { title, regionName: region, startDate, endDate })
      alert("신규 여행이 생성되었습니다! ✨")
      onComplete()
    } catch (e) { alert("생성 실패") }
  }

  const handleTravelSelect = async (id: string) => {
    setSelectedTravelId(id)
    try {
      const res = await axios.get(`${API_URL}/travels/${id}/photos`)
      setTravelPhotos(res.data)
    } catch (e) { console.error(e) }
  }

  const handleSharePost = async () => {
    try {
      await axios.post(`${API_URL}/posts`, { 
        travelId: selectedTravelId, 
        title: postTitle, 
        photoIds: selectedPhotoIds 
      })
      alert("게시글이 공유되었습니다! (AI 일정이 자동 포함됩니다)")
      onComplete()
    } catch (e) { alert("공유 실패") }
  }

  if (mode === 'create_travel') return (
    <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4">
      <button onClick={() => setMode(null)} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"><X size={16}/> Back</button>
      <h2 className="text-3xl font-black italic">Start New Journey</h2>
      <div className="space-y-4">
        <Input label="Title" value={title} onChange={setTitle} placeholder="제주도 힐링 여행" />
        <Input label="Region" value={region} onChange={setRegion} placeholder="제주, 서귀포" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start" value={startDate} onChange={setStartDate} placeholder="2026-02-21" />
          <Input label="End" value={endDate} onChange={setEndDate} placeholder="2026-02-23" />
        </div>
        <button onClick={handleCreateTravel} className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all mt-4">Create Journey</button>
      </div>
    </div>
  )

  if (mode === 'share_post') return (
    <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4">
      <button onClick={() => setMode(null)} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"><X size={16}/> Back</button>
      <h2 className="text-3xl font-black italic">Share Memory</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Select Travel</label>
          <select 
            className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm shadow-sm"
            onChange={e => handleTravelSelect(e.target.value)}
          >
            <option value="">여행 선택...</option>
            {myTravels.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>

        <Input label="Post Title" value={postTitle} onChange={setPostTitle} placeholder="이번 여행의 한 줄 평" />

        {travelPhotos.length > 0 && (
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Select Photos ({selectedPhotoIds.length})</label>
            <div className="grid grid-cols-4 gap-2">
              {travelPhotos.map((p: any) => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPhotoIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                  className={`aspect-square rounded-xl overflow-hidden border-4 transition-all relative cursor-pointer ${selectedPhotoIds.includes(p.id) ? 'border-blue-500 scale-90 shadow-lg' : 'border-transparent'}`}
                >
                  <img src={p.imageUrl} className="w-full h-full object-cover" />
                  {selectedPhotoIds.includes(p.id) && <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5"><Check size={10}/></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleSharePost} className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all mt-4">Post with AI Summary</button>
      </div>
    </div>
  )

  return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[80vh] space-y-16 animate-in zoom-in-95">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter italic">What's Next?</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Build your happiness archive</p>
      </div>
      <div className="w-full grid grid-cols-1 gap-6">
        <SelectionButton 
          icon={<Calendar size={32} />} 
          title="New Journey" 
          desc="새로운 여행 계획 등록" 
          color="bg-blue-600"
          onClick={() => setMode('create_travel')}
        />
        <SelectionButton 
          icon={<Share2 size={32} />} 
          title="Share Memory" 
          desc="AI 기반 게시글 공유" 
          color="bg-indigo-600"
          onClick={() => setMode('share_post')}
        />
      </div>
    </div>
  )
}

function TravelsTab({ travels, onRefresh }: any) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [activeSubTab, setActiveSubTab] = useState<'gallery' | 'plan'>('gallery')

  // Create Plan State
  const [newPlanMemo, setNewPlanMemo] = useState('')
  const [newPlanDate, setNewPlanDate] = useState('')
  const [newPlanStartTime, setNewPlanStartTime] = useState('')
  const [newPlanEndTime, setNewPlanEndTime] = useState('')

  const handleDetail = async (id: string) => {
    setSelectedId(id)
    try {
      const [pl, ph] = await Promise.all([
        axios.get(`${API_URL}/travels/${id}/plans`),
        axios.get(`${API_URL}/travels/${id}/photos`)
      ])
      setPlans(pl.data)
      setPhotos(ph.data)
    } catch (e) { console.error(e) }
  }

  const handleAddPlan = async () => {
    if (!newPlanMemo || !selectedId) return
    try {
      await axios.post(`${API_URL}/travels/${selectedId}/plans`, { 
        date: newPlanDate, 
        startTime: newPlanStartTime,
        endTime: newPlanEndTime,
        memo: newPlanMemo 
      })
      setNewPlanMemo('')
      setNewPlanStartTime('')
      setNewPlanEndTime('')
      handleDetail(selectedId)
    } catch (e: any) { 
      if (e.response?.status === 400) {
        alert("시간 설정이 잘못되었습니다: 시작 시간이 종료 시간보다 늦을 수 없습니다.")
      } else {
        alert("일정 추가 실패")
      }
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!selectedId || !confirm("이 일정을 삭제할까요?")) return
    try {
      await axios.delete(`${API_URL}/travels/${selectedId}/plans/${planId}`)
      handleDetail(selectedId)
    } catch (e) { alert("삭제 실패") }
  }

  if (selectedId) return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-4">
      <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"><X size={16}/> Back</button>
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tight">{travels.find((t: any) => t.id === selectedId)?.title}</h2>
      </div>
      
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto">
        <button onClick={() => setActiveSubTab('gallery')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeSubTab === 'gallery' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Gallery</button>
        <button onClick={() => setActiveSubTab('plan')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeSubTab === 'plan' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Plan</button>
      </div>

      {activeSubTab === 'gallery' ? (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((p: any) => (
            <div key={p.id} className="aspect-square rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 relative group">
              <img src={p.imageUrl} className="w-full h-full object-cover" />
              {p.isSnapshot && <div className="absolute top-2 right-2 bg-blue-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg border border-white/20">Snapshot</div>}
            </div>
          ))}
          <div className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[1.5rem] flex items-center justify-center text-slate-300">
            <Plus size={32} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
             <h4 className="font-black text-sm uppercase tracking-widest text-blue-600 px-1">Add Schedule</h4>
             <div className="flex flex-col gap-3">
               <input type="date" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold" value={newPlanDate} onChange={e => setNewPlanDate(e.target.value)} />
               <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase text-slate-400 px-1">Start</label>
                   <input type="time" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold" value={newPlanStartTime} onChange={e => setNewPlanStartTime(e.target.value)} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase text-slate-400 px-1">End</label>
                   <input type="time" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold" value={newPlanEndTime} onChange={e => setNewPlanEndTime(e.target.value)} />
                 </div>
               </div>
               <input className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold" placeholder="메모 (예: 성산일출봉 가기)" value={newPlanMemo} onChange={e => setNewPlanMemo(e.target.value)} />
               <button onClick={handleAddPlan} className="bg-blue-600 text-white p-4 rounded-xl font-black text-xs shadow-lg shadow-blue-100 active:scale-95 transition-all">Add Plan</button>
             </div>
          </div>

          {/* Timetable Grid View */}
          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="min-w-[400px]">
                {/* Header Row (Days) */}
                <div className="flex border-b border-gray-50 bg-slate-50/50">
                  <div className="w-16 flex-shrink-0 border-r border-gray-100 p-3 flex items-center justify-center">
                    <Clock size={14} className="text-slate-400" />
                  </div>
                  {Array.from(new Set(plans.map(p => p.date))).sort().map(date => (
                    <div key={date} className="flex-1 min-w-[120px] p-3 text-center border-r border-gray-100 last:border-r-0">
                      <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Day</p>
                      <p className="text-[10px] font-black text-slate-800 tracking-tight">{date.split('-').slice(1).join('/')}</p>
                    </div>
                  ))}
                  {plans.length === 0 && <div className="flex-1 p-3 text-center text-[10px] font-bold text-slate-400">등록된 일정이 없습니다</div>}
                </div>

                {/* Body (Time Slots) */}
                <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
                  {["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"].map(hour => (
                    <div key={hour} className="flex border-b border-gray-50 last:border-b-0">
                      {/* Time Label */}
                      <div className="w-16 flex-shrink-0 border-r border-gray-100 p-2 flex items-center justify-center">
                        <span className="text-[10px] font-black text-slate-400">{hour}:00</span>
                      </div>
                      
                      {/* Plans for each Day */}
                      {Array.from(new Set(plans.map(p => p.date))).sort().map(date => {
                        const planInSlot = plans.find(p => p.date === date && p.startTime?.startsWith(hour));
                        return (
                          <div key={`${date}-${hour}`} className="flex-1 min-w-[120px] p-1 border-r border-gray-100 last:border-r-0 min-h-[50px] relative group/item">
                            {planInSlot && (
                              <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 h-full flex flex-col justify-center animate-in zoom-in-95">
                                <button 
                                  onClick={() => handleDeletePlan(planInSlot.id)}
                                  className="absolute top-1 right-1 bg-white/80 text-red-500 p-1 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity z-10 shadow-sm"
                                >
                                  <X size={10} />
                                </button>
                                <p className="text-[8px] font-black text-blue-600 uppercase mb-0.5">{planInSlot.startTime}</p>
                                <p className="text-[10px] font-bold text-slate-800 leading-tight line-clamp-2">{planInSlot.memo}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-400 text-center px-4 uppercase tracking-widest italic">Tip: 가로로 스크롤하여 날짜별 일정을 확인하세요</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4">
      <div className="space-y-1">
        <h2 className="text-3xl font-black italic tracking-tighter">Memories</h2>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">Personal Archive</p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {travels.map((t: any) => (
          <div 
            key={t.id} 
            onClick={() => handleDetail(t.id)}
            className="bg-white p-6 rounded-[2rem] shadow-md border border-gray-50 flex justify-between items-center group active:scale-95 transition-all cursor-pointer"
          >
            <div>
              <h4 className="font-black text-lg text-slate-800">{t.title}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.startDate} - {t.endDate}</p>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ChevronRight size={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileTab({ user, bookmarks, onLogout }: any) {
  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl rotate-6">
          {user.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight">{user}</h2>
          <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mt-1 italic">World Explorer</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
        <Stat label="Travels" value="12" />
        <Stat label="Snaps" value="148" />
        <Stat label="Pins" value="42" />
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black tracking-tighter px-1">Bookmarked</h3>
        <div className="grid grid-cols-2 gap-4">
          {bookmarks.map((p: any) => (
            <div key={p.id} className="aspect-[4/5] bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100">
              {p.photos?.[0] && <img src={p.photos[0].url} className="w-full h-full object-cover" />}
            </div>
          ))}
        </div>
      </div>

      <button onClick={onLogout} className="w-full py-5 rounded-2xl bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-colors">
        Logout Account
      </button>
    </div>
  )
}

// --- Utils ---

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button className={`flex flex-col items-center gap-1 transition-all px-4 py-2 rounded-2xl ${active ? 'text-white bg-blue-600 shadow-lg shadow-blue-500/30 scale-105' : 'text-slate-400 hover:text-slate-200'}`} onClick={onClick}>
      {React.cloneElement(icon, { size: 18, strokeWidth: active ? 3 : 2 })}
      <span className={`text-[8px] font-black uppercase tracking-tighter transition-all ${active ? 'opacity-100 mt-0.5' : 'opacity-0 h-0'}`}>{label}</span>
    </button>
  )
}

function Input({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-2 px-1">
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</label>
      <input 
        className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function SelectionButton({ icon, title, desc, color, onClick }: any) {
  return (
    <button onClick={onClick} className="bg-white p-6 rounded-[2.5rem] shadow-md border border-gray-50 flex items-center gap-6 group active:scale-[0.98] transition-all">
      <div className={`w-16 h-16 ${color} rounded-[1.5rem] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="text-left">
        <h4 className="font-black text-xl text-slate-800">{title}</h4>
        <p className="text-xs font-bold text-slate-400">{desc}</p>
      </div>
    </button>
  )
}

function Stat({ label, value }: any) {
  return (
    <div className="text-center">
      <p className="text-xl font-black text-slate-900">{value}</p>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  )
}

function PostCard({ post }: any) {
  return (
    <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-50 space-y-4">
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
        <MoreHorizontal className="text-slate-400" size={18} />
      </div>
      <div className="aspect-[4/5] bg-slate-50 rounded-[2rem] overflow-hidden">
        {post.photos?.[0] && <img src={post.photos[0].url} className="w-full h-full object-cover" />}
      </div>
      <div className="px-2 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-5 items-center">
            <div className="flex items-center gap-1.5"><Heart size={22} className="text-slate-700" /> <span className="text-[10px] font-black">{post.likeCount}</span></div>
            <div className="flex items-center gap-1.5"><PlusSquare size={22} className="text-slate-700" /> <span className="text-[10px] font-black">{post.cloneCount}</span></div>
            <Share2 size={20} className="text-slate-700" />
          </div>
          <Bookmark size={22} className="text-slate-700" />
        </div>
        <h4 className="font-black text-lg text-slate-900 leading-tight">{post.title}</h4>
        <div className="bg-slate-50 p-4 rounded-2xl">
          <p className="text-slate-600 text-[11px] leading-relaxed font-medium italic">"{post.contentSummary}"</p>
        </div>
      </div>
    </div>
  )
}
