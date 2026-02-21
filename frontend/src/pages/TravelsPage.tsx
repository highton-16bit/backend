import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import type { Travel, TravelPlanItem, TravelPhoto } from '../types'
import { TravelCard, PhotoGallery, PhotoUploader, TimetableGrid } from '../components/travel'
import { travelService, photoService } from '../services'
import { getErrorMessage } from '../services/api'
import { validateTimeRange } from '../utils/validation'
import { FAB, DatePicker, TimePicker, Modal, Input, Button, TravelCardSkeleton, Skeleton } from '../components/common'

interface TravelsPageProps {
  travels: Travel[]
  onRefresh: () => void
  isLoading?: boolean
}

type SubTab = 'gallery' | 'plan'

export default function TravelsPage({ travels, onRefresh: _onRefresh, isLoading }: TravelsPageProps) {
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null)
  const [plans, setPlans] = useState<TravelPlanItem[]>([])
  const [photos, setPhotos] = useState<TravelPhoto[]>([])
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('gallery')
  const [isPhotoUploaderOpen, setIsPhotoUploaderOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Plan Form State
  const [newPlanMemo, setNewPlanMemo] = useState('')
  const [newPlanDate, setNewPlanDate] = useState('')
  const [newPlanStartTime, setNewPlanStartTime] = useState('')
  const [newPlanEndTime, setNewPlanEndTime] = useState('')

  // Create Travel Form State
  const [newTravelTitle, setNewTravelTitle] = useState('')
  const [newTravelStartDate, setNewTravelStartDate] = useState('')
  const [newTravelEndDate, setNewTravelEndDate] = useState('')
  const [newTravelRegion, setNewTravelRegion] = useState('')
  const [isCreating, setIsCreating] = useState(false)

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

  const handleCreateTravel = async () => {
    if (!newTravelTitle.trim() || !newTravelStartDate || !newTravelEndDate) {
      alert('제목과 날짜를 입력해주세요')
      return
    }

    if (newTravelStartDate > newTravelEndDate) {
      alert('시작일이 종료일보다 늦을 수 없습니다')
      return
    }

    setIsCreating(true)
    try {
      await travelService.create({
        title: newTravelTitle,
        startDate: newTravelStartDate,
        endDate: newTravelEndDate,
        regionName: newTravelRegion || undefined,
      })
      setNewTravelTitle('')
      setNewTravelStartDate('')
      setNewTravelEndDate('')
      setNewTravelRegion('')
      setIsCreateModalOpen(false)
      _onRefresh()
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
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
                <DatePicker
                  label="날짜"
                  value={newPlanDate}
                  onChange={setNewPlanDate}
                  placeholder="날짜 선택"
                  minDate={selectedTravel.startDate}
                  maxDate={selectedTravel.endDate}
                />
                <div className="grid grid-cols-2 gap-2">
                  <TimePicker
                    label="시작"
                    value={newPlanStartTime}
                    onChange={setNewPlanStartTime}
                    placeholder="시작 시간"
                  />
                  <TimePicker
                    label="종료"
                    value={newPlanEndTime}
                    onChange={setNewPlanEndTime}
                    placeholder="종료 시간"
                  />
                </div>
                <Input
                  label="메모"
                  placeholder="예: 성산일출봉 가기"
                  value={newPlanMemo}
                  onChange={setNewPlanMemo}
                />
                <Button
                  onClick={handleAddPlan}
                  className="w-full"
                >
                  Add Plan
                </Button>
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

  // Travel List View - Skeleton
  if (isLoading) {
    return (
      <div className="p-6 space-y-8 animate-in fade-in duration-300">
        <div className="space-y-1">
          <Skeleton className="w-40 h-10" />
          <Skeleton className="w-28 h-4" />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <TravelCardSkeleton />
          <TravelCardSkeleton />
          <TravelCardSkeleton />
        </div>
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

      {/* FAB for adding new travel */}
      <FAB
        icon={<Plus size={24} />}
        onClick={() => setIsCreateModalOpen(true)}
      />

      {/* Create Travel Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="새 여행 만들기"
      >
        <div className="p-4 space-y-4">
          <Input
            label="여행 제목"
            placeholder="예: 제주도 여행"
            value={newTravelTitle}
            onChange={setNewTravelTitle}
          />
          <DatePicker
            label="시작일"
            value={newTravelStartDate}
            onChange={setNewTravelStartDate}
            placeholder="시작일 선택"
          />
          <DatePicker
            label="종료일"
            value={newTravelEndDate}
            onChange={setNewTravelEndDate}
            placeholder="종료일 선택"
            minDate={newTravelStartDate}
          />
          <Input
            label="지역 (선택)"
            placeholder="예: 제주도"
            value={newTravelRegion}
            onChange={setNewTravelRegion}
          />
          <Button
            onClick={handleCreateTravel}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? '생성 중...' : '여행 만들기'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
