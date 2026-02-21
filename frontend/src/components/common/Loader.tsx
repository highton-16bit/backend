import { Loader2 } from 'lucide-react'

interface LoaderProps {
  size?: number
  className?: string
}

export default function Loader({ size = 24, className = '' }: LoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 size={size} className="animate-spin text-blue-600" />
    </div>
  )
}

export function FullPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader size={32} />
    </div>
  )
}

export function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Loading
        </span>
      </div>
    </div>
  )
}
