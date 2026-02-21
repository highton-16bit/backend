import { useRef, useEffect, useCallback } from 'react'

interface WheelColumnProps {
  values: string[]
  selected: string
  onChange: (value: string) => void
  itemHeight?: number
}

export default function WheelColumn({
  values,
  selected,
  onChange,
  itemHeight = 40,
}: WheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)

  const visibleItems = 5
  const containerHeight = itemHeight * visibleItems

  const scrollToValue = useCallback((value: string, smooth = true) => {
    const index = values.indexOf(value)
    if (index !== -1 && containerRef.current) {
      const scrollTop = index * itemHeight
      containerRef.current.scrollTo({
        top: scrollTop,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }, [values, itemHeight])

  useEffect(() => {
    scrollToValue(selected, false)
  }, [])

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isScrollingRef.current) return

    const scrollTop = containerRef.current.scrollTop
    const index = Math.round(scrollTop / itemHeight)
    const clampedIndex = Math.max(0, Math.min(index, values.length - 1))

    if (values[clampedIndex] !== selected) {
      onChange(values[clampedIndex])
    }
  }, [values, itemHeight, selected, onChange])

  const handleScrollEnd = useCallback(() => {
    if (!containerRef.current) return

    const scrollTop = containerRef.current.scrollTop
    const index = Math.round(scrollTop / itemHeight)
    const clampedIndex = Math.max(0, Math.min(index, values.length - 1))
    const targetScrollTop = clampedIndex * itemHeight

    if (Math.abs(scrollTop - targetScrollTop) > 1) {
      isScrollingRef.current = true
      containerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      })
      setTimeout(() => {
        isScrollingRef.current = false
      }, 150)
    }
  }, [values.length, itemHeight])

  return (
    <div className="relative" style={{ height: containerHeight }}>
      {/* Center highlight bar */}
      <div
        className="absolute left-0 right-0 bg-blue-50 border-y border-blue-200 pointer-events-none z-0"
        style={{
          top: itemHeight * 2,
          height: itemHeight,
        }}
      />

      {/* Fade masks */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: itemHeight * 2,
          background: 'linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0))',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: itemHeight * 2,
          background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))',
        }}
      />

      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
        onScroll={handleScroll}
        onTouchEnd={handleScrollEnd}
        onMouseUp={handleScrollEnd}
        style={{
          scrollSnapType: 'y mandatory',
          paddingTop: itemHeight * 2,
          paddingBottom: itemHeight * 2,
        }}
      >
        {values.map((value) => (
          <div
            key={value}
            className={`flex items-center justify-center snap-center transition-all duration-150 ${
              value === selected
                ? 'text-blue-600 font-black text-lg'
                : 'text-slate-400 font-bold text-sm'
            }`}
            style={{ height: itemHeight }}
            onClick={() => {
              onChange(value)
              scrollToValue(value)
            }}
          >
            {value}
          </div>
        ))}
      </div>
    </div>
  )
}
