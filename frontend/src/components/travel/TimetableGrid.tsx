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

const SLOT_HEIGHT = 50 // 1시간당 높이 (px)

// 시간 문자열을 분 단위로 변환
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

// 일정의 상단 위치 (시작 시간 기준)
function getPlanTop(plan: TravelPlanItem): number {
  if (!plan.startTime) return 0
  const minutes = timeToMinutes(plan.startTime)
  return (minutes / 60) * SLOT_HEIGHT
}

// 일정의 높이 (시간 범위 기준)
function getPlanHeight(plan: TravelPlanItem): number {
  if (!plan.startTime) return SLOT_HEIGHT
  if (!plan.endTime) return SLOT_HEIGHT

  const startMinutes = timeToMinutes(plan.startTime)
  const endMinutes = timeToMinutes(plan.endTime)
  const durationHours = (endMinutes - startMinutes) / 60

  return Math.max(SLOT_HEIGHT * 0.9, durationHours * SLOT_HEIGHT - 4) // 약간의 여백
}

export default function TimetableGrid({ plans, onDeletePlan }: TimetableGridProps) {
  const dates = Array.from(new Set(plans.map((p) => p.date))).sort()

  // 날짜별로 일정 그룹화
  const plansByDate = dates.reduce(
    (acc, date) => {
      acc[date] = plans.filter((p) => p.date === date)
      return acc
    },
    {} as Record<string, TravelPlanItem[]>
  )

  const totalHeight = 24 * SLOT_HEIGHT // 24시간 전체 높이

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

          {/* Body (Time Grid with Absolute Positioned Plans) */}
          <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
            <div className="flex">
              {/* Time Labels Column */}
              <div className="w-16 flex-shrink-0 border-r border-gray-100">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-gray-50 last:border-b-0 flex items-center justify-center"
                    style={{ height: SLOT_HEIGHT }}
                  >
                    <span className="text-[10px] font-black text-slate-400">{hour}:00</span>
                  </div>
                ))}
              </div>

              {/* Day Columns with Absolute Positioned Plans */}
              {dates.map((date) => (
                <div
                  key={date}
                  className="flex-1 min-w-[120px] border-r border-gray-100 last:border-r-0 relative"
                  style={{ height: totalHeight }}
                >
                  {/* Hour Grid Lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-b border-gray-50"
                      style={{ top: parseInt(hour) * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                    />
                  ))}

                  {/* Plans (Absolutely Positioned) */}
                  {plansByDate[date]?.map((plan) => {
                    const top = getPlanTop(plan)
                    const height = getPlanHeight(plan)

                    return (
                      <div
                        key={plan.id}
                        className="absolute left-1 right-1 z-10 group/item"
                        style={{ top: top + 2, height }}
                      >
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 h-full flex flex-col justify-center animate-in zoom-in-95 overflow-hidden">
                          {onDeletePlan && (
                            <button
                              onClick={() => onDeletePlan(plan.id)}
                              className="absolute top-1 right-1 bg-white/80 text-red-500 p-1 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity z-10 shadow-sm"
                            >
                              <X size={10} />
                            </button>
                          )}
                          <p className="text-[8px] font-black text-blue-600 uppercase mb-0.5 truncate">
                            {plan.startTime}
                            {plan.endTime && ` - ${plan.endTime}`}
                          </p>
                          <p className="text-[10px] font-bold text-slate-800 leading-tight line-clamp-2">
                            {plan.memo}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
