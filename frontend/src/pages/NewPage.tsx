import { useState } from 'react'
import { X, Calendar, Share2, Check } from 'lucide-react'
import type { Travel, TravelPhoto } from '../types'
import { Input } from '../components/common'
import { travelService, postService } from '../services'
import { getErrorMessage } from '../services/api'
import { validateDateRange, validateRequired } from '../utils/validation'

interface NewPageProps {
  myTravels: Travel[]
  onComplete: () => void
}

type Mode = 'select' | 'create_travel' | 'share_post'

export default function NewPage({ myTravels, onComplete }: NewPageProps) {
  const [mode, setMode] = useState<Mode>('select')

  // Create Travel State
  const [title, setTitle] = useState('')
  const [region, setRegion] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Share Post State
  const [selectedTravelId, setSelectedTravelId] = useState('')
  const [postTitle, setPostTitle] = useState('')
  const [travelPhotos, setTravelPhotos] = useState<TravelPhoto[]>([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setTitle('')
    setRegion('')
    setStartDate('')
    setEndDate('')
    setSelectedTravelId('')
    setPostTitle('')
    setTravelPhotos([])
    setSelectedPhotoIds([])
    setErrors({})
  }

  const handleCreateTravel = async () => {
    // Validation
    const newErrors: Record<string, string> = {}
    const titleError = validateRequired(title, '제목')
    const dateError = validateDateRange(startDate, endDate)

    if (titleError) newErrors.title = titleError
    if (dateError) newErrors.date = dateError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      await travelService.create({
        title,
        startDate,
        endDate,
        regionName: region || undefined,
      })
      alert('신규 여행이 생성되었습니다!')
      resetForm()
      onComplete()
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleTravelSelect = async (id: string) => {
    setSelectedTravelId(id)
    try {
      const photos = await travelService.getPhotos(id)
      setTravelPhotos(photos)
    } catch (error) {
      console.error(error)
    }
  }

  const handleSharePost = async () => {
    if (!selectedTravelId || !postTitle.trim()) {
      alert('여행과 제목을 선택해주세요')
      return
    }

    setIsLoading(true)
    try {
      await postService.create({
        travelId: selectedTravelId,
        title: postTitle,
        photoIds: selectedPhotoIds,
      })
      alert('게시글이 공유되었습니다! (AI 일정이 자동 포함됩니다)')
      resetForm()
      onComplete()
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    )
  }

  // Create Travel Form
  if (mode === 'create_travel') {
    return (
      <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4">
        <button
          onClick={() => {
            resetForm()
            setMode('select')
          }}
          className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"
        >
          <X size={16} /> Back
        </button>

        <h2 className="text-3xl font-black italic">Start New Journey</h2>

        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={setTitle}
            placeholder="제주도 힐링 여행"
            error={errors.title}
          />
          <Input
            label="Region"
            value={region}
            onChange={setRegion}
            placeholder="제주, 서귀포"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start"
              type="date"
              value={startDate}
              onChange={setStartDate}
              error={errors.date}
            />
            <Input label="End" type="date" value={endDate} onChange={setEndDate} />
          </div>

          <button
            onClick={handleCreateTravel}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Journey'}
          </button>
        </div>
      </div>
    )
  }

  // Share Post Form
  if (mode === 'share_post') {
    return (
      <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4">
        <button
          onClick={() => {
            resetForm()
            setMode('select')
          }}
          className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"
        >
          <X size={16} /> Back
        </button>

        <h2 className="text-3xl font-black italic">Share Memory</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">
              Select Travel
            </label>
            <select
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm shadow-sm"
              value={selectedTravelId}
              onChange={(e) => handleTravelSelect(e.target.value)}
            >
              <option value="">여행 선택...</option>
              {myTravels.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Post Title"
            value={postTitle}
            onChange={setPostTitle}
            placeholder="이번 여행의 한 줄 평"
          />

          {travelPhotos.length > 0 && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">
                Select Photos ({selectedPhotoIds.length})
              </label>
              <div className="grid grid-cols-4 gap-2">
                {travelPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => togglePhotoSelection(photo.id)}
                    className={`aspect-square rounded-xl overflow-hidden border-4 transition-all relative cursor-pointer ${
                      selectedPhotoIds.includes(photo.id)
                        ? 'border-blue-500 scale-90 shadow-lg'
                        : 'border-transparent'
                    }`}
                  >
                    <img
                      src={photo.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {selectedPhotoIds.includes(photo.id) && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5">
                        <Check size={10} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSharePost}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Posting...' : 'Post with AI Summary'}
          </button>
        </div>
      </div>
    )
  }

  // Mode Selection
  return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[80vh] space-y-16 animate-in zoom-in-95">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter italic">What's Next?</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
          Build your happiness archive
        </p>
      </div>

      <div className="w-full grid grid-cols-1 gap-6">
        <button
          onClick={() => setMode('create_travel')}
          className="bg-white p-6 rounded-[2.5rem] shadow-md border border-gray-50 flex items-center gap-6 group active:scale-[0.98] transition-all"
        >
          <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
            <Calendar size={32} />
          </div>
          <div className="text-left">
            <h4 className="font-black text-xl text-slate-800">New Journey</h4>
            <p className="text-xs font-bold text-slate-400">새로운 여행 계획 등록</p>
          </div>
        </button>

        <button
          onClick={() => setMode('share_post')}
          className="bg-white p-6 rounded-[2.5rem] shadow-md border border-gray-50 flex items-center gap-6 group active:scale-[0.98] transition-all"
        >
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
            <Share2 size={32} />
          </div>
          <div className="text-left">
            <h4 className="font-black text-xl text-slate-800">Share Memory</h4>
            <p className="text-xs font-bold text-slate-400">AI 기반 게시글 공유</p>
          </div>
        </button>
      </div>
    </div>
  )
}
