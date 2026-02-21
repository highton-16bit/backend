import { Check, ArrowLeft } from 'lucide-react'
import type { TravelPhoto } from '../../types'
import { Button } from '../common'

interface PhotoSelectorProps {
  photos: TravelPhoto[]
  selectedIds: string[]
  onToggle: (photoId: string) => void
  onBack: () => void
  onContinue: () => void
}

export default function PhotoSelector({
  photos,
  selectedIds,
  onToggle,
  onBack,
  onContinue,
}: PhotoSelectorProps) {
  if (photos.length === 0) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-center py-12">
          <p className="text-slate-400 font-bold">사진이 없습니다</p>
          <p className="text-slate-300 text-sm mt-1">먼저 여행에 사진을 추가해주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="space-y-1 px-1">
        <h3 className="text-xl font-black tracking-tight">사진 선택</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Step 2 of 3 — Select Photos ({selectedIds.length} selected)
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => {
          const isSelected = selectedIds.includes(photo.id)
          return (
            <div
              key={photo.id}
              onClick={() => onToggle(photo.id)}
              className={`aspect-square rounded-xl overflow-hidden relative cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
            >
              <img
                src={photo.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <div
                className={`absolute inset-0 transition-colors ${
                  isSelected ? 'bg-blue-600/20' : 'bg-transparent'
                }`}
              />
              <div
                className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/80 border border-gray-200'
                }`}
              >
                {isSelected && <Check size={14} />}
              </div>
            </div>
          )
        })}
      </div>

      <Button
        onClick={onContinue}
        disabled={selectedIds.length === 0}
        className="w-full"
      >
        계속 ({selectedIds.length}장 선택됨)
      </Button>
    </div>
  )
}
