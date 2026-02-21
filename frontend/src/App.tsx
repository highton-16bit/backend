import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Home, Compass, PlusSquare, Image, User, Camera, Heart, Bookmark, MapPin, Calendar, Upload, Loader2, MoreHorizontal, Share2 } from 'lucide-react'

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

  useEffect(() => {
    if (user) {
      axios.defaults.headers.common['Authorization'] = user
      fetchAllData()
    }
  }, [user])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const travelRes = await axios.get(`${API_URL}/travels/active`)
      setActiveTravel(travelRes.data)
      const feedRes = await axios.get(`${API_URL}/posts`)
      setFeed(feedRes.data)
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
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl relative overflow-hidden font-sans text-slate-900">
      {/* Top Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-lg sticky top-0 z-30 border-b border-gray-100">
        <h1 className="text-2xl font-black text-blue-600 tracking-tighter italic select-none">Plog</h1>
        <div className="flex items-center gap-4 text-slate-600">
          {isLoading && <Loader2 className="animate-spin text-blue-500" size={20} />}
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
            <User size={18} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {activeTab === 'home' && <HomeTab activeTravel={activeTravel} feed={feed} />}
        {activeTab === 'discovery' && <DiscoveryTab posts={discoveryPosts} onRefresh={fetchDiscovery} />}
        {activeTab === 'new' && <NewTab activeTravelId={activeTravel?.id} onComplete={() => {setActiveTab('home'); fetchAllData();}} />}
        {activeTab === 'travels' && <TravelsTab travels={myTravels} />}
      </main>

      {/* Bottom Floating Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl flex justify-around items-center p-3 z-40 border border-white/10">
        <NavButton icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => {setActiveTab('home'); fetchAllData();}} />
        <NavButton icon={<Compass />} label="Explore" active={activeTab === 'discovery'} onClick={() => {setActiveTab('discovery'); fetchDiscovery();}} />
        <NavButton icon={<PlusSquare />} label="Record" active={activeTab === 'new'} onClick={() => setActiveTab('new')} />
        <NavButton icon={<Image />} label="Memories" active={activeTab === 'travels'} onClick={() => {setActiveTab('travels'); fetchAllData();}} />
        <button onClick={() => {localStorage.removeItem('plog_user'); window.location.reload();}} className="flex flex-col items-center gap-1 text-red-400/80 p-2">
          <User size={22} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Logout</span>
        </button>
      </nav>
    </div>
  )
}

function HomeTab({ activeTravel, feed }: any) {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Active Journey */}
      <section className="p-6">
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Live Journey</span>
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tight leading-tight">
              {activeTravel?.title || '어디로 떠날까요?'}
            </h2>
            <div className="flex items-center gap-2 text-blue-50 font-medium bg-black/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
              <MapPin size={14} /> 
              <span className="text-sm">{activeTravel?.regionName || '나만의 여행을 시작해보세요'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Detail Feed Section */}
      <section className="px-6 pb-10 space-y-10">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-2xl font-black tracking-tighter">Recent Logs</h3>
          <span className="text-blue-600 font-bold text-xs uppercase tracking-widest cursor-pointer">View All</span>
        </div>
        
        {feed.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
            <Image className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-400 font-bold">아직 공유된 기록이 없습니다.</p>
          </div>
        )}

        {feed.map((post: any) => (
          <div key={post.id} className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-50 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center font-bold text-white shadow-inner">
                  {post.username?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                   <p className="font-bold text-sm text-slate-800">{post.username || 'Plog User'}</p>
                   <p className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">Verified Explorer</p>
                </div>
              </div>
              <MoreHorizontal className="text-slate-400" size={20} />
            </div>

            <div className="aspect-[4/5] bg-slate-100 rounded-[2rem] overflow-hidden relative group">
               {post.photos && post.photos.length > 0 ? (
                 <img src={post.photos[0].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="post" />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                    <Image size={48} strokeWidth={1} />
                    <span className="text-xs italic">No visual moments captured</span>
                 </div>
               )}
            </div>

            <div className="px-2 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-6 items-center">
                  <button className="flex items-center gap-1.5 text-slate-700 hover:text-red-500 transition-colors">
                    <Heart size={24} className="fill-current text-transparent hover:text-red-500" /> 
                    <span className="text-xs font-black">{post.likeCount}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-700 hover:text-blue-500 transition-colors">
                    <PlusSquare size={24} /> 
                    <span className="text-xs font-black">{post.cloneCount}</span>
                  </button>
                  <Share2 size={22} className="text-slate-700" />
                </div>
                <Bookmark size={24} className="text-slate-700" />
              </div>

              <div>
                <h4 className="font-black text-xl mb-2 text-slate-900 leading-tight">{post.title}</h4>
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100/50">
                   <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap line-clamp-4 font-medium italic">
                     "{post.contentSummary}"
                   </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function DiscoveryTab({ posts, onRefresh }: any) {
  useEffect(() => { onRefresh() }, [])
  return (
    <div className="p-6 animate-in slide-in-from-right-10 duration-500">
       <div className="mb-8 space-y-1">
         <h2 className="text-3xl font-black italic tracking-tighter text-slate-900">Discovery</h2>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Find your next happiness</p>
       </div>
       <div className="grid grid-cols-3 gap-2">
        {posts.map((post: any) => (
          <div key={post.id} className="aspect-square bg-white rounded-2xl overflow-hidden active:scale-95 transition-all shadow-sm border border-gray-100 hover:shadow-md">
            {post.photos && post.photos.length > 0 ? (
              <img src={post.photos[0].url} className="w-full h-full object-cover" alt="thumb" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-200"><Image size={24} /></div>
            )}
          </div>
        ))}
        {posts.length === 0 && [1,2,3,4,5,6].map(i => (
          <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}

function NewTab({ activeTravelId, onComplete }: any) {
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeTravelId) {
      if (!activeTravelId) alert("진행 중인 여행이 없습니다!")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('travelId', activeTravelId)
    formData.append('isSnapshot', 'true')

    try {
      await axios.post(`${API_URL}/photos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert("Snapshot Recorded! ✨")
      onComplete()
    } catch (err) {
      alert("Upload Failed")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[80vh] space-y-12 animate-in zoom-in-95 duration-500">
      <div className="relative">
        <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 rotate-12">
          <Camera size={48} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white border-4 border-white">
          <PlusSquare size={20} />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight">Record Vibe</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Capture the moment of joy</p>
      </div>

      <div className="w-full space-y-6">
        <label className={`w-full p-12 border-4 border-dashed rounded-[3.5rem] transition-all flex flex-col items-center gap-6 cursor-pointer active:scale-95 shadow-inner ${isUploading ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-100 hover:border-blue-300 hover:bg-blue-50/30'}`}>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
          {isUploading ? <Loader2 size={56} className="animate-spin text-blue-500" /> : <Upload size={56} className="text-blue-600" />}
          <div className="text-center">
            <span className="block font-black text-slate-800 text-xl">Snapshot</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Automatic GPS & Time Analysis</span>
          </div>
        </label>
        
        <button className="w-full py-6 rounded-[2.5rem] bg-slate-100 text-slate-500 font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors">
          <Calendar size={20} />
          Plan New Adventure
        </button>
      </div>
    </div>
  )
}

function TravelsTab({ travels }: any) {
  return (
    <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="space-y-1">
        <h2 className="text-3xl font-black italic tracking-tighter text-slate-900">Memories</h2>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] px-1">Your Journey History</p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {travels.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-300 font-black italic">No memories saved yet.</p>
          </div>
        )}
        {travels.map((travel: any) => (
          <div key={travel.id} className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden group shadow-lg shadow-slate-200 active:scale-[0.98] transition-all">
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10"></div>
             <div className="absolute inset-0 bg-blue-100 group-hover:scale-110 transition-transform duration-1000 flex items-center justify-center">
                <Image className="text-blue-200" size={64} />
             </div>
             <div className="absolute bottom-8 left-8 z-20 text-white space-y-1">
                <h4 className="text-2xl font-black tracking-tight">{travel.title}</h4>
                <div className="flex items-center gap-2 opacity-80">
                  <Calendar size={12} className="text-blue-400" />
                  <span className="text-[10px] font-black tracking-widest uppercase">{travel.startDate} — {travel.endDate}</span>
                </div>
             </div>
             <div className="absolute top-8 right-8 z-20">
                <span className="bg-blue-600/90 backdrop-blur-md text-[9px] font-black px-4 py-2 rounded-full text-white uppercase tracking-widest border border-white/20 shadow-lg">
                  {travel.regionName || 'Globe'}
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
    <button className={`flex flex-col items-center gap-1 transition-all px-4 py-2 rounded-2xl ${active ? 'text-white bg-blue-600 shadow-lg shadow-blue-500/30 scale-105' : 'text-slate-400 hover:text-slate-300'}`} onClick={onClick}>
      {React.cloneElement(icon, { size: 20, strokeWidth: active ? 3 : 2 })}
      <span className={`text-[8px] font-black uppercase tracking-tighter transition-all ${active ? 'opacity-100' : 'opacity-0 h-0'}`}>{label}</span>
    </button>
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
    } catch (e) { alert("Login Error") }
  }
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto items-center justify-center p-8 bg-white font-sans">
      <div className="w-full text-center space-y-12">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-blue-200 rotate-12">
            <Camera size={40} />
          </div>
          <h1 className="text-6xl font-black text-slate-900 italic tracking-tighter">Plog</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Moments that Matter</p>
        </div>

        <div className="space-y-4 pt-10">
          <input 
            className="w-full p-6 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-blue-500 transition-all text-center text-xl font-black tracking-tight placeholder:text-slate-300" 
            placeholder="Type Username" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <button 
            className="w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
            onClick={handleLogin}
          >Get Started</button>
        </div>
      </div>
    </div>
  )
}
