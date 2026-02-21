import { ChevronRight } from 'lucide-react'
import type { Travel } from '../../types'

interface TravelSelectorProps {
  travels: Travel[]
  onSelect: (travel: Travel) => void
}

export default function TravelSelector({ travels, onSelect }: TravelSelectorProps) {
  if (travels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 font-bold">공유할 여행이 없습니다</p>
        <p className="text-slate-300 text-sm mt-1">먼저 여행을 만들어주세요</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 px-1">
        <h3 className="text-xl font-black tracking-tight">여행 선택</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Step 1 of 3 — Select a Travel
        </p>
      </div>

      <div className="space-y-3">
        {travels.map((travel) => (
          <div
            key={travel.id}
            onClick={() => onSelect(travel)}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group active:scale-[0.98] transition-all cursor-pointer"
          >
            <div>
              <h4 className="font-black text-base text-slate-800">{travel.title}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {travel.startDate} - {travel.endDate}
              </p>
              {travel.regionName && (
                <span className="inline-block text-[10px] text-blue-600 font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded-full">
                  {travel.regionName}
                </span>
              )}
            </div>
            <div className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ChevronRight size={18} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
