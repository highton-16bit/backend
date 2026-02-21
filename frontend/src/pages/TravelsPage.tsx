import { useState } from 'react'
import { X } from 'lucide-react'
import type { Travel, TravelPlanItem, TravelPhoto } from '../types'
import { TravelCard, PhotoGallery, PhotoUploader, TimetableGrid } from '../components/travel'
import { travelService, photoService } from '../services'
import { getErrorMessage } from '../services/api'
import { validateTimeRange } from '../utils/validation'

interface TravelsPageProps {
  travels: Travel[]
  onRefresh: () => void
}

type SubTab = 'gallery' | 'plan'

export default function TravelsPage({ travels, onRefresh: _onRefresh }: TravelsPageProps) {
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null)
  const [plans, setPlans] = useState<TravelPlanItem[]>([])
  const [photos, setPhotos] = useState<TravelPhoto[]>([])
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('gallery')
  const [isPhotoUploaderOpen, setIsPhotoUploaderOpen] = useState(false)

  // Plan Form State
  const [newPlanMemo, setNewPlanMemo] = useState('')
  const [newPlanDate, setNewPlanDate] = useState('')
  const [newPlanStartTime, setNewPlanStartTime] = useState('')
  const [newPlanEndTime, setNewPlanEndTime] = useState('')

  const handleTravelSelect = async (travel: Travel) => {
    setSelectedTravel(travel)
    try {
      const [plansData, photosData] = await Promise.all([
        travelService.getPlans(travel.id),
        travelService.getPhotos(travel.id),
      ])
      setPlans(plansData)
      setPhotos(photosData)
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddPlan = async () => {
    if (!newPlanMemo.trim() || !selectedTravel || !newPlanDate) {
      alert('날짜와 메모를 입력해주세요')
      return
    }

    // Time validation
    const timeError = validateTimeRange(newPlanStartTime, newPlanEndTime)
    if (timeError) {
      alert(timeError)
      return
    }

    try {
      await travelService.createPlan(selectedTravel.id, {
        date: newPlanDate,
        startTime: newPlanStartTime || undefined,
        endTime: newPlanEndTime || undefined,
        memo: newPlanMemo,
      })

      // Reset form and refresh
      setNewPlanMemo('')
      setNewPlanStartTime('')
      setNewPlanEndTime('')
      const updatedPlans = await travelService.getPlans(selectedTravel.id)
      setPlans(updatedPlans)
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } }
      if (err.response?.status === 400) {
        alert('시간 설정이 잘못되었습니다: 시작 시간이 종료 시간보다 늦을 수 없습니다.')
      } else {
        alert(getErrorMessage(error))
      }
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!selectedTravel || !confirm('이 일정을 삭제할까요?')) return

    try {
      await travelService.deletePlan(selectedTravel.id, planId)
      const updatedPlans = await travelService.getPlans(selectedTravel.id)
      setPlans(updatedPlans)
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const handlePhotoUpload = async (file: File, isSnapshot: boolean) => {
    if (!selectedTravel) return

    await photoService.upload(file, selectedTravel.id, isSnapshot)
    const updatedPhotos = await travelService.getPhotos(selectedTravel.id)
    setPhotos(updatedPhotos)
  }

  // Travel Detail View
  if (selectedTravel) {
    return (
      <div className="p-6 space-y-8 animate-in slide-in-from-right-4">
        <button
          onClick={() => setSelectedTravel(null)}
          className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"
        >
          <X size={16} /> Back
        </button>

        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black tracking-tight">{selectedTravel.title}</h2>
        </div>

        {/* Sub Tab Toggle */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto">
          <button
            onClick={() => setActiveSubTab('gallery')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
              activeSubTab === 'gallery'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-slate-400'
            }`}
          >
            Gallery
          </button>
          <button
            onClick={() => setActiveSubTab('plan')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
              activeSubTab === 'plan'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-slate-400'
            }`}
          >
            Plan
          </button>
        </div>

        {activeSubTab === 'gallery' ? (
          <>
            <PhotoGallery
              photos={photos}
              onAddClick={() => setIsPhotoUploaderOpen(true)}
            />
            <PhotoUploader
              isOpen={isPhotoUploaderOpen}
              onClose={() => setIsPhotoUploaderOpen(false)}
              onUpload={handlePhotoUpload}
            />
          </>
        ) : (
          <div className="space-y-6">
            {/* Add Plan Form */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
              <h4 className="font-black text-sm uppercase tracking-widest text-blue-600 px-1">
                Add Schedule
              </h4>
              <div className="flex flex-col gap-3">
                <input
                  type="date"
                  className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold"
                  value={newPlanDate}
                  onChange={(e) => setNewPlanDate(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 px-1">
                      Start
                    </label>
                    <input
                      type="time"
                      className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold"
                      value={newPlanStartTime}
                      onChange={(e) => setNewPlanStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 px-1">
                      End
                    </label>
                    <input
                      type="time"
                      className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold"
                      value={newPlanEndTime}
                      onChange={(e) => setNewPlanEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <input
                  className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold"
                  placeholder="메모 (예: 성산일출봉 가기)"
                  value={newPlanMemo}
                  onChange={(e) => setNewPlanMemo(e.target.value)}
                />
                <button
                  onClick={handleAddPlan}
                  className="bg-blue-600 text-white p-4 rounded-xl font-black text-xs shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  Add Plan
                </button>
              </div>
            </div>

            {/* Timetable Grid */}
            <TimetableGrid plans={plans} onDeletePlan={handleDeletePlan} />

            <p className="text-[9px] font-bold text-slate-400 text-center px-4 uppercase tracking-widest italic">
              Tip: 가로로 스크롤하여 날짜별 일정을 확인하세요
            </p>
          </div>
        )}
      </div>
    )
  }

  // Travel List View
  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4">
      <div className="space-y-1">
        <h2 className="text-3xl font-black italic tracking-tighter">Memories</h2>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">
          Personal Archive
        </p>
      </div>

      {travels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 font-bold">아직 여행이 없습니다</p>
          <p className="text-slate-300 text-sm mt-1">새 여행을 시작해보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {travels.map((travel) => (
            <TravelCard
              key={travel.id}
              travel={travel}
              onClick={() => handleTravelSelect(travel)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
