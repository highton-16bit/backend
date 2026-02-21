import { ArrowLeft } from 'lucide-react'
import type { TravelPhoto, TravelPlanItem } from '../../types'
import { Input, Button } from '../common'
import DraggablePhotoGrid from './DraggablePhotoGrid'

interface PostEditorProps {
  photos: TravelPhoto[]
  photoOrder: string[]
  plans: TravelPlanItem[]
  title: string
  content: string
  isSubmitting: boolean
  onPhotoReorder: (newOrder: string[]) => void
  onPhotoRemove: (photoId: string) => void
  onAddPhotoClick?: () => void
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onBack: () => void
  onSubmit: () => void
}

function generateScheduleText(plans: TravelPlanItem[]): string {
  if (plans.length === 0) return ''

  const sorted = [...plans].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return (a.startTime || '').localeCompare(b.startTime || '')
  })

  return sorted
    .map((p) => {
      const time = p.startTime ? ` ${p.startTime}` : ''
      return `${p.date}${time} - ${p.memo || '(일정)'}`
    })
    .join('\n')
}

export default function PostEditor({
  photos,
  photoOrder,
  plans,
  title,
  content,
  isSubmitting,
  onPhotoReorder,
  onPhotoRemove,
  onAddPhotoClick,
  onTitleChange,
  onContentChange,
  onBack,
  onSubmit,
}: PostEditorProps) {
  const scheduleText = generateScheduleText(plans)

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="space-y-1 px-1">
        <h3 className="text-xl font-black tracking-tight">게시글 편집</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Step 3 of 3 — Edit & Publish
        </p>
      </div>

      {/* Photo Grid - Draggable */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">
          사진 순서 (드래그로 변경)
        </p>
        <DraggablePhotoGrid
          photos={photos}
          photoOrder={photoOrder}
          onReorder={onPhotoReorder}
          onRemove={onPhotoRemove}
          onAddClick={onAddPhotoClick}
        />
      </div>

      {/* Title */}
      <Input
        label="제목"
        placeholder="게시글 제목"
        value={title}
        onChange={onTitleChange}
      />

      {/* Content */}
      <div className="space-y-2 px-1">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          내용
        </label>
        <textarea
          className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
          rows={6}
          placeholder="여행 이야기를 적어주세요..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
        />
      </div>

      {/* Schedule Preview */}
      {scheduleText && (
        <div className="bg-slate-50 p-4 rounded-2xl">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
            일정 요약 (참고용)
          </p>
          <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
            {scheduleText}
          </pre>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || photoOrder.length === 0 || !title.trim()}
        isLoading={isSubmitting}
        className="w-full"
      >
        게시하기
      </Button>
    </div>
  )
}

export { generateScheduleText }
