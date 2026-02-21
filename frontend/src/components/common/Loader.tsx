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
