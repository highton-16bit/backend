import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Home, Compass, PlusSquare, Image, User, Camera, Heart, Bookmark, MapPin, Calendar, Upload, Loader2 } from 'lucide-react'

// Backend URL
const API_URL = 'https://16bit-api-production.up.railway.app'

export default function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem('plog_user'))
  const [activeTab, setActiveTab] = useState('home')
  const [activeTravel, setActiveTravel] = useState<any>(null)
  const [feed, setFeed] = useState<any[]>([])
  const [discoveryPosts, setDiscoveryPosts] = useState<any[]>([])
  const [myTravels, setMyTravels] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Axios Global Header & Initial Fetch
  useEffect(() => {
    if (user) {
      axios.defaults.headers.common['Authorization'] = user
      fetchAllData()
    }
  }, [user])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      // 1. 진행 중인 여행 조회
      const travelRes = await axios.get(`${API_URL}/travels/active`)
      setActiveTravel(travelRes.data)
      
      // 2. 홈 피드 조회
      const feedRes = await axios.get(`${API_URL}/posts`)
      setFeed(feedRes.data)

      // 3. 내 전체 여행 조회
      const myTravelsRes = await axios.get(`${API_URL}/travels`)
      setMyTravels(myTravelsRes.data)
    } catch (e) {
      console.error("Data fetch error", e)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDiscovery = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts`)
      setDiscoveryPosts(res.data)
    } catch (e) { console.error(e) }
  }

  if (!user) return <LoginScreen onLogin={setUser} />

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden font-sans">
      {/* Header */}
      <header className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-black text-blue-600 tracking-tighter italic">Plog</h1>
        <div className="flex gap-4 text-gray-600">
          {isLoading && <Loader2 className="animate-spin" size={20} />}
          <Camera size={24} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'home' && <HomeTab activeTravel={activeTravel} feed={feed} />}
        {activeTab === 'discovery' && <DiscoveryTab posts={discoveryPosts} onRefresh={fetchDiscovery} />}
        {activeTab === 'new' && <NewTab activeTravelId={activeTravel?.id} onComplete={() => {setActiveTab('home'); fetchAllData();}} />}
        {activeTab === 'travels' && <TravelsTab travels={myTravels} />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-md border-t flex justify-around p-3 z-20">
        <NavButton icon={<Home />} label="홈" active={activeTab === 'home'} onClick={() => {setActiveTab('home'); fetchAllData();}} />
        <NavButton icon={<Compass />} label="탐색" active={activeTab === 'discovery'} onClick={() => {setActiveTab('discovery'); fetchDiscovery();}} />
        <NavButton icon={<PlusSquare />} label="기록" active={activeTab === 'new'} onClick={() => setActiveTab('new')} />
        <NavButton icon={<Image />} label="내 여행" active={activeTab === 'travels'} onClick={() => {setActiveTab('travels'); fetchAllData();}} />
        <NavButton icon={<User />} label="로그아웃" onClick={() => {localStorage.removeItem('plog_user'); window.location.reload();}} />
      </nav>
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState('')
  const handleLogin = async () => {
    if (!name) return
    try {
      await axios.post(`${API_URL}/auth`, { username: name })
      localStorage.setItem('plog_user', name)
      onLogin(name)
    } catch (e) { alert("로그인 실패") }
  }
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto items-center justify-center p-8 bg-slate-50">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full text-center border border-slate-100">
        <h1 className="text-5xl font-black text-blue-600 mb-2 italic tracking-tighter">Plog</h1>
        <p className="text-slate-400 mb-10 font-medium">순간의 행복을 기록하다</p>
        <input 
          className="w-full p-5 bg-slate-50 border-none rounded-2xl mb-4 focus:ring-2 focus:ring-blue-500 transition-all text-center text-lg font-bold" 
          placeholder="유저네임" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button 
          className="w-full bg-blue-600 text-white p-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          onClick={handleLogin}
        >시작하기</button>
      </div>
    </div>
  )
}

function HomeTab({ activeTravel, feed }: any) {
  return (
    <div className="p-4 space-y-8">
      {/* Active Travel Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">Live Journey</span>
          </div>
          <h2 className="text-3xl font-black mb-2 tracking-tight">
            {activeTravel?.title || '여행을 떠날까요?'}
          </h2>
          <div className="flex items-center gap-2 text-blue-100/80 font-medium">
            <MapPin size={16} /> 
            {activeTravel?.regionName || '새로운 장소를 발견해보세요'}
          </div>
          <div className="mt-6 flex gap-2">
             <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold">
               {activeTravel?.startDate || '??'} ~ {activeTravel?.endDate || '??'}
             </div>
          </div>
        </div>
      </div>

      {/* Feed (Instagram Detail Style) */}
      <div className="space-y-12">
        <h3 className="text-xl font-black px-1">최신 기록</h3>
        {feed.length === 0 && <p className="text-center text-gray-400 py-10">아직 올라온 기록이 없습니다.</p>}
        {feed.map((post: any) => (
          <div key={post.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-100 to-blue-50 rounded-full flex items-center justify-center font-bold text-blue-600 border border-blue-100">
                  {post.username?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                   <p className="font-bold text-sm">{post.username || 'Anonymous'}</p>
                   <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Snapshotted</p>
                </div>
              </div>
            </div>
            {/* Image Slider Placeholder - 실제론 첫 이미지만 */}
            <div className="aspect-[4/5] bg-slate-50 rounded-[2.5rem] overflow-hidden shadow-inner border border-slate-100">
               {post.photos && post.photos.length > 0 ? (
                 <img src={post.photos[0].url} className="w-full h-full object-cover" alt="post" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-sm">No Image</div>
               )}
            </div>
            <div className="flex justify-between items-center px-2">
              <div className="flex gap-5 text-slate-700">
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-red-500 transition-colors">
                  <Heart size={26} /> <span className="text-xs font-bold">{post.likeCount}</span>
                </div>
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors">
                  <PlusSquare size={26} /> <span className="text-xs font-bold">{post.cloneCount}</span>
                </div>
              </div>
              <Bookmark size={26} className="text-slate-700" />
            </div>
            <div className="px-2">
              <p className="font-black text-lg mb-2">{post.title}</p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{post.contentSummary}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DiscoveryTab({ posts, onRefresh }: any) {
  useEffect(() => { onRefresh() }, [])
  return (
    <div className="space-y-4 p-4">
       <h2 className="text-2xl font-black italic tracking-tighter text-slate-800">Discovery</h2>
       <div className="grid grid-cols-3 gap-1.5">
        {posts.map((post: any) => (
          <div key={post.id} className="aspect-square bg-slate-100 rounded-xl overflow-hidden active:scale-95 transition-transform shadow-sm">
            {post.photos && post.photos.length > 0 ? (
              <img src={post.photos[0].url} className="w-full h-full object-cover" alt="thumb" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300"><Image size={20} /></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function NewTab({ activeTravelId, onComplete }: any) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeTravelId) {
      if (!activeTravelId) alert("진행 중인 여행이 없습니다. 먼저 여행을 생성해주세요!")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('travelId', activeTravelId)
    formData.append('isSnapshot', 'true')

    try {
      const res = await axios.post(`${API_URL}/photos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadResult(res.data)
      alert("스냅샷 기록 성공!")
      onComplete()
    } catch (err) {
      alert("업로드 실패")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-8 space-y-10 text-center flex flex-col items-center justify-center h-full">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
        <PlusSquare size={40} />
      </div>
      <div>
        <h2 className="text-3xl font-black tracking-tight mb-2">행복을 기록하세요</h2>
        <p className="text-slate-400 font-medium">지금 이 순간의 감정을 사진에 담아보세요</p>
      </div>

      <div className="w-full space-y-4">
        <label className={`w-full p-10 border-4 border-dashed rounded-[3rem] transition-all flex flex-col items-center gap-4 cursor-pointer active:scale-95 ${isUploading ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'}`}>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
          {isUploading ? <Loader2 size={48} className="animate-spin text-blue-500" /> : <Camera size={48} className="text-blue-500" />}
          <span className="font-black text-blue-600 text-lg">스냅샷 촬영 / 업로드</span>
        </label>
        
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">자동 메타데이터(GPS, 시간) 분석 포함</p>
      </div>

      <button className="flex items-center gap-2 text-slate-400 font-bold hover:text-blue-600 transition-colors">
        <Calendar size={20} />
        새로운 여행 계획하기
      </button>
    </div>
  )
}

function TravelsTab({ travels }: any) {
  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-black italic tracking-tighter text-slate-800">My Memories</h2>
      <div className="grid grid-cols-1 gap-6">
        {travels.length === 0 && <p className="text-center text-gray-400 py-20">아직 기록된 여행이 없습니다.</p>}
        {travels.map((travel: any) => (
          <div key={travel.id} className="relative aspect-[16/9] rounded-[2rem] overflow-hidden group shadow-lg">
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
             {/* Background Image Placeholder or First Photo if available */}
             <div className="absolute inset-0 bg-slate-200 group-hover:scale-105 transition-transform duration-700"></div>
             <div className="absolute bottom-6 left-6 z-20 text-white">
                <h4 className="text-2xl font-black tracking-tight mb-1">{travel.title}</h4>
                <p className="text-xs font-bold text-white/70 flex items-center gap-1">
                  <Calendar size={12} /> {travel.startDate} ~ {travel.endDate}
                </p>
             </div>
             <div className="absolute top-6 right-6 z-20">
                <span className="bg-white/20 backdrop-blur-md text-[10px] font-black px-3 py-1.5 rounded-full text-white uppercase tracking-widest border border-white/30">
                  {travel.regionName || 'Location'}
                </span>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button className={`flex flex-col items-center gap-1.5 transition-all w-16 ${active ? 'text-blue-600 scale-110' : 'text-slate-300'}`} onClick={onClick}>
      {React.cloneElement(icon, { size: 24, strokeWidth: active ? 3 : 2 })}
      <span className={`text-[10px] font-black tracking-tighter ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
    </button>
  )
}
