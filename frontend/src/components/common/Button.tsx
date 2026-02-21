import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  className?: string
  fullWidth?: boolean
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  fullWidth = false,
}: ButtonProps) {
  const baseStyles = 'font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'

  const variants = {
    primary: 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:bg-blue-700',
    secondary: 'bg-white text-slate-800 border border-gray-100 shadow-sm hover:bg-slate-50',
    danger: 'bg-red-50 text-red-500 hover:bg-red-100',
    ghost: 'text-slate-400 hover:text-slate-600',
  }

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-4 text-sm',
    lg: 'p-5 text-lg',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {isLoading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
