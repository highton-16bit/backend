import React from 'react'

interface FABProps {
  icon: React.ReactNode
  onClick: () => void
  className?: string
  disabled?: boolean
}

export default function FAB({
  icon,
  onClick,
  className = '',
  disabled = false,
}: FABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-200 flex items-center justify-center transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed z-40 ${className}`}
    >
      {icon}
    </button>
  )
}
