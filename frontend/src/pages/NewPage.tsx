import { useState, useReducer } from 'react'
import { X, Calendar, Share2 } from 'lucide-react'
import type { Travel, TravelPhoto, TravelPlanItem } from '../types'
import { Input, DatePicker, Button } from '../components/common'
import { TravelSelector, PhotoSelector, PostEditor, generateScheduleText } from '../components/share'
import { travelService, postService } from '../services'
import { getErrorMessage } from '../services/api'
import { validateDateRange, validateRequired } from '../utils/validation'

interface NewPageProps {
  myTravels: Travel[]
  onComplete: () => void
}

type Mode = 'select' | 'create_travel' | 'share_memory'

// Share Memory Step State
type ShareStep = 'select_travel' | 'select_photos' | 'edit_post'

interface ShareState {
  step: ShareStep
  selectedTravel: Travel | null
  travelPhotos: TravelPhoto[]
  travelPlans: TravelPlanItem[]
  selectedPhotoIds: string[]
  photoOrder: string[]
  postTitle: string
  postContent: string
}

type ShareAction =
  | { type: 'SELECT_TRAVEL'; travel: Travel; photos: TravelPhoto[]; plans: TravelPlanItem[] }
  | { type: 'TOGGLE_PHOTO'; photoId: string }
  | { type: 'CONTINUE_TO_EDIT' }
  | { type: 'BACK_TO_TRAVEL' }
  | { type: 'BACK_TO_PHOTOS' }
  | { type: 'REORDER_PHOTOS'; order: string[] }
  | { type: 'REMOVE_PHOTO'; photoId: string }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_CONTENT'; content: string }
  | { type: 'RESET' }

const initialShareState: ShareState = {
  step: 'select_travel',
  selectedTravel: null,
  travelPhotos: [],
  travelPlans: [],
  selectedPhotoIds: [],
  photoOrder: [],
  postTitle: '',
  postContent: '',
}

function shareReducer(state: ShareState, action: ShareAction): ShareState {
  switch (action.type) {
    case 'SELECT_TRAVEL':
      return {
        ...state,
        step: 'select_photos',
        selectedTravel: action.travel,
        travelPhotos: action.photos,
        travelPlans: action.plans,
        selectedPhotoIds: [],
        photoOrder: [],
        postTitle: action.travel.title,
        postContent: '',
      }
    case 'TOGGLE_PHOTO':
      const isSelected = state.selectedPhotoIds.includes(action.photoId)
      return {
        ...state,
        selectedPhotoIds: isSelected
          ? state.selectedPhotoIds.filter((id) => id !== action.photoId)
          : [...state.selectedPhotoIds, action.photoId],
      }
    case 'CONTINUE_TO_EDIT':
      return {
        ...state,
        step: 'edit_post',
        photoOrder: state.selectedPhotoIds,
        // 일정 텍스트로 content 초기화 (AI 없이 정적 변환)
        postContent: state.postContent || generateScheduleText(state.travelPlans),
      }
    case 'BACK_TO_TRAVEL':
      return {
        ...state,
        step: 'select_travel',
        selectedTravel: null,
        travelPhotos: [],
        travelPlans: [],
        selectedPhotoIds: [],
        photoOrder: [],
      }
    case 'BACK_TO_PHOTOS':
      return {
        ...state,
        step: 'select_photos',
      }
    case 'REORDER_PHOTOS':
      return {
        ...state,
        photoOrder: action.order,
      }
    case 'REMOVE_PHOTO':
      return {
        ...state,
        photoOrder: state.photoOrder.filter((id) => id !== action.photoId),
        selectedPhotoIds: state.selectedPhotoIds.filter((id) => id !== action.photoId),
      }
    case 'SET_TITLE':
      return {
        ...state,
        postTitle: action.title,
      }
    case 'SET_CONTENT':
      return {
        ...state,
        postContent: action.content,
      }
    case 'RESET':
      return initialShareState
    default:
      return state
  }
}

export default function NewPage({ myTravels, onComplete }: NewPageProps) {
  const [mode, setMode] = useState<Mode>('select')
  const [shareState, shareDispatch] = useReducer(shareReducer, initialShareState)

  // Create Travel State
  const [title, setTitle] = useState('')
  const [region, setRegion] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setTitle('')
    setRegion('')
    setStartDate('')
    setEndDate('')
    setErrors({})
    shareDispatch({ type: 'RESET' })
  }

  const handleCreateTravel = async () => {
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

  const handleTravelSelect = async (travel: Travel) => {
    try {
      const [photos, plans] = await Promise.all([
        travelService.getPhotos(travel.id),
        travelService.getPlans(travel.id),
      ])
      shareDispatch({ type: 'SELECT_TRAVEL', travel, photos, plans })
    } catch (error) {
      console.error(error)
    }
  }

  const handleSharePost = async () => {
    if (!shareState.selectedTravel || !shareState.postTitle.trim()) {
      alert('제목을 입력해주세요')
      return
    }

    setIsLoading(true)
    try {
      await postService.create({
        travelId: shareState.selectedTravel.id,
        title: shareState.postTitle,
        photoIds: shareState.photoOrder,
      })
      alert('게시글이 공유되었습니다!')
      resetForm()
      onComplete()
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  // Create Travel Form
  if (mode === 'create_travel') {
    return (
      <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4">
        <button
          onClick={() => {
            resetForm()
            setMode('select')
          }}
          className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"
        >
          <X size={16} /> Back
        </button>

        <h2 className="text-2xl font-black italic tracking-tight">Start New Journey</h2>

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
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Start"
              value={startDate}
              onChange={setStartDate}
              placeholder="시작일"
              error={errors.date}
            />
            <DatePicker
              label="End"
              value={endDate}
              onChange={setEndDate}
              placeholder="종료일"
              minDate={startDate}
            />
          </div>

          <Button
            onClick={handleCreateTravel}
            disabled={isLoading}
            isLoading={isLoading}
            className="w-full mt-4"
            size="lg"
          >
            Create Journey
          </Button>
        </div>
      </div>
    )
  }

  // Share Memory Flow (3 Steps)
  if (mode === 'share_memory') {
    return (
      <div className="p-6 animate-in slide-in-from-bottom-4">
        {shareState.step === 'select_travel' && (
          <>
            <button
              onClick={() => {
                resetForm()
                setMode('select')
              }}
              className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase mb-4"
            >
              <X size={16} /> Back
            </button>
            <TravelSelector
              travels={myTravels}
              onSelect={handleTravelSelect}
            />
          </>
        )}

        {shareState.step === 'select_photos' && (
          <PhotoSelector
            photos={shareState.travelPhotos}
            selectedIds={shareState.selectedPhotoIds}
            onToggle={(id) => shareDispatch({ type: 'TOGGLE_PHOTO', photoId: id })}
            onBack={() => shareDispatch({ type: 'BACK_TO_TRAVEL' })}
            onContinue={() => shareDispatch({ type: 'CONTINUE_TO_EDIT' })}
          />
        )}

        {shareState.step === 'edit_post' && (
          <PostEditor
            photos={shareState.travelPhotos}
            photoOrder={shareState.photoOrder}
            plans={shareState.travelPlans}
            title={shareState.postTitle}
            content={shareState.postContent}
            isSubmitting={isLoading}
            onPhotoReorder={(order) => shareDispatch({ type: 'REORDER_PHOTOS', order })}
            onPhotoRemove={(id) => shareDispatch({ type: 'REMOVE_PHOTO', photoId: id })}
            onTitleChange={(title) => shareDispatch({ type: 'SET_TITLE', title })}
            onContentChange={(content) => shareDispatch({ type: 'SET_CONTENT', content })}
            onBack={() => shareDispatch({ type: 'BACK_TO_PHOTOS' })}
            onSubmit={handleSharePost}
          />
        )}
      </div>
    )
  }

  // Mode Selection
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[70vh] space-y-12 animate-in zoom-in-95">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tighter italic">What's Next?</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.25em]">
          Build your happiness archive
        </p>
      </div>

      <div className="w-full grid grid-cols-1 gap-5">
        <button
          onClick={() => setMode('create_travel')}
          className="bg-white p-5 rounded-[2rem] shadow-md border border-gray-50 flex items-center gap-5 group active:scale-[0.98] transition-all"
        >
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
            <Calendar size={28} />
          </div>
          <div className="text-left">
            <h4 className="font-black text-lg text-slate-800">New Journey</h4>
            <p className="text-xs font-bold text-slate-400">새로운 여행 계획 등록</p>
          </div>
        </button>

        <button
          onClick={() => setMode('share_memory')}
          className="bg-white p-5 rounded-[2rem] shadow-md border border-gray-50 flex items-center gap-5 group active:scale-[0.98] transition-all"
        >
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
            <Share2 size={28} />
          </div>
          <div className="text-left">
            <h4 className="font-black text-lg text-slate-800">Share Memory</h4>
            <p className="text-xs font-bold text-slate-400">AI 기반 게시글 공유</p>
          </div>
        </button>
      </div>
    </div>
  )
}
