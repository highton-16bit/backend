import { ChevronRight } from 'lucide-react'
import type { Travel } from '../../types'

interface TravelCardProps {
  travel: Travel
  onClick?: () => void
}

export default function TravelCard({ travel, onClick }: TravelCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-[2rem] shadow-md border border-gray-50 flex justify-between items-center group active:scale-95 transition-all cursor-pointer"
    >
      <div>
        <h4 className="font-black text-lg text-slate-800">{travel.title}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {travel.startDate} - {travel.endDate}
        </p>
        {travel.regionName && (
          <p className="text-xs text-blue-600 font-bold mt-1">{travel.regionName}</p>
        )}
      </div>
      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <ChevronRight size={20} />
      </div>
    </div>
  )
}
