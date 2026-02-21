interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-lg ${className}`}
    />
  )
}

export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-50 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
        <Skeleton className="w-5 h-5 rounded-full" />
      </div>

      {/* Image */}
      <Skeleton className="aspect-[4/5] rounded-[2rem]" />

      {/* Actions & Content */}
      <div className="px-2 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-5 items-center">
            <Skeleton className="w-12 h-6 rounded-full" />
            <Skeleton className="w-12 h-6 rounded-full" />
            <Skeleton className="w-6 h-6 rounded-full" />
          </div>
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
        <Skeleton className="w-3/4 h-6 rounded-lg" />
        <Skeleton className="w-full h-20 rounded-2xl" />
      </div>
    </div>
  )
}

export function TravelCardSkeleton() {
  return (
    <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="w-3/4 h-6" />
          <Skeleton className="w-1/2 h-4" />
        </div>
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-16 h-5 rounded-full" />
        <Skeleton className="w-24 h-5 rounded-full" />
      </div>
    </div>
  )
}

export function PhotoGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl" />
      ))}
    </div>
  )
}

export function ActiveTravelSkeleton() {
  return (
    <div className="bg-gradient-to-br from-slate-200 to-slate-300 rounded-[2.5rem] p-8 animate-pulse">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-2 h-2 rounded-full bg-slate-400" />
          <Skeleton className="w-20 h-3 bg-slate-400" />
        </div>
        <Skeleton className="w-3/4 h-8 bg-slate-400" />
        <Skeleton className="w-1/2 h-6 rounded-full bg-slate-400" />
      </div>
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div className="space-y-10">
      <PostCardSkeleton />
      <PostCardSkeleton />
    </div>
  )
}
