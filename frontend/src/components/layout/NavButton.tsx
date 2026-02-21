import React from 'react'

interface NavButtonProps {
  icon: React.ReactElement
  label: string
  active: boolean
  onClick: () => void
}

export default function NavButton({ icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      className={`flex flex-col items-center gap-1 transition-all px-4 py-2 rounded-2xl ${
        active
          ? 'text-white bg-blue-600 shadow-lg shadow-blue-500/30 scale-105'
          : 'text-slate-400 hover:text-slate-200'
      }`}
      onClick={onClick}
    >
      {React.cloneElement(icon, { size: 18, strokeWidth: active ? 3 : 2 })}
      <span
        className={`text-[8px] font-black uppercase tracking-tighter transition-all ${
          active ? 'opacity-100 mt-0.5' : 'opacity-0 h-0'
        }`}
      >
        {label}
      </span>
    </button>
  )
}
