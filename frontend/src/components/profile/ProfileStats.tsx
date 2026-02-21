import type { UserStats } from '../../types'

interface ProfileStatsProps {
  stats: UserStats | null
  isLoading?: boolean
}

interface StatItemProps {
  label: string
  value: number | string
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="text-center">
      <p className="text-xl font-black text-slate-900">{value}</p>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  )
}

export default function ProfileStats({ stats, isLoading }: ProfileStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 animate-pulse">
        <StatItem label="Travels" value="-" />
        <StatItem label="Snaps" value="-" />
        <StatItem label="Pins" value="-" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
      <StatItem label="Travels" value={stats?.travelCount ?? 0} />
      <StatItem label="Snaps" value={stats?.snapshotCount ?? 0} />
      <StatItem label="Pins" value={stats?.bookmarkCount ?? 0} />
    </div>
  )
}
