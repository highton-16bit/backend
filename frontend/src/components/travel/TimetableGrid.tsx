import { Clock, X } from 'lucide-react'
import type { TravelPlanItem } from '../../types'

interface TimetableGridProps {
  plans: TravelPlanItem[]
  onDeletePlan?: (planId: string) => void
}

const HOURS = [
  '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
  '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23',
]

export default function TimetableGrid({ plans, onDeletePlan }: TimetableGridProps) {
  const dates = Array.from(new Set(plans.map((p) => p.date))).sort()

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="min-w-[400px]">
          {/* Header Row (Days) */}
          <div className="flex border-b border-gray-50 bg-slate-50/50">
            <div className="w-16 flex-shrink-0 border-r border-gray-100 p-3 flex items-center justify-center">
              <Clock size={14} className="text-slate-400" />
            </div>
            {dates.length > 0 ? (
              dates.map((date) => (
                <div
                  key={date}
                  className="flex-1 min-w-[120px] p-3 text-center border-r border-gray-100 last:border-r-0"
                >
                  <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-0.5">
                    Day
                  </p>
                  <p className="text-[10px] font-black text-slate-800 tracking-tight">
                    {date.split('-').slice(1).join('/')}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex-1 p-3 text-center text-[10px] font-bold text-slate-400">
                등록된 일정이 없습니다
              </div>
            )}
          </div>

          {/* Body (Time Slots) */}
          <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
            {HOURS.map((hour) => (
              <div key={hour} className="flex border-b border-gray-50 last:border-b-0">
                {/* Time Label */}
                <div className="w-16 flex-shrink-0 border-r border-gray-100 p-2 flex items-center justify-center">
                  <span className="text-[10px] font-black text-slate-400">{hour}:00</span>
                </div>

                {/* Plans for each Day */}
                {dates.map((date) => {
                  const planInSlot = plans.find(
                    (p) => p.date === date && p.startTime?.startsWith(hour)
                  )

                  return (
                    <div
                      key={`${date}-${hour}`}
                      className="flex-1 min-w-[120px] p-1 border-r border-gray-100 last:border-r-0 min-h-[50px] relative group/item"
                    >
                      {planInSlot && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 h-full flex flex-col justify-center animate-in zoom-in-95">
                          {onDeletePlan && (
                            <button
                              onClick={() => onDeletePlan(planInSlot.id)}
                              className="absolute top-1 right-1 bg-white/80 text-red-500 p-1 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity z-10 shadow-sm"
                            >
                              <X size={10} />
                            </button>
                          )}
                          <p className="text-[8px] font-black text-blue-600 uppercase mb-0.5">
                            {planInSlot.startTime}
                            {planInSlot.endTime && ` - ${planInSlot.endTime}`}
                          </p>
                          <p className="text-[10px] font-bold text-slate-800 leading-tight line-clamp-2">
                            {planInSlot.memo}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
