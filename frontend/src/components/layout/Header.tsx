import { User, Loader2 } from 'lucide-react'

interface HeaderProps {
  isLoading?: boolean
}

export default function Header({ isLoading = false }: HeaderProps) {
  return (
    <header className="px-6 py-4 flex justify-between items-center bg-white/90 backdrop-blur-xl sticky top-0 z-30 border-b border-gray-100">
      <h1 className="text-2xl font-black text-blue-600 tracking-tighter italic">Plog</h1>
      <div className="flex items-center gap-3">
        {isLoading && <Loader2 className="animate-spin text-blue-500" size={18} />}
        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
          <User size={16} className="text-blue-600" />
        </div>
      </div>
    </header>
  )
}
