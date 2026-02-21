import { Plus } from 'lucide-react'
import type { TravelPhoto } from '../../types'

interface PhotoGalleryProps {
  photos: TravelPhoto[]
  onAddClick?: () => void
  onPhotoClick?: (photo: TravelPhoto) => void
}

export default function PhotoGallery({ photos, onAddClick, onPhotoClick }: PhotoGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {photos.map((photo) => (
        <div
          key={photo.id}
          onClick={() => onPhotoClick?.(photo)}
          className="aspect-square rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 relative group cursor-pointer"
        >
          <img
            src={photo.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          {photo.isSnapshot && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg border border-white/20">
              Snapshot
            </div>
          )}
        </div>
      ))}

      {/* Add Button */}
      <div
        onClick={onAddClick}
        className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[1.5rem] flex items-center justify-center text-slate-300 hover:border-blue-300 hover:text-blue-400 transition-colors cursor-pointer"
      >
        <Plus size={32} />
      </div>
    </div>
  )
}
