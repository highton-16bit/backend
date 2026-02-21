import { useState, useRef } from 'react'
import { X, Plus } from 'lucide-react'
import type { TravelPhoto } from '../../types'

interface DraggablePhotoGridProps {
  photos: TravelPhoto[]
  photoOrder: string[]
  onReorder: (newOrder: string[]) => void
  onRemove: (photoId: string) => void
  onAddClick?: () => void
}

export default function DraggablePhotoGrid({
  photos,
  photoOrder,
  onReorder,
  onRemove,
  onAddClick,
}: DraggablePhotoGridProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const dragOverId = useRef<string | null>(null)

  const orderedPhotos = photoOrder
    .map((id) => photos.find((p) => p.id === id))
    .filter((p): p is TravelPhoto => p !== undefined)

  const handleDragStart = (e: React.DragEvent, photoId: string) => {
    setDraggedId(photoId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, photoId: string) => {
    e.preventDefault()
    dragOverId.current = photoId
  }

  const handleDragEnd = () => {
    if (draggedId && dragOverId.current && draggedId !== dragOverId.current) {
      const newOrder = [...photoOrder]
      const draggedIndex = newOrder.indexOf(draggedId)
      const dropIndex = newOrder.indexOf(dragOverId.current)

      newOrder.splice(draggedIndex, 1)
      newOrder.splice(dropIndex, 0, draggedId)

      onReorder(newOrder)
    }
    setDraggedId(null)
    dragOverId.current = null
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {orderedPhotos.map((photo) => (
        <div
          key={photo.id}
          draggable
          onDragStart={(e) => handleDragStart(e, photo.id)}
          onDragOver={(e) => handleDragOver(e, photo.id)}
          onDragEnd={handleDragEnd}
          className={`aspect-square rounded-xl overflow-hidden relative group cursor-grab active:cursor-grabbing transition-all ${
            draggedId === photo.id ? 'opacity-50 scale-95' : ''
          }`}
        >
          <img
            src={photo.imageUrl}
            alt=""
            className="w-full h-full object-cover pointer-events-none"
          />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(photo.id)
            }}
            className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      ))}

      {onAddClick && (
        <div
          onClick={onAddClick}
          className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 hover:border-blue-300 hover:text-blue-400 transition-colors cursor-pointer"
        >
          <Plus size={24} />
        </div>
      )}
    </div>
  )
}
